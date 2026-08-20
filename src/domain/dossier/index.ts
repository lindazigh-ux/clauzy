/**
 * Operations sur un dossier (brief §6).
 *
 * Toutes les fonctions sont PURES : elles rendent un nouveau dossier et ne
 * modifient jamais l'ancien. Cela donne l'annulation gratuitement, et rend
 * chaque geste du praticien testable sans interface.
 *
 * Regle qui traverse ce fichier : le compte de 40 ne bouge JAMAIS. Aucun geste
 * manuel ne peut faire disparaitre un controle du rapport — au pire il le
 * marque « ecarte par le praticien », avec son motif (§5.2, §6).
 */
import {
  LIBELLE_STATUT,
  NOMBRE_CONTROLES,
  Origine,
  REFERENTIEL,
  Statut,
  controle,
  type Controle,
  type Gravite,
} from '../controles'
import type { Analyse, ResultatMoteur } from '../moteur/moteur'
import type { DocumentImporte } from '@/lib/import'

import {
  CLIENT_VIDE,
  MotifRequis,
  PERIMETRE_VIDE,
  type Ajustement,
  type CoteRattachement,
  type Dossier,
  type FicheClient,
  type Observation,
  type Perimetre,
  type Rattachement,
} from './types'

export * from './types'

const maintenant = (): string => new Date().toISOString()

export function dossierVierge(reference = ''): Dossier {
  return {
    version: 1,
    reference,
    client: CLIENT_VIDE,
    documents: [],
    analyse: null,
    ajustements: {},
    observations: [],
    perimetre: PERIMETRE_VIDE,
    majLe: maintenant(),
  }
}

const touche = (dossier: Dossier, modifications: Partial<Dossier>): Dossier => ({
  ...dossier,
  ...modifications,
  majLe: maintenant(),
})

const ajustementVierge = (controleId: string, auteur: string): Ajustement => ({
  controleId,
  auteur,
  horodatage: maintenant(),
  statutForce: null,
  graviteForcee: null,
  analyseReecrite: null,
  redactionReecrite: null,
  ecarte: false,
  motif: '',
  rattachements: [],
})

const avecAjustement = (
  dossier: Dossier,
  controleId: string,
  auteur: string,
  modifier: (courant: Ajustement) => Ajustement,
): Dossier => {
  // Leve si l'identifiant n'existe pas : un ajustement orphelin serait invisible
  // au rapport, donc perdu.
  controle(controleId)

  const courant = dossier.ajustements[controleId] ?? ajustementVierge(controleId, auteur)
  const modifie = { ...modifier(courant), auteur, horodatage: maintenant() }

  return touche(dossier, { ajustements: { ...dossier.ajustements, [controleId]: modifie } })
}

// ---------------------------------------------------------------------------
// Documents et analyse
// ---------------------------------------------------------------------------

export function ajouterDocument(dossier: Dossier, document: DocumentImporte): Dossier {
  return touche(dossier, { documents: [...dossier.documents, document] })
}

export function retirerDocument(dossier: Dossier, documentId: string): Dossier {
  return touche(dossier, {
    documents: dossier.documents.filter((d) => d.id !== documentId),
  })
}

/**
 * Enregistre une nouvelle sortie du moteur SANS toucher aux ajustements.
 *
 * C'est le point le plus important de ce fichier. Une analyse prend une a deux
 * heures ; importer une attestation en retard et relancer ne doit pas effacer
 * ce travail.
 */
export function enregistrerAnalyse(dossier: Dossier, analyse: Analyse): Dossier {
  return touche(dossier, { analyse })
}

// ---------------------------------------------------------------------------
// Les quatre gestes du poste de travail (brief §6)
// ---------------------------------------------------------------------------

/** 1. Editer une ligne : reformuler l'analyse, reecrire la redaction proposee. */
export function reecrire(
  dossier: Dossier,
  controleId: string,
  auteur: string,
  champs: { readonly analyse?: string; readonly redaction?: string },
): Dossier {
  return avecAjustement(dossier, controleId, auteur, (courant) => ({
    ...courant,
    analyseReecrite: champs.analyse ?? courant.analyseReecrite,
    redactionReecrite: champs.redaction ?? courant.redactionReecrite,
  }))
}

/** 1 bis. Changer la gravite retenue. */
export function forcerGravite(
  dossier: Dossier,
  controleId: string,
  auteur: string,
  gravite: Gravite,
): Dossier {
  return avecAjustement(dossier, controleId, auteur, (courant) => ({
    ...courant,
    graviteForcee: gravite,
  }))
}

