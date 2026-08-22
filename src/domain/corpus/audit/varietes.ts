/**
 * Les variétés que le Golden Dataset doit couvrir (brief §13).
 *
 * Le brief ne demande pas cinquante dossiers : il demande cinquante dossiers
 * « réellement variés », et énumère ce que « varié » veut dire. Sans cette
 * liste, un jeu d'essai grossit sans se diversifier — on écrit dix fois le cas
 * qu'on sait traiter, et la couverture n'avance pas.
 *
 * L'énumération rend la couverture MESURABLE : un test vérifie que chaque
 * variété est portée par au moins un dossier, et le compte rendu de lot peut
 * dire lesquelles restent minces.
 */
export enum Variete {
  /** Une ou deux clauses, rédaction directe. Le cas nominal. */
  BAIL_SIMPLE = 'BAIL_SIMPLE',
  /** Beaucoup d'articles, dont la plupart ne parlent pas d'assurance. */
  BAIL_LONG = 'BAIL_LONG',
  /** L'obligation vit dans une sous-clause, un alinéa, une énumération. */
  CLAUSES_IMBRIQUEES = 'CLAUSES_IMBRIQUEES',
  /** « Le preneur s'oblige à faire assurer », « à concurrence de », « ledit ». */
  FORMULATION_ANCIENNE = 'FORMULATION_ANCIENNE',
  /** Le bail décrit un risque, la police le nomme autrement. */
  SYNONYME_ASSUREUR = 'SYNONYME_ASSUREUR',
  /** Une garantie plus large répond à une exigence plus étroite. */
  GARANTIE_ENGLOBANTE = 'GARANTIE_ENGLOBANTE',
  /** La police couvre une partie de ce que le bail exige, pas tout. */
  COUVERTURE_PARTIELLE = 'COUVERTURE_PARTIELLE',
  /** Le bon libellé, le mauvais montant. L'écart le plus silencieux. */
  PLAFOND_INSUFFISANT = 'PLAFOND_INSUFFISANT',
  /** Le bail promet une franchise que la police ne tient pas. */
  FRANCHISE = 'FRANCHISE',
  /** La police exclut ce que le bail impose. */
  EXCLUSION = 'EXCLUSION',
  /** L'attestation ne porte qu'une part de ce que le contrat couvre. */
  ATTESTATION_PARTIELLE = 'ATTESTATION_PARTIELLE',
  /** Aucune condition particulière produite. */
  CONTRAT_ABSENT = 'CONTRAT_ABSENT',
  /** Le bail ne parle pas d'assurance. Le moteur doit se taire. */
  BAIL_MUET = 'BAIL_MUET',
  /** Deux clauses acceptables seules, incompatibles ensemble. */
  CONTRADICTION = 'CONTRADICTION',
  /** « mobilier » dans « immobilier », « par sinistre » pris pour un capital. */
  FAUX_AMI_LEXICAL = 'FAUX_AMI_LEXICAL',
  /** « Le preneur n'est pas tenu d'assurer… » — la négation inverse le sens. */
  NEGATION = 'NEGATION',
  /** « … sauf pour les biens du bailleur », « à l'exception de ». */
  EXCEPTION = 'EXCEPTION',
  /** Réciproque, conditionnelle, en cascade, sous réserve d'accord. */
  RENONCIATION_COMPLEXE = 'RENONCIATION_COMPLEXE',
}

export const LIBELLE_VARIETE: Record<Variete, string> = {
  [Variete.BAIL_SIMPLE]: 'Bail simple',
  [Variete.BAIL_LONG]: 'Bail long',
  [Variete.CLAUSES_IMBRIQUEES]: 'Clauses imbriquées',
  [Variete.FORMULATION_ANCIENNE]: 'Formulation ancienne',
  [Variete.SYNONYME_ASSUREUR]: 'Synonyme d’assureur',
  [Variete.GARANTIE_ENGLOBANTE]: 'Garantie englobante',
  [Variete.COUVERTURE_PARTIELLE]: 'Couverture partielle',
  [Variete.PLAFOND_INSUFFISANT]: 'Plafond insuffisant',
  [Variete.FRANCHISE]: 'Franchise',
  [Variete.EXCLUSION]: 'Exclusion',
  [Variete.ATTESTATION_PARTIELLE]: 'Attestation partielle',
  [Variete.CONTRAT_ABSENT]: 'Contrat absent',
  [Variete.BAIL_MUET]: 'Bail muet',
  [Variete.CONTRADICTION]: 'Contradiction',
  [Variete.FAUX_AMI_LEXICAL]: 'Faux ami lexical',
  [Variete.NEGATION]: 'Négation',
  [Variete.EXCEPTION]: 'Exception',
  [Variete.RENONCIATION_COMPLEXE]: 'Renonciation complexe',
}
