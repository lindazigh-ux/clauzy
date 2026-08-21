/**
 * Cohérence interne du bail — la lecture transversale.
 *
 * Tout le reste du moteur raisonne clause par clause : un contrôle regarde une
 * stipulation, un rapprochement regarde un risque. Or une clause parfaitement
 * acceptable prise isolément peut devenir incohérente avec une autre, trois
 * articles plus loin. C'est le défaut qu'aucune relecture linéaire n'attrape,
 * et celui qui se paie au sinistre — chaque partie invoquant alors celle des
 * deux clauses qui l'arrange.
 *
 * Ce module ne conclut jamais. Il signale une INCOHÉRENCE POTENTIELLE, nomme
 * les deux articles en cause, explique en quoi elles se contredisent, et dit
 * quoi faire. Le praticien tranche ; l'outil montre.
 */
import type { Gravite } from '../controles'

/** Où une stipulation a été lue : le document, l'article, la position exacte. */
export type Ancrage = {
  readonly documentId: string
  /** « 12 », « 12.3 », « III ». Null quand le document ne numérote pas. */
  readonly article: string | null
  readonly intitule: string | null
  readonly texte: string
  /** Offsets absolus : ils portent l'ancrage Word, comme partout (§7). */
  readonly debut: number
  readonly fin: number
}

/**
 * Ce qu'une règle cherche.
 *
 * `exclut` joue dans la MÊME stipulation : une clause qui fait renoncer les
 * deux parties ne doit pas être lue comme une renonciation unilatérale.
 */
export type Motif = {
  readonly pattern: RegExp
  readonly libelle: string
  readonly exclut?: readonly RegExp[]
}

/**
 * Nature du défaut.
 *
 * CONTRADICTION : deux stipulations se contredisent. Les deux existent, et
 *                 c'est leur coexistence qui pose problème.
 * LACUNE        : une stipulation appelle une contrepartie qui n'existe nulle
 *                 part. Ce n'est pas une contradiction, c'est une moitié
 *                 manquante — et elle se cherche souvent dans une AUTRE pièce.
 */
export type NatureIncoherence = 'CONTRADICTION' | 'LACUNE'

export type Regle = {
  /** Identifiant stable, cité dans les rapports. Ne se renumérote jamais. */
  readonly id: string
  readonly titre: string
  readonly nature: NatureIncoherence
  readonly gravite: Gravite
  /** La première stipulation, cherchée dans le document source. */
  readonly premier: Motif
  /**
   * La seconde. Pour une CONTRADICTION, elle doit se trouver dans une AUTRE
   * stipulation que la première — deux motifs qui répondent sur la même phrase
   * décrivent le même fait, pas deux faits contradictoires.
   */
  readonly second: Motif
  /** Où chercher la seconde : dans le bail, ou dans les pièces d'assurance. */
  readonly cherche: 'OBLIGATION' | 'COUVERTURE'
  /** En quoi les deux se contredisent. Écrit pour être cité au rapport. */
  readonly explication: string
  /** Ce qu'il y a à faire. Une alerte sans suite ne sert à rien. */
  readonly action: string
  readonly baseJuridique?: string
}

export type Incoherence = {
  readonly regleId: string
  readonly titre: string
  readonly nature: NatureIncoherence
  readonly gravite: Gravite
  readonly premier: Ancrage
  /** Null sur une LACUNE : la contrepartie est justement introuvable. */
  readonly second: Ancrage | null
  readonly explication: string
  readonly action: string
  readonly baseJuridique?: string
  /** « Incohérence potentielle entre les articles 12.4 et 16.2 ». */
  readonly resume: string
}