/**
 * 1 ter. Ecarter un faux positif — avec motif obligatoire.
 *
 * Le controle ne disparait pas : il reste dans les 40 lignes du rapport, marque
 * « ecarte par le praticien », motif a l'appui. C'est ce qui rend l'ecartement
 * opposable plutot que suspect.
 */
export function ecarter(
  dossier: Dossier,
  controleId: string,
  auteur: string,
  motif: string,
): Dossier {
  if (motif.trim().length === 0) throw new MotifRequis(controleId, 'Écarter un faux positif')
  return avecAjustement(dossier, controleId, auteur, (courant) => ({
    ...courant,
    ecarte: true,
    motif: motif.trim(),
  }))
}

export function reprendre(dossier: Dossier, controleId: string, auteur: string): Dossier {
  return avecAjustement(dossier, controleId, auteur, (courant) => ({ ...courant, ecarte: false }))
}

/** 1 quater. Forcer un statut, motif obligatoire. */
export function forcerStatut(
  dossier: Dossier,
  controleId: string,
  auteur: string,
  statut: Statut,
  motif: string,
): Dossier {
  if (motif.trim().length === 0) {
    throw new MotifRequis(controleId, `Forcer le statut « ${LIBELLE_STATUT[statut]} »`)
  }
  return avecAjustement(dossier, controleId, auteur, (courant) => ({
    ...courant,
    statutForce: statut,
    motif: motif.trim(),
  }))
}

/**
 * 2. Rattacher une clause a la main (brief §6).
 *
 * Le geste qui regle l'essentiel du probleme des baux atypiques sans toucher au
 * moteur. Un passage rattache cote obligation suffit a faire passer le controle
 * de NON_DETECTE a ECART ; rattacher en plus une piece de couverture le porte a
 * CONFORME. Le praticien garde la main : `forcerStatut` prime toujours.
 */
export function rattacher(
  dossier: Dossier,
  controleId: string,
  auteur: string,
  rattachement: Rattachement,
): Dossier {
  if (rattachement.texte.trim().length === 0) {
    throw new MotifRequis(controleId, 'Rattacher un passage vide')
  }
  return avecAjustement(dossier, controleId, auteur, (courant) => ({
    ...courant,
    rattachements: [...courant.rattachements, rattachement],
  }))
}

export function detacher(
  dossier: Dossier,
  controleId: string,
  auteur: string,
  index: number,
): Dossier {
  return avecAjustement(dossier, controleId, auteur, (courant) => ({
    ...courant,
    rattachements: courant.rattachements.filter((_, i) => i !== index),
  }))
}

/** 3. Observation libre, hors des 40 controles. */
export function ajouterObservation(
  dossier: Dossier,
  observation: Omit<Observation, 'id' | 'creeLe'>,
): Dossier {
  const identifiant = `obs-${dossier.observations.length + 1}-${Date.now().toString(36)}`
  return touche(dossier, {
    observations: [...dossier.observations, { ...observation, id: identifiant, creeLe: maintenant() }],
  })
}

export function retirerObservation(dossier: Dossier, id: string): Dossier {
  return touche(dossier, { observations: dossier.observations.filter((o) => o.id !== id) })
}

/** 4. Perimetre : pieces recues, manquantes, controles sans objet, hypotheses. */
export function majPerimetre(dossier: Dossier, perimetre: Partial<Perimetre>): Dossier {
  return touche(dossier, { perimetre: { ...dossier.perimetre, ...perimetre } })
}

export function majClient(dossier: Dossier, client: Partial<FicheClient>): Dossier {
  return touche(dossier, { client: { ...dossier.client, ...client } })
}

export function majReference(dossier: Dossier, reference: string): Dossier {
  return touche(dossier, { reference })
}

// ---------------------------------------------------------------------------
// Composition : ce que le rapport affiche
// ---------------------------------------------------------------------------

export type LigneRapport = {
  readonly controle: Controle
  readonly statut: Statut
  readonly gravite: Gravite
  readonly confiance: number
  readonly analyse: string | null
  readonly redaction: string
  readonly origine: Origine
  readonly motif: string
  readonly ecarte: boolean
  readonly sansObjet: boolean
  readonly resumeEcart: string | null
  readonly rattachements: readonly Rattachement[]
  readonly resultatMoteur: ResultatMoteur | null
  /** Vrai des que le praticien a touche a cette ligne : le rapport le signale (§6). */
  readonly ajustee: boolean
}

const statutDepuisRattachements = (rattachements: readonly Rattachement[]): Statut | null => {
  const cotes = new Set<CoteRattachement>(rattachements.map((r) => r.cote))
  if (!cotes.has('OBLIGATION')) return null
  return cotes.has('COUVERTURE') ? Statut.CONFORME : Statut.ECART
}

