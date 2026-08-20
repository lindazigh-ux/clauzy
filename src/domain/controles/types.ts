/**
 * Le referentiel de controles — le coeur metier (brief §5).
 *
 * Les 40 controles sont l'actif principal du produit. Ils ont ete rediges par
 * une praticienne ; ce fichier ne fait que leur donner une forme typee.
 *
 * Deux regles a ne jamais enfreindre :
 *   - un identifiant de controle n'est jamais renumerote (brief §13) ;
 *   - aucun controle ne disparait d'un rapport, quel que soit son etat (§5.2).
 */
import type { Axe, Rapprochement } from '../types'

export type Famille =
  | 'PERIMETRE'
  | 'DAB'
  | 'RENONCIATION'
  | 'INDEMNITES_PE'
  | 'RC_ENVIRONNEMENT'
  | 'TRAVAUX'
  | 'ATTESTATIONS_PROCEDURES'

/**
 * Repartition attendue des 40 controles (brief §5.1).
 * Sert de non-regression : le referentiel doit correspondre, famille par famille.
 */
export const REPARTITION_ATTENDUE = {
  PERIMETRE: 5,
  DAB: 5,
  RENONCIATION: 4,
  INDEMNITES_PE: 8,
  RC_ENVIRONNEMENT: 7,
  TRAVAUX: 3,
  ATTESTATIONS_PROCEDURES: 8,
} as const satisfies Record<Famille, number>

export const NOMBRE_TOTAL_CONTROLES = 40

export const LIBELLES_FAMILLES: Record<Famille, string> = {
  PERIMETRE: 'Périmètre',
  DAB: 'Dommages aux biens',
  RENONCIATION: 'Renonciation à recours',
  INDEMNITES_PE: 'Indemnités et pertes d’exploitation',
  RC_ENVIRONNEMENT: 'Responsabilité civile et environnement',
  TRAVAUX: 'Travaux',
  ATTESTATIONS_PROCEDURES: 'Attestations et procédures',
}

export type Gravite = 1 | 2 | 3

/**
 * Un detecteur ne renvoie jamais un booleen : il renvoie un score de confiance
 * (brief §5.3). Sous le seuil du moteur, le controle bascule en NON_DETECTE —
 * le moteur ne devine jamais.
 */
export type Detecteur = {
  readonly id: string
  /** Variantes de redaction couvertes, pour la lisibilite de la maintenance. */
  readonly motif: RegExp
  /** Poids du detecteur dans le score du controle, 0 a 1. */
  readonly poids: number
  readonly commentaire?: string
}

/** Un controle, tel que redige par la praticienne (brief §5.1). */
export type Controle = {
  /** Stable, jamais renumerote. Ex. « IND-02 ». */
  readonly id: string
  readonly famille: Famille
  readonly libelle: string
  /** Pourquoi cette clause compte. */
  readonly enjeu: string
  /** Ce que risque le preneur. */
  readonly consequence: string
  /** Correction contractuelle prioritaire — toujours proposee en premier (§7). */
  readonly actionBail: string
  /** Repli si la negociation echoue. Jamais avant actionBail (§13). */
  readonly actionAssurance: string
  /** Texte de clause de remplacement. */
  readonly redactionProposee: string
  /** Piece a verser au dossier. */
  readonly preuveCloture: string
  readonly gravite: Gravite
  readonly axes: readonly Axe[]
  readonly detecteursBail: readonly Detecteur[]
  readonly detecteursAssurance: readonly Detecteur[]
}

/** Ajustement manuel du praticien, trace dans le dossier et signale au rapport (§6). */
export type AjustementPraticien = {
  readonly auteur: string
  readonly horodatage: string
  readonly graviteForcee?: Gravite
  readonly etatForce?: Rapprochement['etat']
  readonly motifEcartement?: string
  readonly analyseReecrite?: string
  readonly redactionReecrite?: string
}

/**
 * Ce que le moteur renvoie pour CHAQUE controle, sans exception.
 * Le rapport en affiche 40, quels que soient les etats (brief §5.2).
 */
export type ResultatControle = {
  readonly controleId: string
  readonly rapprochement: Rapprochement
  readonly ajustement: AjustementPraticien | null
}
