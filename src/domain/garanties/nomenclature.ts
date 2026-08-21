import { Beneficiaire, Categorie, NiveauPreuve, type Garantie } from './types'

/**
 * La nomenclature. Un risque par entree, nomme comme un courtier le nomme.
 *
 * Regle de lecture : `motifsObligation` reconnait l'EXIGENCE dans le document
 * source ; `motifsCouverture` reconnait la GARANTIE dans une piece d'assurance.
 * Les deux ne se ressemblent pas, et c'est tout le probleme — un bail ecrit
 * « assurer les locaux loués contre l'incendie », une police ecrit
 * « responsabilité locative : 1 500 000 € ». Le meme risque, deux vocabulaires.
 *
 * Les identifiants sont STABLES : ils sont cites dans les rapports.
 */
export const NOMENCLATURE: readonly Garantie[] = [
  // ---------------------------------------------------------------------
  // Responsabilites
  // ---------------------------------------------------------------------
  {
    id: 'RISQUES_LOCATIFS',
    libelle: 'Risques locatifs',
    categorie: Categorie.RESPONSABILITE,
    beneficiaire: Beneficiaire.BAILLEUR,
    definition:
      'Responsabilité du preneur envers le bailleur pour les dommages causés aux LOCAUX LOUÉS — incendie, explosion, dégâts des eaux. C’est une responsabilité, pas une assurance de l’immeuble.',
    neCouvrePas: [
      'Les biens propres du preneur : mobilier, matériel, marchandises',
      'Les dommages causés aux voisins et aux tiers',
      'L’immeuble dans son ensemble, au-delà des locaux loués',
      'Les parties de l’immeuble dont le preneur n’a pas la jouissance',
    ],
    baseJuridique:
      'Code civil, articles 1732 à 1735 : le preneur répond de l’incendie à moins qu’il ne prouve qu’il s’est produit sans sa faute.',
    motifsObligation: [
      { pattern: /\brisques? locatifs?\b|\bresponsabilit[ée] locative\b/i, libelle: 'nommée expressément', expres: true },
      {
        // La rédaction la plus courante — et celle qui piégeait le moteur.
        pattern:
          /(?:assur|garant)[^.\n\r]{0,80}(?:les\s+)?(?:locaux lou[ée]s|lieux lou[ée]s|biens lou[ée]s|locaux)[^.\n\r]{0,140}(?:incendie|explosion|d[ée]g[âa]ts? des eaux)/i,
        libelle: 'assurer les locaux loués contre l’incendie',
        // Sauf si la stipulation vise en réalité l'immeuble du bailleur.
        exclut: [
          /immeuble\s+(?:appartenant|propri[ée]t[ée])\s+(?:au|du)\s+bailleur/i,
          /(?:assur|garant)[^.\n\r]{0,60}(?:l.immeuble|le b[âa]timent|la structure|le clos et le? couvert)/i,
        ],
      },
      {
        pattern: /d[ée]g[âa]ts?[^.\n\r]{0,60}caus[ée]s? (?:aux|à des) locaux lou[ée]s/i,
        libelle: 'dommages causés aux locaux loués',
      },
    ],
    motifsCouverture: [
      { pattern: /\brisques? locatifs?\b|\bresponsabilit[ée] locative\b/i, expres: true },
      { pattern: /responsabilit[ée][^.\n\r:]{0,40}(?:du )?locataire[^.\n\r:]{0,40}(?:locaux|immeuble lou[ée])/i, poids: 0.8 },
      { pattern: /d[ée]t[ée]rioration des locaux lou[ée]s|dommages aux locaux lou[ée]s/i, poids: 0.8 },
    ],
    confusions: [
      {
        avec: 'ASSURANCE_IMMEUBLE_BAILLEUR',
        distinction:
          'Les risques locatifs sont une RESPONSABILITÉ du preneur, plafonnée à ce qu’il doit au bailleur. Assurer l’immeuble est une assurance de CHOSES, qui met à sa charge un bien dont il n’est pas propriétaire.',
        question:
          'Le bail exige-t-il que le preneur réponde des dommages qu’il cause aux locaux, ou qu’il souscrive une police sur le bâtiment du bailleur ?',
      },
      {
        avec: 'DOMMAGES_BIENS_PRENEUR',
        distinction:
          'Les risques locatifs indemnisent le bailleur pour les locaux. Les dommages aux biens du preneur indemnisent le preneur pour ce qui lui appartient.',
        question: 'De quel côté du bail le bien endommagé se trouve-t-il ?',
      },
      {
        avec: 'RECOURS_VOISINS_TIERS',
        distinction:
          'Les risques locatifs visent les dommages aux locaux loués. Le recours des voisins et des tiers vise les dommages causés HORS de ces locaux.',
        question: 'Le dommage reste-t-il dans les lieux loués, ou en sort-il ?',
      },
    ],
    actions: {
      [NiveauPreuve.ECART_CONFIRME]:
        'Faire confirmer la ligne « risques locatifs » ou « responsabilité civile occupant » du tableau de garanties. Ce n’est pas une extension à négocier : c’est la garantie de base d’une police de locataire, et son absence signale une police mal souscrite plutôt qu’un manque à acheter.',
    },
    satisfaitePar: ['RC_OCCUPANT'],
  },
  {
    id: 'RECOURS_VOISINS_TIERS',
    libelle: 'Recours des voisins et des tiers',
    categorie: Categorie.RESPONSABILITE,
    beneficiaire: Beneficiaire.TIERS,
    definition:
      'Responsabilité du preneur pour les dommages qu’un sinistre né dans ses locaux cause aux voisins ou à des tiers — propagation d’incendie, dégât des eaux chez le voisin.',
    neCouvrePas: [
      'Les dommages aux locaux loués eux-mêmes (voir risques locatifs)',
      'Les dommages causés par l’activité hors sinistre (voir RC exploitation)',
    ],
    baseJuridique: 'Code civil, articles 1240 et 1242.',
    motifsObligation: [
      { pattern: /recours des voisins(?: et des tiers)?|recours des tiers/i, libelle: 'nommé expressément', expres: true },
      {
        pattern: /(?:dommages?|d[ée]g[âa]ts?)[^.\n\r]{0,60}caus[ée]s?[^.\n\r]{0,40}(?:aux voisins|à des voisins|aux tiers|à des tiers)/i,
        libelle: 'dommages causés aux voisins ou aux tiers',
      },
    ],
    motifsCouverture: [
      { pattern: /recours des voisins(?: et des tiers)?|recours des tiers/i, expres: true },
      { pattern: /responsabilit[ée][^.\n\r:]{0,50}voisins|dommages? aux? voisins/i, poids: 0.8 },
    ],
    confusions: [
      {
        avec: 'RC_EXPLOITATION',
        distinction:
          'Le recours des voisins et des tiers répare la propagation d’un sinistre parti des locaux. La RC exploitation répare les dommages causés par l’activité elle-même.',
        question: 'Le dommage vient-il d’un sinistre du bâtiment, ou d’un acte d’exploitation ?',
      },
    ],
    satisfaitePar: ['RC_OCCUPANT'],
  },
  {
    id: 'RC_EXPLOITATION',
    libelle: 'Responsabilité civile exploitation',
    categorie: Categorie.RESPONSABILITE,
    beneficiaire: Beneficiaire.TIERS,
    definition:
      'Responsabilité du preneur pour les dommages causés aux tiers du fait de son activité, de ses préposés, de ses installations.',
    neCouvrePas: [
      'Les dommages aux produits livrés ou aux travaux réalisés (RC produits / après livraison)',
      'Les dommages aux locaux loués (voir risques locatifs)',
      'Les fautes professionnelles relevant d’une RC professionnelle',
    ],
    motifsObligation: [
      { pattern: /responsabilit[ée] civile (?:exploitation|d.exploitation)|\bRC exploitation\b/i, expres: true },
      {
        pattern: /responsabilit[ée] civile[^.\n\r]{0,80}(?:activit[ée]|exploitation|pr[ée]pos[ée]s)/i,
        poids: 0.8,
      },
    ],
    motifsCouverture: [
      { pattern: /responsabilit[ée] civile (?:exploitation|d.exploitation)|\bRC exploitation\b/i, expres: true },
      { pattern: /responsabilit[ée] civile g[ée]n[ée]rale/i, poids: 0.7 },
    ],
    confusions: [
      {
        avec: 'RC_PROFESSIONNELLE',
        distinction:
          'La RC exploitation couvre le dommage matériel ou corporel causé pendant l’activité. La RC professionnelle couvre la faute de prestation.',
        question: 'Le dommage vient-il d’un accident d’exploitation ou d’une prestation défaillante ?',
      },
    ],
  },
  {
    id: 'RC_OCCUPANT',
    libelle: 'Responsabilité civile occupant',
    categorie: Categorie.RESPONSABILITE,
    beneficiaire: Beneficiaire.MIXTE,
    definition:
      'Formule qui réunit, dans une même garantie, les risques locatifs et le recours des voisins et des tiers. Elle répond donc à une exigence portant sur l’un ou l’autre.',
    neCouvrePas: [
      'Les biens propres du preneur',
      'Les pertes d’exploitation',
    ],
    motifsObligation: [
      { pattern: /responsabilit[ée] civile occupant|\bRC occupant\b|responsabilit[ée] d.occupant/i, expres: true },
    ],
    motifsCouverture: [
      { pattern: /responsabilit[ée] civile occupant|\bRC occupant\b|responsabilit[ée] d.occupant/i, expres: true },
      { pattern: /responsabilit[ée] civile (?:du )?locataire/i, poids: 0.9 },
    ],
    confusions: [
      {
        avec: 'RISQUES_LOCATIFS',
        distinction:
          'La RC occupant englobe les risques locatifs. Une police qui la porte satisfait une exigence de risques locatifs, sans qu’une ligne « risques locatifs » figure au tableau.',
        question: 'Le tableau de garanties détaille-t-il les composantes de la RC occupant ?',
      },
    ],
  },
  {
    id: 'RC_PROFESSIONNELLE',
    libelle: 'Responsabilité civile professionnelle',
    categorie: Categorie.RESPONSABILITE,
    beneficiaire: Beneficiaire.TIERS,
    definition:
      'Responsabilité du preneur pour les conséquences d’une faute commise dans l’exercice de sa profession.',
    neCouvrePas: ['Les dommages accidentels d’exploitation', 'Les dommages aux locaux loués'],
    motifsObligation: [
      { pattern: /responsabilit[ée] civile professionnelle|\bRC professionnelle\b|\bRC pro\b/i, expres: true },
    ],
    motifsCouverture: [
      { pattern: /responsabilit[ée] civile professionnelle|\bRC professionnelle\b|\bRC pro\b/i, expres: true },
    ],
    confusions: [],
  },

  // ---------------------------------------------------------------------
  // Dommages aux biens
  // ---------------------------------------------------------------------
  {
    id: 'ASSURANCE_IMMEUBLE_BAILLEUR',
    libelle: 'Assurance de l’immeuble du bailleur',
    categorie: Categorie.DOMMAGES_AUX_BIENS,
    beneficiaire: Beneficiaire.BAILLEUR,
    definition:
      'Assurance de CHOSES portant sur le bâtiment, la structure, le clos et le couvert — biens appartenant au bailleur. Mise à la charge du preneur, elle constitue un transfert de risque lourd, très au-delà des risques locatifs.',
    neCouvrePas: ['Les biens du preneur', 'La responsabilité du preneur'],
    motifsObligation: [
      {
        pattern:
          /(?:preneur|locataire)[^.\n\r]{0,120}(?:assur|garant|souscri|prend à sa charge)[^.\n\r]{0,120}(?:l.immeuble|le b[âa]timent|la structure|le clos et le? couvert|les biens immobiliers)/i,
        libelle: 'le preneur assure l’immeuble',
      },
      {
        pattern:
          /(?:immeuble|b[âa]timent|biens immobiliers)[^.\n\r]{0,80}appartenant au (?:bailleur|propri[ée]taire)[^.\n\r]{0,120}(?:assur|garant|charge du preneur)/i,
        libelle: 'immeuble du bailleur mis à la charge du preneur',
      },
    ],
    motifsCouverture: [
      { pattern: /(?:b[âa]timent|immeuble|structure|clos et couvert)[^.\n\r:]{0,60}(?:garanti|assur[ée]|couvert)/i },
      { pattern: /dommages aux b[âa]timents?/i },
    ],
    confusions: [
      {
        avec: 'RISQUES_LOCATIFS',
        distinction:
          'Une clause qui demande d’« assurer les locaux loués contre l’incendie » vise presque toujours la responsabilité locative, pas une police sur le bâtiment. Le transfert n’est caractérisé que si le bail vise l’immeuble, la structure ou le clos et le couvert, ou nomme le bailleur comme propriétaire des biens à assurer.',
        question:
          'Le bail met-il à la charge du preneur un bien dont le bailleur est propriétaire, ou seulement la réparation de ce que le preneur endommage ?',
      },
      {
        avec: 'AGENCEMENTS_AMENAGEMENTS',
        distinction:
          'Les agencements et embellissements réalisés par le preneur lui appartiennent en cours de bail, même s’ils reviennent au bailleur en fin de bail. Ils ne relèvent pas de l’assurance de l’immeuble.',
        question: 'Qui a financé l’aménagement, et à qui revient-il en fin de bail ?',
      },
    ],
    actions: {
      // Ne JAMAIS proposer de souscrire : ce serait faire financer par le
      // preneur l'assurance d'un bien qui ne lui appartient pas. L'écart se
      // corrige en retirant l'obligation, pas en l'exécutant.
      [NiveauPreuve.ECART_CONFIRME]:
        'Retirer de l’obligation du preneur la structure, les façades, la toiture et le clos et le couvert, qui appartiennent au bailleur. Ne pas chiffrer d’extension : souscrire reviendrait à lui faire financer l’assurance d’un bien dont il n’est pas propriétaire.',
      [NiveauPreuve.NON_DEMONTREE]:
        'Vérifier auprès du bailleur qui assure l’immeuble. La réponse tranche la clause plus sûrement que sa rédaction.',
    },
  },
  {
    id: 'DOMMAGES_BIENS_PRENEUR',
    libelle: 'Dommages aux biens du preneur',
    categorie: Categorie.DOMMAGES_AUX_BIENS,
    beneficiaire: Beneficiaire.PRENEUR,
    definition:
      'Assurance des biens appartenant au preneur ou dont il a la garde, contre les événements garantis.',
    neCouvrePas: ['L’immeuble du bailleur', 'La responsabilité envers autrui'],
    motifsObligation: [
      {
        pattern: /(?:ses biens|biens (?:propres|appartenant au preneur)|contenu des locaux)[^.\n\r]{0,100}(?:assur|garant)/i,
      },
      { pattern: /(?:assur|garant)[^.\n\r]{0,60}(?:ses biens|ses propres biens|son contenu)/i },
    ],
    motifsCouverture: [
      { pattern: /dommages aux biens|contenu professionnel|biens de l.assur[ée]/i },
    ],
    confusions: [
      {
        avec: 'ASSURANCE_IMMEUBLE_BAILLEUR',
        distinction:
          'C’est la propriété du bien qui départage les deux, jamais sa localisation : un bien du preneur reste à son risque même scellé dans les murs du bailleur.',
        question: 'Le bien figure-t-il à l’inventaire du preneur ou à l’actif du bailleur ?',
      },
    ],
  },
  {
    id: 'AGENCEMENTS_AMENAGEMENTS',
    libelle: 'Agencements, aménagements et embellissements',
    categorie: Categorie.DOMMAGES_AUX_BIENS,
    beneficiaire: Beneficiaire.PRENEUR,
    definition:
      'Assurance des travaux d’aménagement réalisés par le preneur dans les locaux : cloisons, faux plafonds, revêtements, agencements de magasin.',
    neCouvrePas: ['La structure du bâtiment', 'Le mobilier et le matériel, qui font catégorie à part'],
    motifsObligation: [
      { pattern: /\b(?:am[ée]nagements?|agencements?|embellissements?)\b|installations? mobili[èe]res/i, expres: true },
    ],
    motifsCouverture: [
      { pattern: /\b(?:am[ée]nagements?|agencements?|embellissements?|AAE)\b/i, expres: true },
    ],
    confusions: [
      {
        avec: 'ASSURANCE_IMMEUBLE_BAILLEUR',
        distinction:
          'Un agencement fixé à demeure ressemble à de l’immobilier, mais tant que le bail court il reste au risque du preneur qui l’a financé.',
        question: 'L’aménagement est-il porté à l’inventaire du preneur ?',
      },
    ],
  },
  {
    id: 'MOBILIER_MATERIEL_MARCHANDISES',
    libelle: 'Mobilier, matériel et marchandises',
    categorie: Categorie.DOMMAGES_AUX_BIENS,
    beneficiaire: Beneficiaire.PRENEUR,
    definition: 'Assurance du contenu mobilier : mobilier, matériel professionnel, stocks et marchandises.',
    neCouvrePas: ['Les aménagements immobiliers', 'Les biens confiés relevant d’une garantie propre'],
    motifsObligation: [
      {
        // Bornes obligatoires. Sans elles, « mobilier » se reconnaît dans
        // « ensemble immoBILIER » et rattache une clause de renonciation à
        // recours à la garantie du contenu. C'est arrivé, et une seule
        // association de ce genre suffit à faire tout revérifier.
        pattern: /\b(?:mobiliers?|mat[ée]riels?|marchandises?|stocks?)\b/i,
      },
    ],
    motifsCouverture: [
      {
        // « contenu » ne compte pas seul : « le contenu du bail », « le
        // contenu de la police » sont trop fréquents pour marquer une garantie.
        pattern: /\b(?:mobiliers?|mat[ée]riels?|marchandises?|stocks?)\b|contenu (?:professionnel|des locaux|assur[ée])/i,
      },
    ],
    confusions: [],
  },
  {
    id: 'BRIS_DE_MACHINE',
    libelle: 'Bris de machine et matériel informatique',
    categorie: Categorie.DOMMAGES_AUX_BIENS,
    beneficiaire: Beneficiaire.PRENEUR,
    definition:
      'Assurance des dommages internes aux machines et au matériel informatique, y compris sans événement extérieur.',
    neCouvrePas: ['L’usure normale', 'Les frais de reconstitution de données, sauf extension'],
    motifsObligation: [
      { pattern: /bris de machines?|tous risques? informatiques?|mat[ée]riel informatique/i, expres: true },
    ],
    motifsCouverture: [
      { pattern: /bris de machines?|tous risques? informatiques?|\bTRI\b|dommages [ée]lectriques/i, expres: true },
    ],
    confusions: [],
  },

  {
    id: 'RC_ATTEINTE_ENVIRONNEMENT',
    libelle: 'Responsabilité civile atteinte à l’environnement',
    categorie: Categorie.RESPONSABILITE,
    beneficiaire: Beneficiaire.TIERS,
    definition:
      'Responsabilité du preneur pour les dommages et frais de dépollution résultant d’une atteinte à l’environnement. La pollution ACCIDENTELLE et la pollution GRADUELLE relèvent presque toujours de garanties distinctes.',
    neCouvrePas: [
      'La pollution antérieure à la prise d’effet du bail, sauf reprise expresse du passé',
      'La pollution graduelle, quand seule l’accidentelle est souscrite',
      'Les amendes et sanctions administratives',
    ],
    baseJuridique:
      'Code de l’environnement, articles L162-1 et suivants : responsabilité environnementale de l’exploitant.',
    motifsObligation: [
      {
        pattern: /atteintes? [àa] l.environnement|\bpollutions?\b|\bd[ée]pollution\b|contamination des sols/i,
        expres: true,
      },
    ],
    motifsCouverture: [
      {
        pattern: /atteintes? [àa] l.environnement|pollution (?:accidentelle|graduelle)|\bRCAE\b|d[ée]pollution/i,
        expres: true,
      },
    ],
    confusions: [
      {
        avec: 'RC_EXPLOITATION',
        distinction:
          'La RC exploitation exclut presque toujours l’atteinte à l’environnement, qui fait l’objet d’une garantie et d’un capital séparés. Valider une exigence de dépollution sur la ligne RC exploitation est un contresens fréquent et coûteux.',
        question:
          'Le tableau de garanties porte-t-il une ligne « atteinte à l’environnement » distincte, avec son propre capital ?',
      },
    ],
  },
  {
    id: 'DOMMAGES_OUVRAGE',
    libelle: 'Dommages-ouvrage',
    categorie: Categorie.DOMMAGES_AUX_BIENS,
    beneficiaire: Beneficiaire.MIXTE,
    definition:
      'Assurance obligatoire du maître d’ouvrage, qui préfinance la réparation des désordres de nature décennale sans attendre la recherche de responsabilité.',
    neCouvrePas: [
      'Les dommages survenus pendant le chantier, qui relèvent de la tous risques chantier',
      'Les travaux d’entretien ou d’aménagement sans incidence sur la solidité',
    ],
    baseJuridique:
      'Code des assurances, article L242-1 : obligation du maître d’ouvrage, avant l’ouverture du chantier.',
    motifsObligation: [
      { pattern: /dommages?[- ]ouvrage|\bDO\b(?![A-Z])|assurance d[ée]cennale/i, expres: true },
    ],
    motifsCouverture: [
      { pattern: /dommages?[- ]ouvrage|garantie d[ée]cennale/i, expres: true },
    ],
    confusions: [
      {
        avec: 'TOUS_RISQUES_CHANTIER',
        distinction:
          'La dommages-ouvrage joue APRÈS réception, sur les désordres décennaux. La tous risques chantier joue PENDANT les travaux, sur l’ouvrage en cours. Elles ne se remplacent jamais l’une l’autre.',
        question: 'Le sinistre se produit-il avant ou après la réception des travaux ?',
      },
    ],
  },
  {
    id: 'TOUS_RISQUES_CHANTIER',
    libelle: 'Tous risques chantier',
    categorie: Categorie.DOMMAGES_AUX_BIENS,
    beneficiaire: Beneficiaire.MIXTE,
    definition:
      'Assurance des dommages matériels subis par l’ouvrage en cours de construction, ainsi que par les matériels et matériaux du chantier, jusqu’à la réception.',
    neCouvrePas: [
      'Les désordres apparus après réception, qui relèvent de la dommages-ouvrage',
      'La responsabilité des intervenants envers les tiers',
    ],
    motifsObligation: [
      { pattern: /tous risques? chantiers?|\bTRC\b/i, expres: true },
    ],
    motifsCouverture: [
      { pattern: /tous risques? chantiers?|\bTRC\b/i, expres: true },
    ],
    confusions: [
      {
        avec: 'DOMMAGES_OUVRAGE',
        distinction:
          'Deux périodes différentes : la tous risques chantier s’arrête à la réception, la dommages-ouvrage commence après. Un bail qui n’exige que l’une laisse l’autre période découverte.',
        question: 'Le bail couvre-t-il la période de chantier, celle d’après réception, ou les deux ?',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // Pertes financieres
  // ---------------------------------------------------------------------
  {
    id: 'PERTE_EXPLOITATION',
    libelle: 'Pertes d’exploitation',
    categorie: Categorie.PERTES_FINANCIERES,
    beneficiaire: Beneficiaire.PRENEUR,
    definition:
      'Indemnisation de la marge brute perdue et des frais supplémentaires d’exploitation pendant la période d’indemnisation, à la suite d’un sinistre garanti.',
    neCouvrePas: [
      'Les pertes sans sinistre matériel préalable, sauf extension',
      'La perte de loyers du bailleur, qui est une garantie distincte',
    ],
    motifsObligation: [
      { pattern: /pertes? d.exploitation|marge brute|frais suppl[ée]mentaires d.exploitation/i, expres: true },
    ],
    motifsCouverture: [
      { pattern: /pertes? d.exploitation|marge brute|frais suppl[ée]mentaires d.exploitation|\bPE\b/i, expres: true },
    ],
    confusions: [
      {
        avec: 'PERTE_LOYERS',
        distinction:
          'La perte d’exploitation indemnise le preneur de sa marge. La perte de loyers indemnise le bailleur de ses loyers.',
        question: 'Qui subit la perte : celui qui exploite, ou celui qui encaisse le loyer ?',
      },
    ],
  },
  {
    id: 'PERTE_LOYERS',
    libelle: 'Perte de loyers',
    categorie: Categorie.PERTES_FINANCIERES,
    beneficiaire: Beneficiaire.BAILLEUR,
    definition:
      'Indemnisation des loyers et charges que le bailleur cesse de percevoir pendant l’indisponibilité des locaux.',
    neCouvrePas: ['La marge du preneur', 'Les loyers impayés sans sinistre'],
    motifsObligation: [
      {
        // « la perte DES loyers » autant que « perte de loyers » : c'est la
        // redaction la plus courante des baux, et elle etait muette.
        pattern: /pertes? d[eu]s? loyers?|loyers? et charges?[^.\n\r]{0,80}(?:garanti|assur)/i,
        expres: true,
      },
    ],
    motifsCouverture: [
      { pattern: /pertes? d[eu]s? loyers?|privation de loyers?/i, expres: true },
    ],
    confusions: [
      {
        avec: 'PERTE_EXPLOITATION',
        distinction:
          'Deux victimes différentes, donc deux garanties distinctes, chacune avec sa période d’indemnisation. Les confondre revient à valider une couverture qui profite à la mauvaise partie.',
        question: 'L’indemnité est-elle acquise au bailleur ou au preneur ?',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // Mecanismes contractuels
  // ---------------------------------------------------------------------
  {
    id: 'RENONCIATION_RECOURS',
    libelle: 'Renonciation à recours',
    categorie: Categorie.MECANISME,
    beneficiaire: Beneficiaire.MIXTE,
    definition:
      'Engagement d’une partie de ne pas agir contre l’autre, et de faire renoncer son assureur au recours subrogatoire. Les deux moitiés sont nécessaires : la seconde ne peut venir que de la police.',
    neCouvrePas: ['Les recours des tiers, qui ne sont pas parties au bail'],
    baseJuridique:
      'Code des assurances, article L121-12 : l’assureur est subrogé dans les droits de l’assuré ; la renonciation des parties ne le lie que s’il y a consenti.',
    motifsObligation: [
      { pattern: /renonc[a-zéè]*[^.\n\r]{0,60}recours|recours[^.\n\r]{0,40}renonc/i, expres: true },
    ],
    motifsCouverture: [
      { pattern: /renonciation [àa] recours|renonce[^.\n\r]{0,40}recours/i, expres: true },
    ],
    confusions: [
      {
        avec: 'RECOURS_VOISINS_TIERS',
        distinction:
          'Renoncer à recours contre son cocontractant ne dit rien des tiers, qui conservent leur action.',
        question: 'La renonciation vise-t-elle une partie au bail, ou des tiers ?',
      },
    ],
    actions: {
      [NiveauPreuve.ECART_CONFIRME]:
        'Obtenir des conditions particulières portant expressément la renonciation à recours de l’assureur, et vérifier qu’elle couvre le même périmètre de dommages que la clause du bail. Aucune prime ne remplace cet écrit : c’est un accord, pas une garantie.',
    },
  },
  {
    id: 'ASSURANCE_POUR_COMPTE',
    libelle: 'Assurance pour compte',
    categorie: Categorie.MECANISME,
    beneficiaire: Beneficiaire.MIXTE,
    definition:
      'Souscription d’une garantie au profit d’un tiers désigné, ou « pour le compte de qui il appartiendra ». Elle change le bénéficiaire de l’indemnité, pas l’étendue de la garantie.',
    neCouvrePas: ['Une extension de garantie : le périmètre couvert reste celui de la police'],
    baseJuridique: 'Code des assurances, article L112-1, alinéa 3.',
    motifsObligation: [
      { pattern: /pour le compte de qui il appartiendra|assurance pour compte|au profit du bailleur/i, expres: true },
    ],
    motifsCouverture: [
      { pattern: /pour le compte de qui il appartiendra|assurance pour compte|assur[ée] additionnel/i, expres: true },
    ],
    confusions: [
      {
        avec: 'RENONCIATION_RECOURS',
        distinction:
          'L’assurance pour compte donne l’indemnité à un tiers. La renonciation à recours empêche seulement une action.',
        question: 'S’agit-il de désigner un bénéficiaire, ou d’éteindre une action ?',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // Modalites — ni garanties, ni risques
  // ---------------------------------------------------------------------
  {
    id: 'VALEUR_A_NEUF',
    libelle: 'Valeur à neuf',
    categorie: Categorie.MODALITE,
    beneficiaire: Beneficiaire.MIXTE,
    definition:
      'Modalité d’indemnisation : le bien est indemnisé sans déduction de vétusté, dans les limites et conditions de la police.',
    neCouvrePas: ['Elle n’étend aucune garantie : un bien non assuré ne le devient pas'],
    motifsObligation: [
      { pattern: /valeur [àa] neuf|sans (?:d[ée]duction de )?v[ée]tust[ée]/i, expres: true },
    ],
    motifsCouverture: [
      { pattern: /valeur [àa] neuf|v[ée]tust[ée] d[ée]duite|reconstruction [àa] neuf/i, expres: true },
    ],
    confusions: [],
  },
  {
    id: 'FRANCHISE',
    libelle: 'Franchise',
    categorie: Categorie.MODALITE,
    beneficiaire: Beneficiaire.MIXTE,
    definition: 'Part du sinistre qui reste à la charge de l’assuré.',
    neCouvrePas: ['Elle ne se supprime pas par une clause du bail : seule la police la fixe'],
    motifsObligation: [{ pattern: /\bfranchises?\b|reste [àa] charge/i }],
    motifsCouverture: [{ pattern: /\bfranchises?\b|d[ée]duction de/i }],
    confusions: [],
  },
  {
    id: 'CAPITAUX_ASSURES',
    libelle: 'Capitaux assurés',
    categorie: Categorie.MODALITE,
    beneficiaire: Beneficiaire.MIXTE,
    definition: 'Montants de garantie, limites par sinistre et sous-limites applicables.',
    neCouvrePas: ['Un capital élevé ne compense pas une garantie absente'],
    motifsObligation: [{ pattern: /\bcapitaux\b|montants? (?:de )?garantie|montant suffisant/i }],
    motifsCouverture: [
      {
        // « par sinistre » figure sur CHAQUE ligne d'un tableau de garanties :
        // en faire un marqueur de capitaux rattachait n'importe quelle ligne à
        // n'importe quelle exigence de montant.
        pattern: /\bcapitaux\b|limites? de garantie|montants? garantis?/i,
      },
    ],
    confusions: [],
  },
]

export const GARANTIE_PAR_ID: ReadonlyMap<string, Garantie> = new Map(
  NOMENCLATURE.map((garantie) => [garantie.id, garantie]),
)

export function garantie(id: string): Garantie {
  const trouvee = GARANTIE_PAR_ID.get(id)
  if (trouvee === undefined) throw new Error(`Garantie inconnue : « ${id} ».`)
  return trouvee
}

export const NOMBRE_GARANTIES = NOMENCLATURE.length
