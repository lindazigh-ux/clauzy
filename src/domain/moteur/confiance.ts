/**
 * Score de confiance d'un detecteur (brief §5.3, etapes 2 et 5).
 *
 * Le referentiel ne pondere aucun detecteur : les 40 controles s'appuient sur
 * des motifs de poids 1, et 31 d'entre eux n'en ont qu'un seul. Un score
 * proportionnel au nombre de motifs qui matchent serait donc binaire — 0 ou
 * 100 — c'est-a-dire exactement le booleen que le brief interdit.
 *
 * La confiance vient donc de la QUALITE DE LA PREUVE, pas du seul fait qu'un
 * motif ait matche :
 *
 *   base        noisy-OR des poids des detecteurs qui matchent. Deux motifs
 *               concordants valent mieux qu'un. Un poids abaisse par la
 *               praticienne sur un motif large reste pleinement respecte.
 *   localisation un motif d'assurance qui matche dans un article intitule
 *               « Assurances » est une preuve ; le meme motif dans
 *               « Destination des lieux » est un indice.
 *   etendue     un motif qui s'etale sur 250 caracteres a rapproche deux
 *               fragments qui n'ont peut-etre rien a voir.
 *   negation    « ne sera pas », « sauf », « a l'exception de » a proximite :
 *               la clause dit peut-etre l'inverse de ce que le motif suggere.
 *
 * Chaque signal est multiplicatif, borne et NOMME : le praticien doit pouvoir
 * lire pourquoi un controle est ressorti « a verifier manuellement ». Un score
 * opaque serait invendable sur un outil qui touche au devoir de conseil.
 */
import { Famille, type Detecteur } from '../controles'
import type { Segment } from './segmentation'

/** Au-dessus, le moteur conclut. */
export const SEUIL_CONCLUSION = 60

/** En dessous, le moteur considere qu'il n'a rien trouve du tout. */
export const SEUIL_SIGNAL = 25

export type Signal = {
  readonly libelle: string
  readonly facteur: number
  readonly explication: string
}

export type Correspondance = {
  readonly segment: Segment
  readonly debut: number
  readonly fin: number
  readonly texte: string
}

export type Evaluation = {
  readonly confiance: number
  readonly correspondances: readonly Correspondance[]
  readonly base: number
  readonly signaux: readonly Signal[]
}

/**
 * Mots-cles d'article par famille. Sert uniquement a ponderer la confiance :
 * un titre absent ou inconnu ne disqualifie jamais une correspondance, il la
 * laisse seulement sans corroboration.
 */
const MOTS_CLES_FAMILLE: Record<Famille, readonly string[]> = {
  [Famille.PERIMETRE_DOCUMENTAIRE]: ['annexe', 'piece', 'document', 'designation', 'etat des lieux'],
  [Famille.GARANTIES_FONDAMENTALES]: ['assurance', 'garantie', 'risque locatif', 'responsabilite', 'police'],
  [Famille.DOMMAGES_AUX_BIENS]: ['assurance', 'garantie', 'incendie', 'dommage', 'risque'],
  [Famille.RENONCIATION_RECOURS]: ['renonciation', 'recours', 'subrogation', 'assurance'],
  [Famille.INDEMNITES]: ['indemnite', 'sinistre', 'assurance', 'reconstruction'],
  [Famille.SINISTRE_MAJEUR]: ['sinistre', 'destruction', 'reconstruction', 'resiliation', 'perte'],
  [Famille.RESPONSABILITE_CIVILE]: ['responsabilite', 'recours', 'voisin', 'assurance'],
  [Famille.RISQUES_PARTICULIERS]: ['environnement', 'pollution', 'icpe', 'risque', 'installation'],
  [Famille.TRAVAUX]: ['travaux', 'amenagement', 'embellissement', 'transformation'],
  [Famille.OBLIGATIONS_FORMELLES]: ['assurance', 'attestation', 'justification', 'obligation'],
  [Famille.ARTICULATION_CONTRACTUELLE]: ['assurance', 'clause', 'convention', 'charge'],
}

const MARQUES_DE_NEGATION =
  /\b(?:ne\s+(?:\w+\s+)?(?:pas|plus|jamais|aucun)|n['’]est\s+pas|sans\s+que|sauf|hormis|except[ée]|[àa]\s+l['’]exception|par\s+d[ée]rogation|ne\s+saurait)\b/i

const sansAccents = (texte: string): string =>
  texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const titrePertinent = (segment: Segment, famille: Famille): boolean => {
  if (segment.titre === null) return false
  const titre = sansAccents(segment.titre)
  return (MOTS_CLES_FAMILLE[famille] ?? []).some((mot) => titre.includes(mot))
}

