import { Famille, Nature, Responsable, type Controle } from './types';

/**
 * Périmètre documentaire — 3 contrôles
 *
 * Concordance des parties, des lieux et des activités entre le bail et les pièces d'assurance.
 *
 * Les identifiants DOC-XX sont STABLES : ils sont cités dans les rapports
 * remis aux clients. Ne jamais les renuméroter, même après suppression d'un contrôle.
 */
export const PERIMETRE_DOCUMENTAIRE: Controle[] = [
  {
    id: 'DOC-01',
    famille: Famille.PERIMETRE_DOCUMENTAIRE,
    titre: 'Identité du preneur et de l’assuré',
    obligation: 'L’entité tenue par le bail doit être exactement celle qui est assurée.',
    nature: Nature.CROISEMENT,
    gravite: 3,
    axes: ['Partie', 'Identité'],
    consequence: 'Une différence d’entité peut rendre la preuve d’assurance inutilisable pour le bail concerné.',
    actionSource: 'Désigner le preneur avec sa dénomination sociale exacte et son identifiant juridique.',

    actionCouverture: 'Faire corriger le nom de l’assuré dans les pièces d’assurance.',
    redactionProposee: 'Le Preneur est [dénomination sociale exacte], immatriculé sous le numéro [SIREN].',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Bail et conditions particulières mentionnant la même entité.',
    detecteursObligation: [
      { pattern: /(?:preneur|locataire)\s*(?:[:—-]|ci-après)|(?:société|s\.?a\.?s\.?|s\.?a\.?r\.?l\.?).{0,90}(?:preneur|locataire)|entre les soussignés/i },
    ],
    detecteursCouverture: [
      { pattern: /assur[eé]\s*:|souscripteur|raison sociale/i },
    ],
  },
  {
    id: 'DOC-02',
    famille: Famille.PERIMETRE_DOCUMENTAIRE,
    titre: 'Adresse du local et situation du risque',
    obligation: 'Le local donné à bail doit correspondre au site déclaré à l’assureur.',
    nature: Nature.CROISEMENT,
    gravite: 3,
    axes: ['Site', 'Adresse'],
    consequence: 'Une adresse incomplète ou différente fragilise la preuve de couverture du local.',
    actionSource: 'Reprendre l’adresse complète et le périmètre exact des locaux dans le bail.',

    actionCouverture: 'Obtenir une pièce mentionnant exactement l’adresse et les bâtiments concernés.',
    redactionProposee: 'Les locaux loués et le risque assuré sont situés [adresse complète, bâtiment, cellule et surface].',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Adresse strictement concordante dans le bail et la police.',
    detecteursObligation: [
      { pattern: /locaux loués|local commercial|adresse des lieux|situés? à/i },
    ],
    detecteursCouverture: [
      { pattern: /site assur[eé]|adresse du risque|situation du risque|lieux assurés/i },
    ],
  },
  {
    id: 'DOC-03',
    famille: Famille.PERIMETRE_DOCUMENTAIRE,
    titre: 'Activité déclarée',
    obligation: 'La destination contractuelle du bail doit correspondre aux activités déclarées à l’assureur.',
    nature: Nature.CROISEMENT,
    gravite: 2,
    axes: ['Activité', 'Périmètre'],
    consequence: 'Une activité autorisée par le bail mais non déclarée peut déclencher une exclusion ou une réduction d’indemnité.',
    actionSource: 'Décrire les activités principales et accessoires réellement prévues.',

    actionCouverture: 'Faire confirmer que chaque activité exercée au site est déclarée.',
    redactionProposee: 'Les locaux sont destinés aux activités suivantes : [liste exhaustive], sous réserve de leur déclaration préalable à l’assureur du Preneur.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Liste d’activités concordante entre bail et conditions particulières.',
    detecteursObligation: [
      { pattern: /destination|activit[eé]|usage des locaux|commerce de|exploitation de/i },
    ],
    detecteursCouverture: [
      { pattern: /activit[eé] assur[eé]e|activit[eé]\s*:|profession déclarée|nature du risque/i },
    ],
  },
];
