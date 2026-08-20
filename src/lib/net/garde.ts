/**
 * Garde anti-fuite documentaire (brief §2).
 *
 * Toute charge sortante traverse ce fichier. Quatre barrieres successives,
 * volontairement redondantes — la premiere qui se declenche suffit :
 *
 *   1. liste noire de noms de champs, exploree en profondeur ;
 *   2. allowlist de champs, endpoint par endpoint ;
 *   3. interdiction de toute imbrication (seuls des scalaires sortent) ;
 *   4. heuristiques de contenu : plafond de longueur, retour a la ligne.
 *
 * Aucune de ces barrieres ne doit etre assouplie pour faire passer une
 * fonctionnalite. Voir src/lib/net/README.md.
 */
import { CATALOGUE_ENDPOINTS, LONGUEUR_MAX_ABSOLUE, type NomEndpoint } from './catalogue'
import type { SpecChamp } from './types'
import { ErreurEndpointInconnu, ErreurFuiteDocumentaire } from './erreurs'

/**
 * Racines interdites, comparees en sous-chaine sur le nom de champ normalise.
 * Les cinq familles nommees par le brief §2 — text, clause, extrait, citation,
 * nomFichier — en font partie, avec leurs variantes de redaction courantes.
 */
export const CLES_INTERDITES = [
  // contenu brut
  'text', 'texte', 'contenu', 'content', 'corps', 'body', 'brut', 'raw',
  // fragments de document
  'clause', 'extrait', 'excerpt', 'citation', 'quote', 'verbatim',
  'passage', 'alinea', 'article', 'paragraphe', 'segment',
  // fichiers et pieces
  'nomfichier', 'filename', 'fichier', 'file', 'piece', 'document', 'upload', 'blob',
  // pieces du croisement
  'bail', 'police', 'avenant', 'attestation', 'conditionsparticulieres', 'conditionsgenerales',
  // production intellectuelle
  'redaction', 'observation', 'analyse', 'resultat', 'rapport', 'synthese',
  'note', 'commentaire', 'annotation', 'preconisation', 'enjeu', 'consequence',
  // identification du client final
  'raisonsociale', 'client', 'adresse', 'activite', 'siret',
  // mail importe
  'outlook', 'courriel', 'expediteur', 'destinataire',
  // etat de session client
  'dossier', 'perimetre', 'hypothese', 'preuve',
  // valeurs chiffrees du dossier
  'montant', 'capitaux', 'loyer', 'franchise', 'plafond', 'garantie',
] as const

const normaliser = (cle: string): string =>
  cle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const racineInterdite = (cle: string): string | undefined => {
  const normalisee = normaliser(cle)
  return CLES_INTERDITES.find((racine) => normalisee.includes(racine))
}

/** Barriere 1 : exploration en profondeur, avant toute autre verification. */
const explorerClesInterdites = (endpoint: string, valeur: unknown, chemin: string): void => {
  if (Array.isArray(valeur)) {
    valeur.forEach((element, index) => explorerClesInterdites(endpoint, element, `${chemin}[${index}]`))
    return
  }
  if (valeur === null || typeof valeur !== 'object') return

  for (const [cle, sousValeur] of Object.entries(valeur as Record<string, unknown>)) {
    const cheminComplet = chemin ? `${chemin}.${cle}` : cle
    const racine = racineInterdite(cle)
    if (racine !== undefined) {
      throw new ErreurFuiteDocumentaire(
        endpoint,
        cheminComplet,
        `le nom de champ contient « ${racine} », réservé au contenu documentaire`,
      )
    }
    explorerClesInterdites(endpoint, sousValeur, cheminComplet)
  }
}

/**
 * Verifie qu'une charge peut legitimement quitter le navigateur.
 * Leve ErreurFuiteDocumentaire au premier doute — le garde ne devine jamais.
 */
export function verifierChargeSortante(nom: NomEndpoint, charge?: unknown): void {
  const definition = CATALOGUE_ENDPOINTS[nom]
  if (definition === undefined) throw new ErreurEndpointInconnu(String(nom))

  if (charge === undefined || charge === null) return

  if (typeof charge !== 'object' || Array.isArray(charge)) {
    throw new ErreurFuiteDocumentaire(nom, '(racine)', 'une charge sortante doit être un objet plat de métadonnées')
  }

  // Barriere 1 — liste noire, en profondeur.
  explorerClesInterdites(nom, charge, '')

  const entrees = Object.entries(charge as Record<string, unknown>)
  const champsDeclares: Readonly<Record<string, SpecChamp | undefined>> = definition.champs

  const premiere = entrees[0]
  if (premiere !== undefined && Object.keys(definition.champs).length === 0) {
    throw new ErreurFuiteDocumentaire(nom, premiere[0], 'cet endpoint n’accepte aucun corps de requête')
  }

  for (const [cle, valeur] of entrees) {
    // Barriere 2 — allowlist par endpoint.
    const spec = champsDeclares[cle]
    if (spec === undefined) {
      throw new ErreurFuiteDocumentaire(nom, cle, 'champ non déclaré dans le catalogue')
    }

    // Barriere 3 — aucune imbrication.
    if (valeur === null || typeof valeur === 'object') {
      throw new ErreurFuiteDocumentaire(nom, cle, 'seules des valeurs scalaires quittent le navigateur')
    }

    const typeAttendu = spec.type === 'chaine' ? 'string' : spec.type === 'nombre' ? 'number' : 'boolean'
    if (typeof valeur !== typeAttendu) {
      throw new ErreurFuiteDocumentaire(nom, cle, `type attendu « ${spec.type} », reçu « ${typeof valeur} »`)
    }

    if (spec.valeurs !== undefined && !spec.valeurs.includes(valeur as never)) {
      throw new ErreurFuiteDocumentaire(nom, cle, 'valeur hors de l’énumération déclarée')
    }

    // Barriere 4 — heuristiques de contenu documentaire.
    if (typeof valeur === 'string') {
      const plafond = Math.min(spec.longueurMax ?? LONGUEUR_MAX_ABSOLUE, LONGUEUR_MAX_ABSOLUE)
      if (valeur.length > plafond) {
        throw new ErreurFuiteDocumentaire(nom, cle, `${valeur.length} caractères pour un plafond de ${plafond}`)
      }
      if (/[\r\n\t]/.test(valeur)) {
        throw new ErreurFuiteDocumentaire(nom, cle, 'une métadonnée ne contient pas de retour à la ligne')
      }
    }
  }

  for (const [cle, spec] of Object.entries(champsDeclares)) {
    if (spec?.obligatoire === true && !(cle in (charge as Record<string, unknown>))) {
      throw new ErreurFuiteDocumentaire(nom, cle, 'champ obligatoire manquant')
    }
  }
}
