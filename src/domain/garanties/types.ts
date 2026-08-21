/**
 * Nomenclature des garanties — la couche qui manquait au moteur.
 *
 * Le moteur d'origine allait de la CLAUSE au CONTROLE par des motifs de texte.
 * Il lisait donc des mots, pas des risques, et le defaut se voyait sur la
 * stipulation la plus banale d'un bail commercial :
 *
 *   « Le Preneur devra assurer les locaux loués contre l'incendie,
 *     l'explosion et les dégâts des eaux. »
 *
 * Face a une police portant « Garantie responsabilité locative : 1 500 000 € »,
 * l'ancien moteur cherchait « incendie » dans les pieces, ne l'y trouvait pas,
 * et affirmait un ECART a 100 % de confiance. Un courtier, lui, lit une
 * exigence de RISQUES LOCATIFS et la voit satisfaite.
 *
 * On interpose donc un niveau : la GARANTIE. Une garantie n'est pas un
 * mot-clef, c'est un risque nomme — ce qu'il couvre, qui il protege, ce qu'il
 * ne couvre pas, et ce avec quoi il ne doit surtout pas etre confondu.
 *
 * Vocabulaire volontairement generique (brief §11) : `Garantie` se confronte a
 * `Obligation`, et rien ici ne dit « bail ». Un contrat de sous-traitance
 * expose les memes risques.
 */

/**
 * Ce qu'une garantie est, structurellement. La distinction commande tout le
 * reste : une RESPONSABILITE indemnise le prejudice cause a autrui, une
 * assurance de CHOSES indemnise un bien. Confondre les deux, c'est exactement
 * le defaut des risques locatifs.
 */
export enum Categorie {
  /** Repare le dommage cause a autrui. Le beneficiaire est un tiers lese. */
  RESPONSABILITE = 'RESPONSABILITE',
  /** Repare un bien. Le beneficiaire est le proprietaire du bien, ou son porteur de risque. */
  DOMMAGES_AUX_BIENS = 'DOMMAGES_AUX_BIENS',
  /** Repare une perte d'argent : marge, loyers, frais supplementaires. */
  PERTES_FINANCIERES = 'PERTES_FINANCIERES',
  /** N'est pas une garantie : une modalite d'indemnisation ou de limitation. */
  MODALITE = 'MODALITE',
  /** N'est pas une garantie : un mecanisme contractuel entre les parties. */
  MECANISME = 'MECANISME',
}

/** Au profit de qui la garantie joue reellement. */
export enum Beneficiaire {
  BAILLEUR = 'BAILLEUR',
  PRENEUR = 'PRENEUR',
  TIERS = 'TIERS',
  /** Les deux parties, ou indetermine sans lecture des conditions particulieres. */
  MIXTE = 'MIXTE',
}

export const LIBELLE_BENEFICIAIRE: Record<Beneficiaire, string> = {
  [Beneficiaire.BAILLEUR]: 'Bailleur',
  [Beneficiaire.PRENEUR]: 'Preneur',
  [Beneficiaire.TIERS]: 'Tiers',
  [Beneficiaire.MIXTE]: 'Les deux parties',
}

/**
 * Une confusion a ecarter — le champ le plus important de ce fichier.
 *
 * Il ne suffit pas de nommer les garanties : il faut dire ce qui les separe,
 * et par quelle QUESTION on tranche. C'est ce que fait un courtier devant une
 * clause ambigue, et c'est ce que le moteur doit rendre visible plutot que de
 * trancher en silence.
 */
export type Confusion = {
  /** Identifiant de la garantie avec laquelle la confusion est frequente. */
  readonly avec: string
  /** Ce qui les separe, en une phrase. */
  readonly distinction: string
  /** La question qui tranche, posee au praticien quand le doute subsiste. */
  readonly question: string
}

/**
 * Motif de reconnaissance.
 *
 * `exclut` est ce qui manquait : un motif qui reconnait « assurer les locaux
 * loués » doit ceder devant « assurer l'immeuble appartenant au bailleur ».
 * Sans motif d'exclusion, tout motif large finit par tout attraper.
 */
