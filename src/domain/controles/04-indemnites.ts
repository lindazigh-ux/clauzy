import { Famille, Nature, Responsable, type Controle } from './types';

/**
 * Indemnités — 4 contrôles
 *
 * Destination des indemnités, sort de la perte d'exploitation, privilèges et délégations.
 *
 * Les identifiants IND-XX sont STABLES : ils sont cités dans les rapports
 * remis aux clients. Ne jamais les renuméroter, même après suppression d'un contrôle.
 */
export const INDEMNITES: Controle[] = [
  {
    id: 'IND-01',
    famille: Famille.INDEMNITES,
    titre: 'Destination de toutes les indemnités',
    obligation: 'Chaque indemnité doit revenir à celui dont elle répare le bien ou la perte.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Bénéficiaire', 'Nature de perte', 'Affectation'],
    consequence: 'Le preneur peut perdre les sommes nécessaires au remplacement de ses biens et à la reprise de son activité.',
    actionSource: 'Supprimer toute affectation générale des indemnités au bailleur et répartir chaque indemnité selon le bien ou la perte qu’elle répare.',

    actionCouverture: 'Confirmer les bénéficiaires de chaque poste d’indemnité.',
    redactionProposee: 'Les indemnités relatives au bâtiment et aux pertes de loyers du Bailleur reviennent au Bailleur. Les indemnités relatives aux biens propres, aménagements et pertes d’exploitation du Preneur demeurent acquises au Preneur, sous réserve des droits légalement applicables des créanciers privilégiés ou hypothécaires.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Répartition des indemnités par nature de bien et de perte.',
    baseJuridique: 'Code des assurances, article L121-13 : vérifier la nature de l’indemnité, le risque locatif et les droits effectivement opposables avant toute affectation.',
    detecteursObligation: [
      { pattern: /toutes? indemnités?.{0,200}(?:affectées?|bailleur|privilège|déléguées?|versées?)/i },
    ],
    detecteursCouverture: [
      { pattern: /indemnités?.{0,180}(?:bailleur|preneur|assuré)|bénéficiaire|délégation|créancier privilégié/i },
    ],
  },
  {
    id: 'IND-02',
    famille: Famille.INDEMNITES,
    titre: 'Perte d’exploitation du preneur',
    obligation: 'L’indemnité de perte d’exploitation doit rester disponible pour le preneur.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Indemnité', 'Bénéficiaire', 'Objet'],
    consequence: 'La captation de la PE empêche le financement de la continuité et de la reprise d’activité.',
    actionSource: 'Supprimer toute délégation automatique de la perte d’exploitation au bailleur.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'L’indemnité de perte d’exploitation et les frais supplémentaires d’exploitation demeurent exclusivement acquis au Preneur.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Clause réservant expressément la PE au preneur.',
    detecteursObligation: [
      { pattern: /perte d.exploitation.{0,160}(?:bailleur|déléguée?|affectée?|privilège)/i },
    ],
    detecteursCouverture: [
      { pattern: /perte d.exploitation|marge brute|frais supplémentaires d.exploitation/i },
    ],
  },
  {
    id: 'IND-03',
    famille: Famille.INDEMNITES,
    titre: 'Privilège ou délégation au bailleur',
    obligation: 'Tout privilège ou mécanisme de paiement direct doit être identifié et limité.',
    nature: Nature.DOUBLE,
    gravite: 2,
    axes: ['Mécanisme', 'Montant', 'Bénéficiaire'],
    consequence: 'Un mécanisme général peut capter des indemnités sans rapport avec le bâtiment, les risques locatifs ou la créance invoquée.',
    actionSource: 'Supprimer la délégation générale et limiter toute attribution aux seuls droits légalement applicables, après identification de la créance et de l’indemnité concernées.',

    actionCouverture: 'Vérifier l’existence, le rang et la portée du privilège ou de l’opposition invoqués.',
    redactionProposee: 'Aucune délégation générale d’indemnité n’est consentie au Bailleur. Les paiements tiennent uniquement compte des droits légalement applicables aux créanciers privilégiés ou hypothécaires et, le cas échéant, des indemnités dues au titre du risque locatif.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Fondement, créance, rang et indemnité concernés documentés.',
    baseJuridique: 'Code des assurances, article L121-13 : l’application dépend notamment de la qualité du créancier, du risque et de la nature de l’indemnité ; validation juridique requise.',
    detecteursObligation: [
      { pattern: /privilège du bailleur|délégation d.indemnité|paiement direct.{0,80}bailleur/i },
    ],
    detecteursCouverture: [
      { pattern: /créancier privilégié|délégation|bénéficiaire|paiement direct/i },
    ],
  },
  {
    id: 'IND-04',
    famille: Famille.INDEMNITES,
    titre: 'Perte d’usage du bailleur',
    obligation: 'Le preneur ne doit pas financer la perte d’usage du bailleur lorsqu’une renonciation à recours répartit déjà les risques entre les parties.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 2,
    axes: ['Bénéficiaire', 'Objet', 'Réciprocité'],
    consequence: 'Le preneur peut se voir imposer une perte propre au bailleur alors que chaque partie doit assurer ses propres intérêts.',
    actionSource: 'Supprimer la prise en charge de la perte d’usage du bailleur ; à défaut, la limiter aux seuls dommages directement imputables au preneur.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Chaque partie assure ses propres pertes. Le Preneur ne répond d’un trouble de jouissance du Bailleur que s’il résulte d’un dommage qui lui est directement imputable.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Perte d’usage retirée ou strictement liée à l’imputabilité.',
    detecteursObligation: [
      { pattern: /perte d.usage.{0,160}(?:bailleur|propriétaire)|privation de jouissance.{0,160}(?:bailleur|propriétaire)/i },
    ],
    detecteursCouverture: [
      { pattern: /perte d.usage|privation de jouissance|perte de loyers/i },
    ],
  },
];
