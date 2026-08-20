/**
 * Protocole d'echange avec le worker d'analyse (brief §3).
 *
 * Les messages ne franchissent JAMAIS la frontiere du navigateur : un Worker
 * est un fil d'execution de la meme page, pas un service distant. Le texte du
 * bail transite donc ici en clair, et c'est precisement le but — l'analyse a
 * lieu sur le poste du praticien (§2).
 */
import type { Analyse, DocumentAnalyse } from '@/domain/moteur/moteur'

export type DemandeAnalyse = {
  readonly type: 'analyser'
  /** Correlation : plusieurs analyses peuvent se chevaucher. */
  readonly requete: string
  readonly documents: readonly DocumentAnalyse[]
}

export type ReponseAnalyse =
  | { readonly type: 'resultat'; readonly requete: string; readonly analyse: Analyse }
  | { readonly type: 'erreur'; readonly requete: string; readonly message: string }

export type { Analyse, DocumentAnalyse }
