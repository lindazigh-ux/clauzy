/**
 * Le Golden Dataset — sa forme, et sa discipline (brief §12).
 *
 * Trois règles, et elles sont la valeur du jeu d'essai :
 *
 *   1. L'attendu est écrit AVANT que le moteur ne tourne. Un attendu déduit de
 *      la sortie ne mesure que la capacité du moteur à se confirmer lui-même.
 *   2. Il est ensuite FIGÉ : `figeLe` porte la date, et sert de rappel.
 *   3. Toute correction ultérieure est DOCUMENTÉE dans `historique`, avec sa
 *      raison. Un attendu qu'on réécrit en silence pour faire passer un test
 *      détruit le jeu d'essai en une ligne de diff.
 *
 * Toutes les rédactions sont SYNTHÉTIQUES (§5.4, §15). Aucun document client,
 * sous aucune forme, y compris anonymisé.
 */
import type { NiveauPreuve } from '../../garanties/types'
import type { Variete } from './varietes'

/** Les niveaux, en clair, pour que l'attendu se lise sans ouvrir le moteur. */
export const NIVEAUX = {
  ETABLIE: 'ETABLIE',
  JUSTIFICATION_INSUFFISANTE: 'JUSTIFICATION_INSUFFISANTE',
  PROBABLE: 'PROBABLE',
  NON_DEMONTREE: 'NON_DEMONTREE',
  ECART_CONFIRME: 'ECART_CONFIRME',
} as const satisfies Record<NiveauPreuve, string>

export type NiveauAttendu = keyof typeof NIVEAUX

export type AttenduGarantie = {
  readonly garantieId: string
  readonly niveau: NiveauAttendu
  /** Fragment que l'extrait cité doit contenir. Vérifie l'ancrage, pas le statut. */
  readonly extraitContient?: string
  /** Fragment que la recommandation doit contenir. */
  readonly actionContient?: string
  /**
   * L'attendu est juste — le moteur ne le tient pas encore. La raison, ici.
   *
   * Sans ce champ, un jeu d'essai n'a que deux issues : passer, ou être
   * réécrit. La seconde détruit le jeu d'essai, et la première pousse à
   * n'écrire que des cas déjà traités. Une limite déclarée garde l'attendu
   * MÉTIER intact et rend la lacune comptable — c'est elle que les métriques
   * du §14 mesureront.
   *
   * Le test l'inverse : il vérifie que la limite tient TOUJOURS. Le jour où le
   * moteur y arrive, le cas échoue avec « limite levée : promouvoir
   * l'attendu ». Une limite ne se périme donc jamais en silence.
   */
  readonly limiteConnue?: string
}

/**
 * Une correction d'attendu, et sa raison.
 *
 * On ne corrige un attendu qu'après avoir démontré qu'il était faux — jamais
 * pour faire passer un test. La trace rend l'arbitrage relisible : c'est elle
 * qui distingue un jeu d'essai d'un instantané du moteur.
 */
export type CorrectionAttendu = {
  readonly le: string
  /** Ce qui a changé dans l'attendu. */
  readonly quoi: string
  /** Pourquoi l'attendu d'origine était faux. */
  readonly pourquoi: string
}

export type DossierAudit = {
  readonly id: string
  readonly intitule: string
  /** Ce que le cas met à l'épreuve, en une phrase. */
  readonly enjeu: string
  /** Ce que ce dossier apporte à la couverture (§13). */
  readonly varietes: readonly Variete[]
  /** Date à laquelle l'attendu a été figé. */
  readonly figeLe: string
  readonly bail: string
  readonly contrat: string | null
  readonly attestation: string | null
  /** Garanties attendues, avec leur niveau de preuve. */
  readonly garanties: readonly AttenduGarantie[]
  /** Garanties qu'il serait FAUX de reconnaître ici. */
  readonly interdites: readonly string[]
  /** Identifiants de règles de cohérence attendues. */
  readonly incoherences: readonly string[]
  /**
   * Contrôles attendus en ÉCART, exactement.
   *
   * Verrouille le niveau des CONTRÔLES, pas seulement celui des garanties : un
   * écart qui apparaît ou disparaît sans qu'on l'ait voulu est une régression,
   * même si le rapprochement, lui, n'a pas bougé.
   */
  readonly ecarts: readonly string[]
  /**
   * Contrôles qu'un praticien mettrait en écart, et que le moteur classe
   * seulement « à vérifier ».
   *
   * Le pendant, côté contrôle, de `limiteConnue`. Ce n'est PAS une fausse
   * conformité — « à vérifier » reste une conclusion honnête au sens du §46 —
   * mais c'est une sensibilité insuffisante, et elle doit se compter.
   */
  readonly limitesControles?: readonly {
    readonly controleId: string
    readonly pourquoi: string
  }[]
  /** Les corrections d'attendu, s'il y en a eu. Vide dans le cas normal. */
  readonly historique?: readonly CorrectionAttendu[]
}
