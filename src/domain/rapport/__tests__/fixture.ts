/**
 * Un dossier de référence, complet, pour les tests de parité.
 *
 * Il porte volontairement TOUTES les rubriques : périmètre renseigné dans ses
 * trois listes, observation libre, suivi daté, et les trois sources — bail,
 * contrat, attestation. Un dossier partiel laisserait des sections vides, et
 * une section vide ne prouve aucune parité.
 */
import { ATTESTATIONS, BAUX, PIECES } from '../../corpus/baux'
import {
  ajouterDocument,
  ajouterObservation,
  dossierVierge,
  enregistrerAnalyse,
  majCabinet,
  majClient,
  majPerimetre,
  majReference,
  majSuivi,
  type Dossier,
} from '../../dossier'
import { analyser } from '../../moteur/moteur'
import type { DocumentImporte, RoleDocument } from '@/lib/import'

const enDocument = (
  id: string,
  nom: string,
  texte: string,
  role: RoleDocument,
): DocumentImporte => ({
  id,
  nom,
  format: 'texte',
  role,
  texte,
  taille: new TextEncoder().encode(texte).length,
  pages: null,
  avertissements: [],
  courriel: null,
  piecesJointes: [],
})

export function dossierDeReference(): Dossier {
  const bail = BAUX.find((b) => b.id === 'bail-cc')
  const cp = PIECES.find((p) => p.id === 'cp-lacunaire')
  const attestation = ATTESTATIONS.find((a) => a.id === 'att-partielle')
  if (bail === undefined || cp === undefined || attestation === undefined) {
    throw new Error('Corpus incomplet : le dossier de référence ne peut pas être construit.')
  }

  let dossier = majReference(dossierVierge(), 'EXEMPLE-001')
  dossier = majCabinet(dossier, {
    nom: 'Cabinet Durand & Associés',
    couleur: '0E6B4A',
    praticien: 'Camille Durand',
    qualite: 'courtière en assurances',
  })
  dossier = majClient(dossier, {
    raisonSociale: 'Distribution Nord SAS',
    adresse: '12 rue des Halles, 59000 Lille',
    activite: 'Commerce de détail en centre commercial',
  })
  dossier = ajouterDocument(dossier, enDocument('bail', 'Bail (exemple).txt', bail.texte, 'OBLIGATION'))
  dossier = ajouterDocument(dossier, enDocument('cp', 'Conditions particulières (exemple).txt', cp.texte, 'COUVERTURE'))
  dossier = ajouterDocument(
    dossier,
    enDocument('att', 'Attestation (exemple).txt', attestation.texte, 'ATTESTATION'),
  )
  dossier = majPerimetre(dossier, {
    piecesRecues: ['Bail commercial du 12 janvier', 'Conditions particulières FIC-000000'],
    piecesManquantes: ['Conditions générales de la police', 'Avenant n° 2 cité à l’article 12'],
    hypotheses: ['Aucun sinistre déclaré sur les 36 derniers mois'],
  })
  dossier = ajouterObservation(dossier, {
    titre: 'Sous-location envisagée',
    texte: 'Le preneur envisage une sous-location partielle, non prévue par le bail.',
    gravite: 2,
  })
  dossier = majSuivi(dossier, {
    envoyeLe: '2026-08-14T09:00:00.000Z',
    destinataire: 'courtage@exemple.test',
  })

  return enregistrerAnalyse(
    dossier,
    analyser(dossier.documents.map((d) => ({ id: d.id, role: d.role, texte: d.texte }))),
  )
}
