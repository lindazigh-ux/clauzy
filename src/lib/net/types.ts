/**
 * Types de la couche reseau. Voir src/lib/net/README.md.
 *
 * Seules des valeurs scalaires peuvent quitter le navigateur (brief §2) :
 * il n'existe volontairement aucun type de charge imbriquee.
 */

export type ValeurSortante = string | number | boolean

export type ChargeSortante = Readonly<Record<string, ValeurSortante>>

export type TypeChamp = 'chaine' | 'nombre' | 'booleen'

export type SpecChamp = {
  readonly type: TypeChamp
  /** Obligatoire pour les chaines : plafond de longueur, 512 caracteres maximum. */
  readonly longueurMax?: number
  readonly obligatoire?: boolean
  /** Enumeration fermee des valeurs acceptees. */
  readonly valeurs?: readonly ValeurSortante[]
  /** Ce que ce champ transporte, et pourquoi le brief §2 l'autorise. */
  readonly justification: string
}

export type Methode = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export type DefinitionEndpoint = {
  readonly methode: Methode
  /** Toujours relatif : la meme origine, jamais un tiers. */
  readonly chemin: `/api/${string}`
  /** Allowlist exhaustive. Un objet vide signifie : aucun corps autorise. */
  readonly champs: Readonly<Record<string, SpecChamp>>
}
