import { Famille, Nature, Responsable, type Controle } from './types';

/**
 * Renonciation à recours — 4 contrôles
 *
 * Réciprocité, exceptions, extension aux tiers et engagement effectif des assureurs.
 *
 * Les identifiants RR-XX sont STABLES : ils sont cités dans les rapports
 * remis aux clients. Ne jamais les renuméroter, même après suppression d'un contrôle.
 */
export const RENONCIATION_RECOURS: Controle[] = [
  {
    id: 'RR-01',
    famille: Famille.RENONCIATION_RECOURS,
    titre: 'Réciprocité de la renonciation',
    obligation: 'La renonciation doit jouer dans les deux sens sur un périmètre identique.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Réciprocité', 'Bénéficiaires', 'Périmètre'],
    consequence: 'Le preneur peut perdre un recours sans engagement équivalent du bailleur ni de son assureur.',
    actionSource: 'Rendre la renonciation réciproque et strictement délimitée.',

    actionCouverture: 'Obtenir l’accord des assureurs respectifs sur un périmètre identique.',
    redactionProposee: 'Le Bailleur et le Preneur renoncent réciproquement à recours l’un contre l’autre, sur un périmètre identique et sous réserve de l’accord de leurs assureurs respectifs.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Clause réciproque et confirmations des assureurs.',
    detecteursObligation: [
      {
        pattern: /le preneur renonce.{0,180}recours|renonciation.{0,120}(?:preneur|locataire)/i,
        // Le contrôle porte sur le DÉFAUT de réciprocité. Une clause où les
        // deux parties renoncent explicitement l'une contre l'autre est la
        // rédaction correcte : l'alerter fait revérifier ce qui est bien écrit.
        // COH-02 reste là pour la réciprocité seulement ANNONCÉE.
        exclut: [
          /(?:le\s+)?bailleur\s+et\s+(?:le\s+)?preneur\s+renoncent|renoncent\s+r[ée]ciproquement|(?:le\s+)?bailleur\s+renonce\s+[àa]/i,
        ],
      },
    ],
    detecteursCouverture: [
      { pattern: /renonc.{0,140}recours|abandon de recours|dérogation à la subrogation/i },
    ],
  },
  {
    id: 'RR-02',
    famille: Famille.RENONCIATION_RECOURS,
    titre: 'Exception de malveillance',
    obligation: 'L’exception de malveillance doit viser toutes les parties.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Exception', 'Parties'],
    consequence: 'Une exception limitée au preneur crée une asymétrie au bénéfice du bailleur.',
    actionSource: 'Ajouter une exception de malveillance applicable à l’ensemble des parties.',

    actionCouverture: 'Valider la compatibilité de cette exception avec les règles de subrogation.',
    redactionProposee: 'La renonciation ne s’applique pas en cas de malveillance ou de faute intentionnelle de l’une ou l’autre des parties.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Exception symétrique validée dans la clause.',
    detecteursObligation: [
      { pattern: /malveillance du preneur|faute intentionnelle du preneur|renonc.{0,180}quelle qu.en soit la cause/i },
    ],
    detecteursCouverture: [
      { pattern: /malveillance|faute intentionnelle|acte intentionnel/i },
    ],
  },
  {
    id: 'RR-03',
    famille: Famille.RENONCIATION_RECOURS,
    titre: 'Extension aux tiers',
    obligation: 'Les occupants, fournisseurs, voisins ou prestataires ne doivent pas bénéficier automatiquement de la renonciation.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Bénéficiaires', 'Tiers', 'Réciprocité'],
    consequence: 'L’extension prive le preneur de recours contre des tiers sans réciprocité.',
    actionSource: 'Supprimer les tiers ou les soumettre à une liste limitative, à la réciprocité et à la malveillance.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'La renonciation ne bénéficie à aucun tiers non expressément désigné et engagé dans les mêmes conditions de réciprocité.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Liste limitative des bénéficiaires ou suppression des tiers.',
    detecteursObligation: [
      { pattern: /renonc.{0,220}(?:occupants?|utilisateurs?|fournisseurs?|prestataires?|voisins?|personnels?|autres locataires)/i },
    ],
    detecteursCouverture: [
      { pattern: /bénéficiaires? nommément|tiers désignés|extension de renonciation/i },
    ],
  },
  {
    id: 'RR-04',
    famille: Famille.RENONCIATION_RECOURS,
    titre: 'Engagement des assureurs',
    obligation: 'Chaque partie doit obtenir une renonciation de même portée de son assureur.',
    nature: Nature.DOUBLE,
    gravite: 2,
    axes: ['Assureurs', 'Portée', 'Condition'],
    consequence: 'Une renonciation signée dans le bail peut rester inefficace à l’égard de l’assureur.',
    actionSource: 'Conditionner la renonciation à l’obtention de l’accord des assureurs respectifs.',

    actionCouverture: 'Obtenir l’avenant ou la confirmation écrite de l’assureur.',
    redactionProposee: 'Chaque partie sollicite de son assureur une renonciation de même portée ; la clause ne produit effet qu’après confirmation de cette acceptation.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Avenants ou confirmations écrites des assureurs.',
    detecteursObligation: [
      { pattern: /assureurs? respectifs?|subrogation|renonciation.{0,160}assureur/i },
    ],
    detecteursCouverture: [
      { pattern: /renonc.{0,140}recours|dérogation à la subrogation|abandon de recours/i },
    ],
  },
];
