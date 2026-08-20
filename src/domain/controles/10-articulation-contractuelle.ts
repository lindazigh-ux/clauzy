import { Famille, Nature, Responsable, type Controle } from './types';

/**
 * Articulation contractuelle — 2 contrôles
 *
 * Primauté du bail sur les garanties disponibles et neutralisation des autres contrats.
 *
 * Les identifiants ART-XX sont STABLES : ils sont cités dans les rapports
 * remis aux clients. Ne jamais les renuméroter, même après suppression d'un contrôle.
 */
export const ARTICULATION_CONTRACTUELLE: Controle[] = [
  {
    id: 'ART-01',
    famille: Famille.ARTICULATION_CONTRACTUELLE,
    titre: 'Primauté absolue du bail',
    obligation: 'Le bail ne doit pas promettre une couverture supérieure à celle réellement disponible.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Hiérarchie', 'Disponibilité', 'Limites'],
    consequence: 'Le preneur resterait contractuellement responsable d’une obligation que le marché ne couvre pas.',
    actionSource: 'Limiter les obligations aux garanties raisonnablement disponibles et aux responsabilités du preneur.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Les obligations d’assurance s’exécutent dans la limite des garanties raisonnablement disponibles et ne créent aucune responsabilité indépendante des faits imputables au Preneur.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Clause articulée avec les garanties réellement disponibles.',
    detecteursObligation: [
      // « priment », « prime sur », « l’emportent » : mêmes stipulations que
      // « prévaut ». « prime » nom commun est exclu par les formes retenues.
      { pattern: /bail.{0,160}(?:prévaut|prévalent|priment|prime sur|primer sur|l.emporte|l.emportent).{0,160}(?:police|contrat d.assurance)|insuffisance.{0,120}couverture.{0,120}ne limite/i },
    ],
    detecteursCouverture: [
      { pattern: /conditions particulières|conditions générales|exclusions|limites de garantie/i },
    ],
  },
  {
    id: 'ART-02',
    famille: Famille.ARTICULATION_CONTRACTUELLE,
    titre: 'Neutralisation des autres contrats',
    obligation: 'Une renonciation du bail ne doit pas neutraliser les responsabilités prévues par d’autres contrats.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 2,
    axes: ['Contrats', 'Responsabilité', 'Tiers'],
    consequence: 'Le bail pourrait supprimer les recours issus d’un contrat de maintenance, dépôt ou prestation.',
    actionSource: 'Réserver expressément l’application des autres contrats et leurs responsabilités propres.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Les renonciations prévues au bail n’affectent pas les responsabilités résultant des contrats de prestation, maintenance, dépôt ou services conclus par les parties.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Réserve expresse des autres contrats.',
    detecteursObligation: [
      { pattern: /renonc.{0,220}(?:contrat de prestation|contrat de dépôt|contrat de services|autre contrat)/i },
      { pattern: /sans recours.{0,180}prestataire/i },
    ],
    detecteursCouverture: [],
  },
];
