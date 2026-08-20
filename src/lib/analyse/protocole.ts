/**
 * Protocole d'echange avec le worker d'analyse (brief §3).
 *
 * Les messages ne franchissent JAMAIS la frontiere du navigateur : un Worker
 * est un fil d'execution de la meme page, pas un service distant. Le texte du
 * bail transite donc ici en clair, et c'est precisement le but — l'analyse a
 * lieu sur le poste du praticien (§2).
 */
import type { Analyse, DocumentAnalyse } from '@/domain/moteur/moteur'
import type { DocumentImporte, RoleDocument } from '@/lib/import'

export type DemandeAnalyse = {
  readonly type: 'analyser'
  /** Correlation : plusieurs demandes peuvent se chevaucher. */
  readonly requete: string
  readonly documents: readonly DocumentAnalyse[]
}

/**
 * Lecture d'un fichier dans le worker.
 *
 * Le brief §3 demande d'isoler le parsing : un PDF de 200 pages fige le fil
 * principal pendant plusieurs secondes, et c'est justement le moment ou le
 * praticien attend un signe de vie. L'ArrayBuffer est transfere, pas copie.
 */
export type DemandeLecture = {
  readonly type: 'lire'
  readonly requete: string
  readonly nom: string
  readonly donnees: ArrayBuffer
  readonly role: RoleDocument
}

export type Demande = DemandeAnalyse | DemandeLecture

export type Reponse =
  | { readonly type: 'resultat'; readonly requete: string; readonly analyse: Analyse }
  | { readonly type: 'document'; readonly requete: string; readonly document: DocumentImporte }
  | { readonly type: 'erreur'; readonly requete: string; readonly message: string }

/** Conserve pour les appelants existants. */
export type ReponseAnalyse = Reponse

export type { Analyse, DocumentAnalyse, DocumentImporte, RoleDocument }
