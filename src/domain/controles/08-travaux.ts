import { Famille, Nature, Responsable, type Controle } from './types';

/**
 * Travaux — 3 contrôles
 *
 * Dommages-ouvrage, tous risques chantier et pouvoir du bailleur sur les assurances travaux.
 *
 * Les identifiants TRV-XX sont STABLES : ils sont cités dans les rapports
 * remis aux clients. Ne jamais les renuméroter, même après suppression d'un contrôle.
 */
export const TRAVAUX: Controle[] = [
  {
    id: 'TRV-01',
    famille: Famille.TRAVAUX,
    titre: 'Dommages-ouvrage',
    obligation: 'La dommages-ouvrage ne doit être exigée que lorsque les travaux la rendent nécessaire.',
    nature: Nature.DOUBLE,
    gravite: 2,
    axes: ['Travaux', 'Responsable', 'Condition'],
    consequence: 'Une obligation générale peut imposer une police coûteuse et inadaptée à des travaux mineurs.',
    actionSource: 'Conditionner la DO à la nature et au responsable effectif des travaux.',

    actionCouverture: 'Valider le besoin et le coût avant le démarrage du chantier.',
    redactionProposee: 'Une assurance dommages-ouvrage est exigée uniquement lorsque la nature des travaux et la qualité de maître d’ouvrage du Preneur la rendent nécessaire.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Périmètre des travaux et besoin de DO validés.',
    detecteursObligation: [
      { pattern: /dommages[- ]ouvrage|assurance DO/i },
    ],
    detecteursCouverture: [
      { pattern: /dommages[- ]ouvrage|constructeur non réalisateur|maître d.ouvrage/i },
    ],
  },
  {
    id: 'TRV-02',
    famille: Famille.TRAVAUX,
    titre: 'Tous risques chantier',
    obligation: 'La TRC doit être reliée au montant, à la durée et au responsable du chantier.',
    nature: Nature.DOUBLE,
    gravite: 2,
    axes: ['Travaux', 'Seuil', 'Durée'],
    consequence: 'Une TRC systématique peut être disproportionnée ou absente du contrat-cadre.',
    actionSource: 'Définir un seuil et limiter l’exigence aux travaux exposant réellement les parties.',

    actionCouverture: 'Vérifier l’existence d’un contrat-cadre et le seuil de déclaration.',
    redactionProposee: 'Une garantie tous risques chantier est souscrite lorsque le montant et la nature des travaux excèdent [seuil à convenir], après définition écrite du chantier.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Seuil, chantier et police applicables identifiés.',
    detecteursObligation: [
      { pattern: /tous risques chantier|TRC|assurance chantier/i },
    ],
    detecteursCouverture: [
      { pattern: /tous risques chantier|TRC|contrat chantier/i },
    ],
  },
  {
    id: 'TRV-03',
    famille: Famille.TRAVAUX,
    titre: 'Pouvoir discrétionnaire sur les assurances travaux',
    obligation: 'Le bailleur ne doit pas pouvoir imposer toute garantie complémentaire sans critère.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 2,
    axes: ['Pouvoir', 'Critères', 'Coût'],
    consequence: 'Le coût et le niveau de garantie resteraient entièrement à la discrétion du bailleur.',
    actionSource: 'Supprimer la faculté discrétionnaire ou l’encadrer par des critères objectifs.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Toute assurance complémentaire est convenue par écrit selon la nature, le montant et la responsabilité effective des travaux.',
    responsable: Responsable.IMMOBILIER,
    preuveCloture: 'Critères objectifs et procédure contradictoire écrits.',
    detecteursObligation: [
      { pattern: /toute garantie complémentaire.{0,100}(?:exigée|demandée).{0,80}bailleur|bailleur.{0,160}assurance.{0,100}nécessaire/i },
    ],
    detecteursCouverture: [],
  },
];
