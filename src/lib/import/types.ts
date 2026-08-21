/**
 * Types de la couche d'import (brief §3).
 *
 * Le nom du fichier vit ici, et NULLE PART AILLEURS qu'en memoire du
 * navigateur : la couche src/lib/net refuse categoriquement un champ nomme
 * « nomFichier », a n'importe quelle profondeur d'une charge sortante (§2).
 * Le moteur, lui, ne recoit meme pas le nom — il n'en a pas besoin, et ce qui
 * n'existe pas ne peut pas fuir.
 */

export type FormatFichier = 'pdf' | 'docx' | 'msg' | 'texte'

/**
 * Role du document dans le croisement (brief §11).
 *
 * Trois sources, pas deux, et la troisieme n'est pas un detail : une garantie
 * peut etre exigee par le bail, exister au contrat, et ne pas figurer sur
 * l'attestation remise au bailleur. C'est un cas frequent, et ce n'est ni une
 * conformite ni un ecart — c'est un defaut de justification, qui se corrige
 * par un courrier et non par un avenant.
 *
 * COUVERTURE designe la piece PROBANTE : conditions particulieres et
 * generales, avenants. ATTESTATION designe la piece DECLARATIVE, qui prouve
 * qu'un contrat existe mais pas ce qu'il couvre.
 */
export type RoleDocument = 'OBLIGATION' | 'COUVERTURE' | 'ATTESTATION'

/** Les deux roles qui repondent, du cote de l'assurance, aux obligations. */
export const estCoteCouverture = (role: RoleDocument): boolean =>
  role === 'COUVERTURE' || role === 'ATTESTATION'

export type EnteteCourriel = {
  readonly objet: string | null
  readonly expediteur: string | null
  readonly destinataires: readonly string[]
  /** ISO 8601, quand la date d'envoi est lisible — elle sert au calcul de relance (§5, L5). */
  readonly envoyeLe: string | null
}

export type DocumentImporte = {
  readonly id: string
  /** Ne quitte jamais le navigateur. */
  readonly nom: string
  readonly format: FormatFichier
  readonly role: RoleDocument
  /** Texte extrait, structure en lignes et paragraphes pour la segmentation. */
  readonly texte: string
  readonly taille: number
  readonly pages: number | null
  /**
   * Ce que la lecture n'a pas su faire. Affiche au praticien et repris dans la
   * page « Perimetre et limites » du rapport (§7) : un document mal lu doit se
   * voir, jamais se deviner.
   */
  readonly avertissements: readonly string[]
  readonly courriel: EnteteCourriel | null
  readonly piecesJointes: readonly DocumentImporte[]
}

/**
 * Une lecture qui echoue dit quoi faire (§8), jamais « une erreur est survenue ».
 */
export class ErreurLecture extends Error {
  readonly nomFichier: string

  constructor(nomFichier: string, message: string) {
    super(message)
    this.name = 'ErreurLecture'
    this.nomFichier = nomFichier
  }
}