export type Motif = {
  readonly pattern: RegExp
  /** Poids dans la reconnaissance. 1 par defaut ; un motif large se pondere a la baisse. */
  readonly poids?: number
  readonly libelle?: string
  /** Si l'un de ces motifs correspond dans la meme stipulation, celui-ci ne compte pas. */
  readonly exclut?: readonly RegExp[]
  /**
   * Le motif NOMME la garantie, il ne la paraphrase pas.
   *
   * La distinction commande la preseance. « Les risques locatifs ainsi que le
   * recours des voisins et des tiers » nomme deux garanties : les deux sont
   * exigees, et aucune ne chasse l'autre. « Assurer les locaux contre
   * l'incendie » n'en nomme aucune : c'est une paraphrase, susceptible de
   * plusieurs lectures, et la plus specifique doit alors l'emporter.
   *
   * Autrement dit : une garantie expressement nommee ne se laisse jamais
   * ecarter ; une paraphrase, si.
   */
  readonly expres?: boolean
}

export type Garantie = {
  /**
   * Identifiant stable, cite dans les rapports. Comme pour les controles, il
   * ne se renumerote jamais (§13).
   */
  readonly id: string
  readonly libelle: string
  readonly categorie: Categorie
  readonly beneficiaire: Beneficiaire
  /** Ce que la garantie repare, en une phrase qu'un client comprend. */
  readonly definition: string
  /** Ce qu'elle NE repare PAS — dit ici plutot que decouvert au sinistre. */
  readonly neCouvrePas: readonly string[]
  readonly baseJuridique?: string
  /** Comment l'exigence se reconnait dans un document source. */
  readonly motifsObligation: readonly Motif[]
  /** Comment la garantie se reconnait dans une piece d'assurance. */
  readonly motifsCouverture: readonly Motif[]
  /** Les confusions frequentes, et la question qui tranche. */
  readonly confusions: readonly Confusion[]
  /**
   * Action propre a cette garantie, quand celle de sa categorie ne convient
   * pas. Renseignee au cas par cas, jamais par confort.
   */
  readonly actions?: Partial<Record<NiveauPreuve, string>>
  /**
   * Garanties qui, prises ensemble, satisfont celle-ci. Une « RC occupant »
   * repond a une exigence de risques locatifs ET de recours voisins et tiers :
   * sans cette notion, le moteur reclamerait une ligne qui n'existe pas.
   */
  readonly satisfaitePar?: readonly string[]
}

/**
 * Niveau de preuve d'une garantie — la distinction entre « absent » et
 * « non demontre ».
 *
 * Il vit ici, et non dans le moteur, parce qu'une garantie doit pouvoir dire
 * elle-meme ce que chaque niveau appelle comme geste. Une action generique
 * appliquee a toutes les garanties — « negocier la clause d'abord, chiffrer
 * l'extension ensuite » — est fausse une fois sur deux : on ne negocie pas une
 * franchise, on ne chiffre pas une extension de renonciation a recours.
 */
export enum NiveauPreuve {
  /** Garantie identifiee, nommee, dans une piece probante. */
  ETABLIE = 'ETABLIE',
  /** Au contrat, absente de l'attestation fournie. Ni conformite, ni ecart. */
  JUSTIFICATION_INSUFFISANTE = 'JUSTIFICATION_INSUFFISANTE',
  /** Correspondance probable : garantie englobante, ou attestation seule. */
  PROBABLE = 'PROBABLE',
  /** Les pieces ne permettent pas de conclure. Ce n'est PAS une absence. */
  NON_DEMONTREE = 'NON_DEMONTREE',
  /** Documents suffisants et contradiction claire : l'ecart est confirme. */
  ECART_CONFIRME = 'ECART_CONFIRME',
}

export const LIBELLE_PREUVE: Record<NiveauPreuve, string> = {
  [NiveauPreuve.ETABLIE]: 'Couverture établie',
  [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]: 'Couverture existante, justification insuffisante',
  [NiveauPreuve.PROBABLE]: 'Couverture probable',
  [NiveauPreuve.NON_DEMONTREE]: 'Couverture non démontrée',
  [NiveauPreuve.ECART_CONFIRME]: 'Écart confirmé',
}

