import { Famille, Nature, Responsable, type Controle } from './types';

/**
 * Responsabilité civile — 5 contrôles
 *
 * Imputabilité, montants, recours des voisins et des tiers, garantie donnée au bailleur.
 *
 * Les identifiants RC-XX sont STABLES : ils sont cités dans les rapports
 * remis aux clients. Ne jamais les renuméroter, même après suppression d'un contrôle.
 */
export const RESPONSABILITE_CIVILE: Controle[] = [
  {
    id: 'RC-01',
    famille: Famille.RESPONSABILITE_CIVILE,
    titre: 'Imputabilité des dommages',
    obligation: 'Le preneur ne doit répondre que des dommages qui lui sont imputables.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Responsabilité', 'Cause', 'Imputabilité'],
    consequence: 'Le bail transforme une obligation d’assurance en responsabilité sans faute potentiellement illimitée.',
    actionSource: 'Limiter la responsabilité aux dommages directement imputables au preneur.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Le Preneur répond uniquement des dommages dont la responsabilité lui est directement imputable dans les conditions du droit applicable.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Lien d’imputabilité expressément inscrit dans le bail.',
    detecteursObligation: [
      { pattern: /preneur.{0,200}(?:répond|garantit|responsable).{0,180}(?:quelle qu.en soit la cause|tous dommages|toute réclamation)/i },
    ],
    detecteursCouverture: [
      { pattern: /responsabilité civile|dommages imputables|faute|fait de l.assuré/i },
    ],
  },
  {
    id: 'RC-02',
    famille: Famille.RESPONSABILITE_CIVILE,
    titre: 'Montant de responsabilité civile',
    obligation: 'Le montant imposé doit être chiffré et soutenu par la police.',
    nature: Nature.CROISEMENT,
    gravite: 3,
    axes: ['Montant', 'Base', 'Limites'],
    consequence: 'Le preneur peut promettre un montant supérieur à celui effectivement disponible.',
    actionSource: 'Fixer un montant non révisable unilatéralement et compatible avec la police disponible.',

    actionCouverture: 'Confirmer le plafond, sa base par sinistre ou par année et les sous-limites.',
    redactionProposee: 'Le Preneur maintient une responsabilité civile dans la limite des montants raisonnablement disponibles et convenus entre les parties, sans augmentation unilatérale.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Montant et base de garantie concordants.',
    detecteursObligation: [
      { pattern: /(?:responsabilité civile|RC).{0,180}(?:euros?|€|million|montant|garantie)/i },
    ],
    detecteursCouverture: [
      { pattern: /(?:responsabilité civile|RC exploitation).{0,180}(?:euros?|€|million|montant|limite)/i },
    ],
  },
  {
    id: 'RC-03',
    famille: Famille.RESPONSABILITE_CIVILE,
    titre: 'Recours des voisins et des tiers',
    obligation: 'Le montant doit correspondre à l’exposition réelle du site.',
    nature: Nature.CROISEMENT,
    gravite: 2,
    axes: ['Montant', 'Voisinage', 'Limites'],
    consequence: 'Un montant insuffisant laisse un écart ; un montant arbitraire peut être disproportionné.',
    actionSource: 'Renvoyer à un montant adapté à la valeur réelle des avoisinants et disponible sur le marché.',

    actionCouverture: 'Évaluer l’exposition des bâtiments voisins et confirmer la sous-limite.',
    redactionProposee: 'La garantie recours des voisins et des tiers est maintenue pour un montant adapté à l’exposition réelle du site et aux capacités raisonnablement disponibles.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Montant justifié par l’exposition et confirmé par l’assureur.',
    detecteursObligation: [
      { pattern: /recours des voisins et (?:des )?tiers|voisins et tiers/i },
    ],
    detecteursCouverture: [
      { pattern: /recours des voisins et (?:des )?tiers|dommages aux voisins|tiers lésés/i },
    ],
  },
  {
    id: 'RC-04',
    famille: Famille.RESPONSABILITE_CIVILE,
    titre: 'Troubles causés par les autres occupants',
    obligation: 'Le bailleur ne doit pas neutraliser son obligation de jouissance paisible.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 2,
    axes: ['Responsabilité', 'Occupants', 'Jouissance'],
    consequence: 'Le preneur perdrait un recours pour des troubles relevant de la gestion de l’immeuble.',
    actionSource: 'Remplacer la notion générale par « trouble de jouissance » et préserver les obligations de délivrance et de jouissance paisible du bailleur.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'La présente clause ne limite pas les obligations du Bailleur relatives à la délivrance et à la jouissance paisible des locaux, notamment en cas de trouble de jouissance imputable à l’immeuble ou à ses autres occupants.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Notion de trouble de jouissance et réserve des obligations du bailleur intégrées.',
    detecteursObligation: [
      { pattern: /bailleur.{0,160}(?:ne pourra|ne saurait|n.est pas).{0,160}(?:troubles?|occupants?|autres locataires?)/i },
    ],
    detecteursCouverture: [],
  },
  {
    id: 'RC-05',
    famille: Famille.RESPONSABILITE_CIVILE,
    titre: 'Réclamations de tiers',
    obligation: 'La garantie donnée au bailleur doit rester liée aux fautes et activités du preneur.',
    nature: Nature.DOUBLE,
    gravite: 2,
    axes: ['Tiers', 'Cause', 'Défense'],
    consequence: 'Le preneur pourrait garantir le bailleur pour des faits étrangers à son activité.',
    actionSource: 'Limiter la garantie aux réclamations résultant d’un fait imputable au preneur.',

    actionCouverture: 'Vérifier les garanties défense et recours ainsi que les activités déclarées.',
    redactionProposee: 'Le Preneur garantit le Bailleur contre les réclamations de tiers uniquement lorsqu’elles résultent d’un fait qui lui est directement imputable.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Garantie limitée aux faits imputables au preneur.',
    detecteursObligation: [
      { pattern: /garantit le bailleur.{0,180}(?:tiers|réclamation|action)/i },
      { pattern: /toute réclamation de tiers.{0,160}preneur/i },
    ],
    detecteursCouverture: [
      { pattern: /responsabilité civile|défense recours|réclamations? de tiers/i },
    ],
  },
];