/** Fenetre de voisinage autour d'une correspondance, pour chercher une negation. */
const VOISINAGE = 120

const signalLocalisation = (
  correspondances: readonly Correspondance[],
  famille: Famille,
): Signal => {
  if (correspondances.some((c) => titrePertinent(c.segment, famille))) {
    return {
      libelle: 'localisation',
      facteur: 1,
      explication: 'la clause a été trouvée dans un article dont l’intitulé correspond au contrôle',
    }
  }
  if (correspondances.every((c) => c.segment.titre === null)) {
    return {
      libelle: 'localisation',
      facteur: 0.95,
      explication: 'le document ne porte pas d’intitulés d’articles exploitables',
    }
  }
  return {
    libelle: 'localisation',
    facteur: 0.8,
    explication: 'la clause a été trouvée hors d’un article traitant du sujet',
  }
}

const signalEtendue = (correspondances: readonly Correspondance[]): Signal => {
  const plusCourte = Math.min(...correspondances.map((c) => c.texte.length))
  if (plusCourte <= 120) {
    return { libelle: 'étendue', facteur: 1, explication: 'la clause repérée est courte et dense' }
  }
  if (plusCourte <= 250) {
    return {
      libelle: 'étendue',
      facteur: 0.9,
      explication: 'la clause repérée est longue : le rapprochement des termes est moins direct',
    }
  }
  return {
    libelle: 'étendue',
    facteur: 0.75,
    explication: 'le motif relie des termes très éloignés, qui ne relèvent peut-être pas de la même stipulation',
  }
}

const signalNegation = (correspondances: readonly Correspondance[]): Signal | null => {
  const negation = correspondances.some((c) => {
    const debut = Math.max(0, c.debut - c.segment.debut - VOISINAGE)
    const fin = c.fin - c.segment.debut + VOISINAGE
    return MARQUES_DE_NEGATION.test(c.segment.texte.slice(debut, fin))
  })
  if (!negation) return null
  return {
    libelle: 'négation',
    facteur: 0.65,
    explication: 'une négation ou une exception figure à proximité : la clause dit peut-être l’inverse',
  }
}

const signalCorroboration = (correspondances: readonly Correspondance[]): Signal | null => {
  const segments = new Set(correspondances.map((c) => c.segment.debut))
  if (segments.size < 2) return null
  return {
    libelle: 'corroboration',
    facteur: 1.1,
    explication: `la stipulation apparaît dans ${segments.size} articles distincts`,
  }
}

/** Noisy-OR : deux motifs concordants valent mieux qu'un, sans jamais depasser 1. */
const combinerPoids = (poids: readonly number[]): number =>
  1 - poids.reduce((reste, p) => reste * (1 - Math.min(Math.max(p, 0), 1)), 1)

/**
 * Evalue un jeu de detecteurs sur des segments et renvoie une confiance de 0 a
 * 100, accompagnee des signaux qui l'expliquent.
 */
export function evaluer(
  detecteurs: readonly Detecteur[],
  segments: readonly Segment[],
  famille: Famille,
): Evaluation {
  const correspondances: Correspondance[] = []
  const poidsRetenus: number[] = []

  for (const detecteur of detecteurs) {
    let aMatche = false
    for (const segment of segments) {
      // Les motifs du referentiel ne portent pas le drapeau global : on le pose
      // ici pour recuperer toutes les occurrences sans modifier le referentiel.
      const motif = new RegExp(detecteur.pattern.source, `${detecteur.pattern.flags.replace('g', '')}g`)
      for (const m of segment.texte.matchAll(motif)) {
        aMatche = true
        const debutRelatif = m.index ?? 0
        correspondances.push({
          segment,
          debut: segment.debut + debutRelatif,
          fin: segment.debut + debutRelatif + m[0].length,
          texte: m[0],
        })
      }
    }
    if (aMatche) poidsRetenus.push(detecteur.poids ?? 1)
  }

  if (correspondances.length === 0) {
    return { confiance: 0, correspondances: [], base: 0, signaux: [] }
  }

  const base = combinerPoids(poidsRetenus) * 100

  const signaux = [
    signalLocalisation(correspondances, famille),
    signalEtendue(correspondances),
    signalNegation(correspondances),
    signalCorroboration(correspondances),
  ].filter((signal): signal is Signal => signal !== null)

  const confiance = signaux.reduce((score, signal) => score * signal.facteur, base)

  return {
    confiance: Math.round(Math.min(100, Math.max(0, confiance))),
    correspondances,
    base: Math.round(base),
    signaux,
  }
}