/**
 * Ce que chaque niveau appelle, par defaut, selon la NATURE de la garantie.
 *
 * Une responsabilite absente se negocie puis se chiffre. Une modalite
 * d'indemnisation ne se negocie pas : elle se confirme aux conditions
 * particulieres. Un mecanisme contractuel ne s'achete pas : il s'obtient par
 * ecrit de l'assureur. Confondre les trois envoie le courtier au mauvais
 * interlocuteur.
 */
export const ACTION_PAR_CATEGORIE: Record<Categorie, Record<NiveauPreuve, string>> = {
  [Categorie.RESPONSABILITE]: {
    [NiveauPreuve.ETABLIE]: 'Point clos.',
    [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]:
      'Demander une attestation qui détaille cette garantie et son montant. Le contrat n’est pas en cause.',
    [NiveauPreuve.PROBABLE]:
      'Faire confirmer la garantie et son montant aux conditions particulières avant de conclure.',
    [NiveauPreuve.NON_DEMONTREE]:
      'Réclamer les conditions particulières. Sans elles, la responsabilité ne peut être ni confirmée ni écartée.',
    [NiveauPreuve.ECART_CONFIRME]:
      'Corriger la clause du bail en premier ; à défaut, chiffrer l’extension de garantie auprès de la compagnie.',
  },
  [Categorie.DOMMAGES_AUX_BIENS]: {
    [NiveauPreuve.ETABLIE]: 'Point clos.',
    [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]:
      'Demander une attestation mentionnant cette catégorie de biens et son capital.',
    [NiveauPreuve.PROBABLE]:
      'Faire confirmer le périmètre des biens couverts et leur capital aux conditions particulières.',
    [NiveauPreuve.NON_DEMONTREE]:
      'Réclamer l’inventaire valorisé et le tableau de garanties : sans eux, aucun capital ne se vérifie.',
    [NiveauPreuve.ECART_CONFIRME]:
      'Limiter l’obligation du bail aux biens dont le preneur est propriétaire ou gardien ; à défaut, faire étendre le périmètre assuré.',
  },
  [Categorie.PERTES_FINANCIERES]: {
    [NiveauPreuve.ETABLIE]: 'Point clos.',
    [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]:
      'Demander une attestation portant la période d’indemnisation, que les attestations omettent presque toujours.',
    [NiveauPreuve.PROBABLE]:
      'Faire confirmer la période d’indemnisation et l’assiette aux conditions particulières.',
    [NiveauPreuve.NON_DEMONTREE]:
      'Réclamer les conditions particulières : la période d’indemnisation ne figure jamais sur une attestation.',
    [NiveauPreuve.ECART_CONFIRME]:
      'Aligner la durée exigée par le bail sur la période réellement indemnisée, ou faire chiffrer l’allongement de cette période.',
  },
  [Categorie.MODALITE]: {
    [NiveauPreuve.ETABLIE]: 'Point clos.',
    [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]:
      'Demander une attestation reprenant cette modalité : une attestation muette ne l’oppose à personne.',
    [NiveauPreuve.PROBABLE]: 'Faire confirmer la modalité et ses conditions d’application par écrit.',
    [NiveauPreuve.NON_DEMONTREE]:
      'Réclamer les conditions particulières : une modalité d’indemnisation ne se déduit pas.',
    // Une modalité ne se négocie pas et ne s'achète pas en extension : elle se
    // constate. Le défaut vient presque toujours d'une promesse du bail que la
    // police ne tient pas.
    [NiveauPreuve.ECART_CONFIRME]:
      'Faire constater la modalité réelle aux conditions particulières, puis corriger la promesse du bail qui ne lui correspond pas.',
  },
  [Categorie.MECANISME]: {
    [NiveauPreuve.ETABLIE]: 'Point clos.',
    [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]:
      'Demander une attestation portant expressément ce mécanisme : sans mention, il n’est pas opposable.',
    [NiveauPreuve.PROBABLE]: 'Faire confirmer le mécanisme et son périmètre par écrit de l’assureur.',
    [NiveauPreuve.NON_DEMONTREE]:
      'Réclamer les conditions particulières : ce mécanisme ne se présume pas.',
    // Un mécanisme ne s'achète pas : il s'obtient par un écrit de l'assureur.
    [NiveauPreuve.ECART_CONFIRME]:
      'Obtenir l’accord écrit de l’assureur : le bail ne peut pas créer cet engagement à sa place.',
  },
}
