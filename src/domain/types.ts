/**
 * Modele de domaine generique (brief §11).
 *
 * Clauzy confronte un referentiel d'OBLIGATIONS a un referentiel de
 * COUVERTURES et produit des RAPPROCHEMENTS. Le bail commercial n'est qu'une
 * source d'obligations parmi d'autres : contrat de sous-traitance, cahier des
 * charges d'appel d'offres, police de l'exercice precedent, exigence
 * contractuelle d'un bailleur.
 *
 * C'est pourquoi aucun type de ce fichier ne s'appelle ClauseBail ou Police.
 * Le jour ou le croisement « police N × police N+1 » arrive, aucune reecriture
 * ne doit etre necessaire.
 */

/** D'ou provient une obligation. Extensible sans toucher au moteur. */
export type SourceObligation =
  | 'BAIL_COMMERCIAL'
  | 'CONTRAT_SOUS_TRAITANCE'
  | 'CAHIER_DES_CHARGES'
  | 'EXIGENCE_CONTRACTUELLE'
  | 'COUVERTURE_ANTERIEURE'

/** Ce qui peut demontrer qu'une obligation est soutenue. */
export type SourceCouverture =
  | 'CONDITIONS_PARTICULIERES'
  | 'CONDITIONS_GENERALES'
  | 'AVENANT'
  | 'ATTESTATION'
  | 'COUVERTURE_RENOUVELEE'

/** Les huit axes d'analyse (brief §5.1). */
export type Axe =
  | 'biens'
  | 'evenements'
  | 'montants'
  | 'duree'
  | 'responsabilites'
  | 'beneficiaires'
  | 'procedures'
  | 'preuves'

export const AXES: readonly Axe[] = [
  'biens',
  'evenements',
  'montants',
  'duree',
  'responsabilites',
  'beneficiaires',
  'procedures',
  'preuves',
]

/**
 * Ancrage d'un constat dans le document d'origine, en offsets de caracteres.
 *
 * On ne recopie jamais le texte ici : il est resolu a l'affichage depuis le
 * document charge en memoire. C'est ce qui permet d'ancrer nativement les
 * commentaires de l'export Word au passage original (brief §7).
 */
export type Ancrage = {
  readonly documentId: string
  readonly debut: number
  readonly fin: number
  /** Reference de lecture humaine, ex. « Article 12.3 ». */
  readonly repere?: string
}

export type NatureValeur = 'duree_mois' | 'montant_eur' | 'pourcentage' | 'date_iso' | 'nombre'

/** Valeur extraite d'un document, avec son ancrage d'origine. */
export type ValeurMesuree = {
  readonly nature: NatureValeur
  readonly valeur: number
  readonly ancrage: Ancrage | null
  /** 0 a 1. Sous le seuil du moteur, le rapprochement bascule en NON_DETECTE. */
  readonly confiance: number
}

/** Ce que la source contractuelle exige. */
export type Obligation = {
  readonly id: string
  readonly controleId: string
  readonly source: SourceObligation
  readonly axes: readonly Axe[]
  readonly ancrage: Ancrage | null
  readonly valeurExigee: ValeurMesuree | null
  readonly confiance: number
  /** Vrai quand le praticien a rattache la clause a la main (brief §6). */
  readonly rattachementManuel: boolean
}

/** Ce que les pieces d'assurance demontrent reellement. */
export type Couverture = {
  readonly id: string
  readonly controleId: string
  readonly source: SourceCouverture
  readonly ancrage: Ancrage | null
  readonly valeurDemontree: ValeurMesuree | null
  readonly confiance: number
  readonly rattachementManuel: boolean
}

/**
 * Les quatre etats d'un rapprochement (brief §5.2).
 *
 * Regle absolue : aucun controle ne disparait. Le moteur renvoie toujours un
 * rapprochement par controle, dans l'un de ces quatre etats. NON_DETECTE n'est
 * pas un echec a masquer : c'est une ligne de checklist a verifier a la main.
 *
 * Note d'extensibilite : ABSENT_DU_BAIL est repris tel quel du brief §5.2.
 * Il se generalisera en « absent de la source d'obligations » quand le
 * deuxieme croisement arrivera (§11).
 */
export type EtatRapprochement = 'ECART' | 'CONFORME' | 'ABSENT_DU_BAIL' | 'NON_DETECTE'

export const ETATS_RAPPROCHEMENT: readonly EtatRapprochement[] = [
  'ECART',
  'CONFORME',
  'ABSENT_DU_BAIL',
  'NON_DETECTE',
]

/** Ecart chiffre — c'est lui qui hierarchise les preconisations (brief §7). */
export type EcartChiffre = {
  readonly nature: NatureValeur
  readonly exige: number
  readonly demontre: number
  readonly ecart: number
  /** Formulation destinee au decideur : « 12 mois de loyer non finances ». */
  readonly formulation: string
}

/** Confrontation d'une obligation et des couvertures qui la soutiennent. */
export type Rapprochement = {
  readonly controleId: string
  readonly etat: EtatRapprochement
  readonly confiance: number
  readonly obligations: readonly Obligation[]
  readonly couvertures: readonly Couverture[]
  readonly ecartChiffre: EcartChiffre | null
}
