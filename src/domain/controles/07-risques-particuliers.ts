import { Famille, Nature, Responsable, type Controle } from './types';

/**
 * Risques particuliers — 2 contrôles
 *
 * Atteintes à l'environnement et passif antérieur à l'entrée dans les lieux.
 *
 * Les identifiants ENV-XX sont STABLES : ils sont cités dans les rapports
 * remis aux clients. Ne jamais les renuméroter, même après suppression d'un contrôle.
 */
export const RISQUES_PARTICULIERS: Controle[] = [
  {
    id: 'ENV-01',
    famille: Famille.RISQUES_PARTICULIERS,
    titre: 'Pollution accidentelle et graduelle',
    obligation: 'Le bail ne doit pas imposer tous risques de pollution lorsque la police est limitée.',
    nature: Nature.DOUBLE,
    gravite: 3,
    axes: ['Nature', 'Durée', 'Limites'],
    consequence: 'La pollution graduelle ou historique est fréquemment hors du périmètre réellement disponible.',
    actionSource: 'Limiter l’obligation aux pollutions directement imputables à l’activité du preneur et aux garanties disponibles.',

    actionCouverture: 'Confirmer la distinction accidentelle, graduelle et les sous-limites.',
    redactionProposee: 'Le Preneur répond des atteintes à l’environnement directement imputables à son activité, dans la limite des risques relevant des garanties effectivement disponibles.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Périmètre de pollution et sous-limites identifiés.',
    detecteursObligation: [
      { pattern: /pollution|atteinte à l.environnement|risque environnemental/i },
    ],
    detecteursCouverture: [
      { pattern: /pollution|atteinte à l.environnement|responsabilité environnementale/i },
    ],
  },
  {
    id: 'ENV-02',
    famille: Famille.RISQUES_PARTICULIERS,
    titre: 'Pollution historique',
    obligation: 'Le preneur ne doit pas reprendre une pollution antérieure à son entrée dans les lieux.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Temporalité', 'Responsabilité', 'État initial'],
    consequence: 'Le preneur peut supporter un passif environnemental qu’il n’a ni causé ni assuré.',
    actionSource: 'Exclure les pollutions antérieures et prévoir un état environnemental initial.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Le Preneur ne répond pas des pollutions antérieures à son entrée dans les lieux ou non directement imputables à son activité.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Exclusion des pollutions historiques et état initial annexé.',
    detecteursObligation: [
      { pattern: /pollution.{0,180}(?:historique|antérieure|préexistante)|origine antérieure.{0,100}preneur/i },
    ],
    detecteursCouverture: [
      { pattern: /pollution historique|pollution préexistante|état initial|fait antérieur/i },
    ],
  },
];