/**
 * Compose la sortie du moteur et les ajustements du praticien.
 *
 * Rend TOUJOURS une ligne par controle du referentiel, meme sans analyse et
 * meme sur les controles ecartes (§5.2). L'ordre est celui du referentiel,
 * c'est-a-dire l'ordre de lecture de la matrice.
 */
export function resultatsAffiches(dossier: Dossier): LigneRapport[] {
  const parId = new Map((dossier.analyse?.resultats ?? []).map((r) => [r.controleId, r]))

  return REFERENTIEL.map((c) => {
    const moteur = parId.get(c.id) ?? null
    const ajustement = dossier.ajustements[c.id] ?? null
    const sansObjet = dossier.perimetre.controlesSansObjet.includes(c.id)

    const statutRattache =
      ajustement === null ? null : statutDepuisRattachements(ajustement.rattachements)

    const statut =
      ajustement?.statutForce ??
      statutRattache ??
      (sansObjet ? Statut.ABSENT_DU_BAIL : (moteur?.statut ?? Statut.NON_DETECTE))

    const origine =
      ajustement === null
        ? Origine.MOTEUR
        : ajustement.statutForce !== null || ajustement.ecarte
          ? Origine.AJUSTEMENT_MANUEL
          : ajustement.rattachements.length > 0
            ? Origine.RATTACHEMENT_MANUEL
            : Origine.AJUSTEMENT_MANUEL

    return {
      controle: c,
      statut,
      gravite: ajustement?.graviteForcee ?? c.gravite,
      // Un rattachement manuel vaut certitude : c'est un humain qui a lu.
      confiance: statutRattache !== null ? 100 : (moteur?.confiance ?? 0),
      analyse: ajustement?.analyseReecrite ?? null,
      redaction: ajustement?.redactionReecrite ?? c.redactionProposee,
      origine,
      motif: ajustement?.motif ?? '',
      ecarte: ajustement?.ecarte ?? false,
      sansObjet,
      resumeEcart: moteur?.resumeEcart ?? null,
      rattachements: ajustement?.rattachements ?? [],
      resultatMoteur: moteur,
      ajustee: ajustement !== null,
    }
  })
}

export type SyntheseDossier = {
  readonly total: number
  readonly ecarts: number
  readonly conformes: number
  readonly sansObjet: number
  readonly aVerifier: number
  readonly ecartes: number
  readonly ajustees: number
  readonly phrase: string
  /** Mention imposee par le §6 quand le praticien est intervenu. */
  readonly mentionAjustement: string | null
}

export function synthetiser(dossier: Dossier): SyntheseDossier {
  const lignes = resultatsAffiches(dossier)
  const retenues = lignes.filter((l) => !l.ecarte)
  const compter = (statut: Statut) => retenues.filter((l) => l.statut === statut).length

  const ecarts = compter(Statut.ECART)
  const conformes = compter(Statut.CONFORME)
  const sansObjet = compter(Statut.ABSENT_DU_BAIL)
  const aVerifier = compter(Statut.NON_DETECTE)
  const ecartes = lignes.filter((l) => l.ecarte).length
  const ajustees = lignes.filter((l) => l.ajustee).length

  const accord = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`

  return {
    total: lignes.length,
    ecarts,
    conformes,
    sansObjet,
    aVerifier,
    ecartes,
    ajustees,
    phrase:
      `${NOMBRE_CONTROLES} contrôles appliqués — ${accord(ecarts, 'écart')}, ` +
      `${accord(conformes, 'conforme')}, ${sansObjet} sans objet, ` +
      `${aVerifier} à vérifier manuellement` +
      (ecartes > 0 ? `, ${accord(ecartes, 'écarté')} par le praticien` : '') +
      '.',
    mentionAjustement:
      ajustees === 0
        ? null
        : `Analyse ajustée par le praticien sur ${accord(ajustees, 'contrôle')}.`,
  }
}

/**
 * Preconisations hierarchisees par enjeu chiffre, jamais par gravite abstraite.
 *
 * « 12 mois de loyer non finances » remonte avant « gravite 3 » : un directeur
 * immobilier reagit a un euro (§7). A defaut de chiffre, la gravite tranche.
 */
export function preconisations(dossier: Dossier): LigneRapport[] {
  return resultatsAffiches(dossier)
    .filter((l) => !l.ecarte && l.statut === Statut.ECART)
    .sort((a, b) => {
      const chiffre = Number(b.resumeEcart !== null) - Number(a.resumeEcart !== null)
      if (chiffre !== 0) return chiffre
      return b.gravite - a.gravite
    })
}
