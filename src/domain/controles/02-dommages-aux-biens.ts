import { Famille, Nature, Responsable, type Controle } from './types';

/**
 * Dommages aux biens — 7 contrôles
 *
 * Périmètre des biens assurés, événements exigés, capitaux, franchises et conditions techniques.
 *
 * Les identifiants DAB-XX sont STABLES : ils sont cités dans les rapports
 * remis aux clients. Ne jamais les renuméroter, même après suppression d'un contrôle.
 */
export const DOMMAGES_AUX_BIENS: Controle[] = [
  {
    id: 'DAB-01',
    famille: Famille.DOMMAGES_AUX_BIENS,
    titre: 'Clos, couvert et éléments du bailleur',
    obligation: 'Les biens immobiliers du bailleur ne doivent pas être transférés indistinctement au preneur.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Biens', 'Propriétaire', 'Périmètre'],
    consequence: 'Le preneur peut supporter un bien appartenant au bailleur et absent de sa police.',
    actionSource: 'Retirer la structure, les façades, la toiture, les portes et fenêtres appartenant au bailleur de l’obligation du preneur.',

    actionCouverture: 'Faire confirmer le périmètre des éventuels embellissements pris en charge.',
    redactionProposee: 'Le Preneur assure exclusivement ses biens propres, ses aménagements et les biens dont il a contractuellement la garde. Le Bailleur conserve l’assurance de l’immeuble, de la structure, du clos et du couvert.',
    responsable: Responsable.IMMOBILIER,
    preuveCloture: 'Bail distinguant clairement les biens du bailleur et du preneur.',
    detecteursObligation: [
      // Fenêtres bornées à la phrase — ni point, ni saut de ligne, exactement
      // ce que « . » excluait : « preneur » revient des centaines de
      // fois dans un bail, et chaque occurrence déclenchait une exploration
      // 220 x 220. Une stipulation ne franchit pas un point.
      {
        pattern: /preneur[^.\n\r\u2028\u2029]{0,220}(?:assur|garant|prend à sa charge)[^.\n\r\u2028\u2029]{0,220}(?:façades?|vitrines?|portes?|fenêtres?|volets?|toiture|structure|clos et couvert|immeuble)/i,
        // « Le Preneur n'est pas tenu d'assurer l'immeuble » porte tous les
        // mots d'un transfert abusif et dit l'inverse. Alerter sur une clause
        // PROTECTRICE est le faux positif le plus cher du référentiel : il
        // envoie négocier ce qui est déjà acquis.
        exclut: [
          /(?:n.est pas tenu|n.a pas [àa]|ne sera pas tenu|n.aura pas [àa])\s+(?:de\s+|d.)?(?:faire )?assur/i,
          /demeure [àa] la charge (?:du|de la|des) bailleur|reste [àa] la charge (?:du|de la|des) bailleur|[àa] la charge exclusive du bailleur/i,
        ],
      },
    ],
    detecteursCouverture: [
      { pattern: /(?:bâtiment|immeuble|clos et couvert|façade|toiture).{0,140}(?:garanti|assuré|couvert)/i },
    ],
  },
  {
    id: 'DAB-02',
    famille: Famille.DOMMAGES_AUX_BIENS,
    titre: 'Biens propres, matériels et stocks',
    obligation: 'Les biens du preneur doivent être identifiés et assurés pour leur valeur réelle.',
    nature: Nature.CROISEMENT,
    gravite: 2,
    axes: ['Biens', 'Valeur', 'Limites'],
    consequence: 'Une catégorie ou un capital absent peut laisser une part des biens sans indemnisation suffisante.',
    actionSource: 'Limiter l’obligation aux biens appartenant au preneur ou placés sous sa garde.',

    actionCouverture: 'Valider l’inventaire et les capitaux des aménagements, matériels, marchandises et stocks.',
    redactionProposee: 'Le Preneur assure ses biens propres et ceux dont il a la garde pour des capitaux adaptés à leur valeur, dans les limites des polices effectivement souscrites.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Inventaire valorisé et tableau de garanties concordants.',
    detecteursObligation: [
      {
        pattern: /biens appartenant au preneur|matériels?|marchandises?|stocks?|aménagements? du preneur|contenu des locaux/i,
        // « matériel informatique » dans une clause de bris de machine faisait
        // conclure à un défaut d'assurance des biens propres, alors que la
        // police portait précisément la garantie demandée. GAR-04 traite ce
        // sujet ; DAB-02 n'a pas à le doubler.
        exclut: [/bris de machines?|tous risques? informatiques?/i],
      },
    ],
    detecteursCouverture: [
      { pattern: /matériels?|marchandises?|stocks?|aménagements?|contenu professionnel|mobilier/i },
    ],
  },
  {
    id: 'DAB-03',
    famille: Famille.DOMMAGES_AUX_BIENS,
    titre: 'Événements exigés et couverts',
    obligation: 'Les événements imposés par le bail doivent relever des garanties réellement souscrites.',
    nature: Nature.CROISEMENT,
    gravite: 2,
    axes: ['Événements', 'Exclusions', 'Limites'],
    consequence: 'Le bail peut promettre une garantie absente, exclue ou conditionnelle.',
    actionSource: 'Remplacer toute promesse absolue par une référence aux événements relevant des polices souscrites.',

    actionCouverture: 'Confirmer les événements, exclusions et franchises applicables au site.',
    redactionProposee: 'Le Preneur maintient des garanties portant sur les événements relevant de ses polices d’assurance effectivement souscrites, dans leurs limites et conditions.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Événements du bail rapprochés du tableau de garanties.',
    detecteursObligation: [
      { pattern: /\bincendie\b|\bexplosion\b|dégâts? des eaux|\btempête\b|catastrophes? naturelles?|\bvol\b|\bvandalisme\b|événements garantis/i },
    ],
    detecteursCouverture: [
      { pattern: /\bincendie\b|\bexplosion\b|dégâts? des eaux|\btempête\b|catastrophes? naturelles?|\bvol\b|\bvandalisme\b/i },
    ],
  },
  {
    id: 'DAB-04',
    famille: Famille.DOMMAGES_AUX_BIENS,
    titre: 'Capitaux et valeurs assurées',
    obligation: 'Les montants exigés doivent être objectifs et compatibles avec les valeurs exposées.',
    nature: Nature.CROISEMENT,
    gravite: 2,
    axes: ['Montant', 'Valeur', 'Indexation'],
    consequence: 'Un capital trop faible expose à une insuffisance d’indemnité ; un montant arbitraire peut être impossible à obtenir.',
    actionSource: 'Renvoyer aux valeurs réellement exposées et aux capacités raisonnablement disponibles.',

    actionCouverture: 'Actualiser les capitaux déclarés à partir d’un inventaire valorisé.',
    redactionProposee: 'Les capitaux sont déterminés selon les valeurs réellement exposées et révisés périodiquement d’un commun accord.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Capitaux validés et inventaire daté.',
    detecteursObligation: [
      { pattern: /valeur à neuf|capitaux|montants? de garantie|valeur de remplacement|montant suffisant/i },
    ],
    detecteursCouverture: [
      { pattern: /capitaux|valeurs? assurées?|limite de garantie|montant garanti/i },
    ],
  },
  {
    id: 'DAB-05',
    famille: Famille.DOMMAGES_AUX_BIENS,
    titre: 'Franchises et reste à charge',
    obligation: 'Le bail ne doit pas imposer une absence totale de franchise ni transférer tout reste à charge sans faute.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 2,
    axes: ['Franchise', 'Responsabilité'],
    consequence: 'Le preneur pourrait supporter des franchises liées à un sinistre qui ne lui est pas imputable.',
    actionSource: 'Limiter le reste à charge aux franchises liées à un dommage imputable au preneur.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Chaque partie conserve les franchises de sa propre police, sauf dommage directement imputable à l’autre partie.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Clause répartissant les franchises selon l’imputabilité.',
    detecteursObligation: [
      { pattern: /sans pouvoir opposer.{0,100}franchise|franchise.{0,120}(?:charge du preneur|inopposable|remboursée)/i },
    ],
    detecteursCouverture: [
      { pattern: /franchise|reste à charge/i },
    ],
  },
  {
    id: 'DAB-06',
    famille: Famille.DOMMAGES_AUX_BIENS,
    titre: 'Vol, vandalisme et protections',
    obligation: 'L’obligation de garantie doit tenir compte des moyens de protection exigés par la police.',
    nature: Nature.CROISEMENT,
    gravite: 1,
    axes: ['Événement', 'Conditions', 'Protection'],
    consequence: 'Une garantie peut être refusée si les protections ou conditions d’inoccupation ne sont pas respectées.',
    actionSource: 'Éviter une obligation absolue et réserver les conditions techniques de la police.',

    actionCouverture: 'Contrôler les protections exigées et leur présence dans les locaux.',
    redactionProposee: 'La garantie vol relève des conditions, limites et moyens de protection prévus par la police du Preneur.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Moyens de protection contrôlés et déclarés.',
    detecteursObligation: [
      { pattern: /\bvol\b|\bvandalisme\b|\beffraction\b/i },
    ],
    detecteursCouverture: [
      { pattern: /\bvol\b|\bvandalisme\b|\beffraction\b/i },
    ],
  },
  {
    id: 'DAB-07',
    famille: Famille.DOMMAGES_AUX_BIENS,
    titre: 'Possessif et propriété des biens',
    obligation: 'La clause doit viser les biens du preneur, et non un ensemble indifférencié de biens présents dans les locaux.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Biens', 'Propriétaire', 'Périmètre'],
    consequence: 'Une formulation sans possessif peut étendre l’obligation aux biens immobiliers ou équipements appartenant au bailleur.',
    actionSource: 'Remplacer la désignation générale par « ses biens » et limiter l’obligation aux aménagements, embellissements et équipements appartenant au preneur ou placés sous sa garde.',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee: 'Le Preneur assure ses biens propres, ses aménagements, ses embellissements et les biens dont il a contractuellement la garde, à l’exclusion du bâtiment, du clos et du couvert appartenant au Bailleur.',
    responsable: Responsable.IMMOBILIER,
    preuveCloture: 'Chaque catégorie de biens est rattachée à son propriétaire dans le bail.',
    detecteursObligation: [
      {
        pattern: /preneur[^.\n\r\u2028\u2029]{0,140}(?:assur|garant)[^.\n\r\u2028\u2029]{0,80}(?:tous les|l.ensemble des|les)\s+(?:biens|installations|équipements|aménagements)/i,
        // Ce contrôle reproche à la clause de ne PAS distinguer le propriétaire
        // des biens. Quand elle le distingue expressément — « à l'exception des
        // biens appartenant au Bailleur » — il n'a plus d'objet.
        exclut: [
          /[àa] l.exception des biens (?:appartenant au|du) bailleur|hormis les biens (?:appartenant au|du) bailleur|dont (?:il est|le preneur est) propriétaire/i,
        ],
      },
    ],
    detecteursCouverture: [
      { pattern: /(?:biens|installations|équipements|aménagements).{0,120}(?:appartenant à l.assuré|propres à l.assuré|dont il a la garde)/i },
    ],
  },
];
