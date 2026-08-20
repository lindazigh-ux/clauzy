import { Famille, Nature, Responsable, type Controle } from './types';

/**
 * Sinistre majeur — 4 contrôles
 *
 * Maintien du loyer, réduction proportionnelle, délai de reconstruction et droit de sortie.
 *
 * Les identifiants SIN-XX sont STABLES : ils sont cités dans les rapports
 * remis aux clients. Ne jamais les renuméroter, même après suppression d'un contrôle.
 */
export const SINISTRE_MAJEUR: Controle[] = [
  {
    id: 'SIN-01',
    famille: Famille.SINISTRE_MAJEUR,
    titre: 'Maintien du loyer et durée de PE',
    obligation: 'Le maintien du loyer doit rester compatible avec la période de perte d’exploitation.',
    nature: Nature.DOUBLE,
    gravite: 3,
    axes: ['Durée', 'Loyer', 'Indemnisation'],
    consequence: 'Le preneur peut continuer à payer le loyer après l’épuisement de sa perte d’exploitation.',
    actionSource: 'Suspendre ou réduire le loyer pendant l’inutilisabilité et aligner le délai de sortie sur la durée de PE.',

    actionCouverture: 'Chiffrer une extension de PE seulement si la correction du bail est refusée.',
    redactionProposee: 'En cas d’inutilisabilité, le loyer est suspendu ou réduit proportionnellement. Le Preneur peut résilier si la remise en état excède [DURÉE PE] mois.',
    responsable: Responsable.IMMOBILIER,
    preuveCloture: 'Durée du bail alignée sur la période de PE et droit de sortie prévu.',
    detecteursObligation: [
      { pattern: /loyer.{0,220}(?:reconstruction|sinistre|destruction|intégralement dû|reste dû)/i },
      { pattern: /reconstruction.{0,180}(?:mois|délai)/i },
    ],
    detecteursCouverture: [
      { pattern: /perte d.exploitation|marge brute|frais supplémentaires d.exploitation/i },
    ],
  },
  {
    id: 'SIN-02',
    famille: Famille.SINISTRE_MAJEUR,
    titre: 'Destruction partielle et réduction du loyer',
    obligation: 'Une perte partielle d’usage doit entraîner une réduction proportionnelle du loyer.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Surface', 'Loyer', 'Usage'],
    consequence: 'Le preneur paierait pour une surface inutilisable sans mécanisme compensatoire certain.',
    actionSource: 'Prévoir une réduction du loyer proportionnelle à la surface ou à l’usage perdu.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'En cas d’inutilisabilité partielle, le loyer et les charges sont réduits proportionnellement à la surface et à l’usage effectivement perdus.',
    responsable: Responsable.IMMOBILIER,
    preuveCloture: 'Formule de réduction proportionnelle intégrée au bail.',
    detecteursObligation: [
      // Les deux ordres se rencontrent : « aucune réduction de loyer » comme
      // « le loyer ne subira aucune réduction ».
      { pattern: /(?:sans|aucune).{0,100}(?:diminution|réduction|suspension).{0,60}loyer|loyer.{0,80}(?:ne (?:subira|pourra|sera|saurait)|sans|aucune).{0,80}(?:diminution|réduction|suspension)/i },
      { pattern: /perte de surface.{0,120}aucune/i },
    ],
    detecteursCouverture: [
      { pattern: /perte d.exploitation|perte de loyers|frais supplémentaires/i },
    ],
  },
  {
    id: 'SIN-03',
    famille: Famille.SINISTRE_MAJEUR,
    titre: 'Délai de reconstruction et droit de sortie',
    obligation: 'Le preneur doit pouvoir résilier dans un délai raisonnable.',
    nature: Nature.DOUBLE,
    gravite: 3,
    axes: ['Durée', 'Résiliation', 'Reconstruction'],
    consequence: 'Un délai de sortie supérieur à la PE immobilise le preneur sans relais financier.',
    actionSource: 'Fixer un délai maximal de reconstruction et un droit de résiliation compatible avec la PE.',

    actionCouverture: 'Confirmer la durée maximale d’indemnisation disponible.',
    redactionProposee: 'Le Preneur peut résilier le bail si la remise en état n’est pas achevée dans un délai de [DURÉE PE] mois à compter du sinistre.',
    responsable: Responsable.IMMOBILIER,
    preuveCloture: 'Délai maximal et faculté de sortie expressément prévus.',
    detecteursObligation: [
      { pattern: /(?:reconstruction|inexploitable|remise en état).{0,180}(?:trente|36|quarante-huit|48|mois)/i },
      { pattern: /preneur.{0,160}(?:résilier|résiliation).{0,160}(?:mois|délai)/i },
    ],
    detecteursCouverture: [
      { pattern: /perte d.exploitation|période d.indemnisation/i },
    ],
  },
  {
    id: 'SIN-04',
    famille: Famille.SINISTRE_MAJEUR,
    titre: 'Décision de reconstruire',
    obligation: 'La décision du bailleur doit intervenir rapidement et être encadrée.',
    nature: Nature.FORMALISME,
    gravite: 2,
    axes: ['Décision', 'Délai', 'Information'],
    consequence: 'L’absence de délai de décision maintient le preneur dans l’incertitude tout en laissant courir ses charges.',
    actionSource: 'Imposer au bailleur un délai court pour notifier sa décision et les délais prévisionnels.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Le Bailleur notifie sa décision de reconstruire dans les trente jours du sinistre et communique un calendrier prévisionnel actualisé.',
    responsable: Responsable.IMMOBILIER,
    preuveCloture: 'Délai de décision et obligation d’information écrits.',
    detecteursObligation: [
      { pattern: /bailleur.{0,180}(?:décidera|décide|faculté).{0,140}(?:reconstruire|remettre en état)/i },
      { pattern: /délai.{0,120}décider.{0,100}reconstruction/i },
    ],
    detecteursCouverture: [],
  },
];
