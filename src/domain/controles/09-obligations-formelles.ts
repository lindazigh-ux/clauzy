import { Famille, Nature, Responsable, type Controle } from './types';

/**
 * Obligations formelles — 6 contrôles
 *
 * Attestations, délais, sanctions, souscription pour compte et refacturation de surprimes.
 *
 * Les identifiants FOR-XX sont STABLES : ils sont cités dans les rapports
 * remis aux clients. Ne jamais les renuméroter, même après suppression d'un contrôle.
 */
export const OBLIGATIONS_FORMELLES: Controle[] = [
  {
    id: 'FOR-01',
    famille: Famille.OBLIGATIONS_FORMELLES,
    titre: 'Délai et sanction de l’attestation',
    obligation: 'Le délai de remise doit être raisonnable et précédé d’une mise en demeure.',
    nature: Nature.FORMALISME,
    gravite: 3,
    axes: ['Délai', 'Sanction', 'Procédure'],
    consequence: 'Une résiliation automatique pour un retard documentaire est disproportionnée.',
    actionSource: 'Prévoir quinze à trente jours après demande écrite et une mise en demeure préalable.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Le Preneur remet une attestation en cours de validité dans les quinze jours d’une demande écrite. Toute sanction est précédée d’une mise en demeure restée sans effet pendant trente jours.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Délai raisonnable et mise en demeure intégrés.',
    detecteursObligation: [
      { pattern: /(?:première demande|huit jours|8 jours).{0,220}(?:résili|plein droit)/i },
      { pattern: /résili.{0,180}(?:attestation|certificat d.assurance)/i },
    ],
    detecteursCouverture: [],
  },
  {
    id: 'FOR-02',
    famille: Famille.OBLIGATIONS_FORMELLES,
    titre: 'Franchises et exclusions sur l’attestation',
    obligation: 'L’attestation doit rester limitée aux informations utiles au bailleur.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 2,
    axes: ['Document', 'Informations', 'Confidentialité'],
    consequence: 'Les attestations standard ne reprennent généralement ni toutes les franchises ni toutes les exclusions.',
    actionSource: 'Supprimer l’obligation de faire figurer franchises et exclusions sur l’attestation.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'L’attestation mentionne l’assuré, le site, la période, la nature des garanties et leurs principaux montants, sans obligation de divulguer les franchises.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Liste des mentions limitée aux informations disponibles.',
    detecteursObligation: [
      { pattern: /attestation.{0,200}(?:franchises?|exclusions?)/i },
      { pattern: /franchises?.{0,160}attestation/i },
    ],
    detecteursCouverture: [],
  },
  {
    id: 'FOR-03',
    famille: Famille.OBLIGATIONS_FORMELLES,
    titre: 'Souscription d’office et refacturation',
    obligation: 'Le bailleur ne doit pas souscrire librement une assurance au compte du preneur.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Pouvoir', 'Coût', 'Procédure'],
    consequence: 'Le preneur peut supporter une police choisie sans contrôle de son prix ni de son périmètre.',
    actionSource: 'Supprimer ce mécanisme ou l’encadrer après mise en demeure avec devis et plafond.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Le Bailleur ne peut souscrire pour compte du Preneur qu’après mise en demeure restée sans effet, sur présentation préalable des conditions et du coût, avec un plafond convenu.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Procédure, justificatifs et plafond intégrés.',
    detecteursObligation: [
      { pattern: /bailleur.{0,180}souscri.{0,180}(?:refactur|frais|charge).{0,100}preneur/i },
      { pattern: /souscrire.{0,160}aux frais du preneur/i },
    ],
    detecteursCouverture: [],
  },
  {
    id: 'FOR-04',
    famille: Famille.OBLIGATIONS_FORMELLES,
    titre: 'Surprimes et primes du bailleur',
    obligation: 'Seules les surprimes directement causées par l’activité du preneur peuvent être discutées.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 2,
    axes: ['Coût', 'Cause', 'Justificatif'],
    consequence: 'Le preneur peut payer des coûts liés à l’immeuble ou à des tiers sans lien avec son activité.',
    actionSource: 'Limiter la refacturation au surcoût directement causé par l’activité, sur justificatif.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Seul le surcoût directement et exclusivement causé par l’activité déclarée du Preneur peut être refacturé, sur production du justificatif de l’assureur.',
    responsable: Responsable.IMMOBILIER,
    preuveCloture: 'Lien causal, justificatif et périmètre de coût définis.',
    detecteursObligation: [
      { pattern: /surprime|prime.{0,180}(?:bailleur|police).{0,180}(?:refacturée?|charge du preneur)/i },
    ],
    detecteursCouverture: [
      { pattern: /surprime|majoration de prime|aggravation du risque/i },
    ],
  },
  {
    id: 'FOR-05',
    famille: Famille.OBLIGATIONS_FORMELLES,
    titre: 'Niveau de couverture imposé unilatéralement',
    obligation: 'Le bailleur ne doit pas pouvoir augmenter seul les montants ou garanties.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Montant', 'Pouvoir', 'Marché'],
    consequence: 'Une exigence évolutive et discrétionnaire peut dépasser les capacités du marché.',
    actionSource: 'Fixer les montants au bail et prévoir une révision contradictoire documentée.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Les montants d’assurance sont définis d’un commun accord et ne peuvent être révisés qu’au regard de l’exposition et des capacités raisonnablement disponibles.',
    responsable: Responsable.IMMOBILIER,
    preuveCloture: 'Montants fixés et procédure de révision contradictoire.',
    detecteursObligation: [
      { pattern: /bailleur.{0,180}(?:exiger|demander|estimer).{0,140}(?:niveau|montant|couverture|garantie).{0,120}(?:nécessaire|supérieur|insuffisant)/i },
    ],
    detecteursCouverture: [],
  },
  {
    id: 'FOR-06',
    famille: Famille.OBLIGATIONS_FORMELLES,
    titre: 'Règle proportionnelle utilisée comme sanction',
    obligation: 'Le bail ne doit pas déclencher artificiellement une règle proportionnelle pour sanctionner une formalité documentaire.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 2,
    axes: ['Sanction', 'Déclaration', 'Proportionnalité'],
    consequence: 'La clause mélange une sanction contractuelle du bail et un mécanisme propre au contrat d’assurance, sans lien nécessaire avec le manquement visé.',
    actionSource: 'Supprimer la référence à la règle proportionnelle et prévoir, si nécessaire, une procédure de mise en demeure proportionnée.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Tout manquement aux obligations documentaires fait l’objet d’une demande écrite puis d’une mise en demeure ; il n’emporte aucune application automatique d’une règle proportionnelle d’assurance.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Référence à la règle proportionnelle supprimée.',
    detecteursObligation: [
      { pattern: /(?:inobservation|non-respect|défaut).{0,180}règle proportionnelle|règle proportionnelle.{0,180}(?:dispositions ci-dessus|obligations du preneur|attestation)/i },
    ],
    detecteursCouverture: [
      { pattern: /règle proportionnelle|insuffisance de capitaux|déclaration du risque/i },
    ],
  },
];
