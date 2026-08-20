/**
 * Reconstitution des lignes et paragraphes d'un PDF.
 *
 * Un PDF ne contient pas de lignes : il contient des fragments de texte poses
 * a des coordonnees. Concatener ces fragments bout a bout produit un pave
 * unique, dans lequel la segmentation ne reconnait plus aucun titre d'article —
 * et sans titre d'article, le moteur perd la ponderation de localisation et
 * l'ancrage des commentaires Word devient illisible (§5.3, §7).
 *
 * On reconstitue donc la mise en page a partir des coordonnees. Fonction pure,
 * testable sans PDF : c'est la partie qui casse en silence, elle merite d'etre
 * eprouvee pour elle-meme.
 */

export type FragmentTexte = {
  readonly texte: string
  /** Origine PDF : x croit vers la droite, y croit vers le HAUT. */
  readonly x: number
  readonly y: number
  readonly largeur: number
  readonly hauteur: number
}

/** Deux fragments dont les ordonnees different de moins de ceci sont sur la meme ligne. */
const TOLERANCE_LIGNE = 0.6

/** Au-dela de ce multiple de l'interligne courant, on considere un changement de paragraphe. */
const FACTEUR_PARAGRAPHE = 1.6

/** En deca de cette fraction de la hauteur de police, deux fragments se touchent. */
const FRACTION_ESPACE = 0.22

type Ligne = {
  readonly y: number
  readonly hauteur: number
  readonly fragments: FragmentTexte[]
}

const regrouperEnLignes = (fragments: readonly FragmentTexte[]): Ligne[] => {
  const lignes: Ligne[] = []

  for (const fragment of [...fragments].sort((a, b) => b.y - a.y)) {
    if (fragment.texte.length === 0) continue
    const hauteur = fragment.hauteur > 0 ? fragment.hauteur : 10
    const derniere = lignes[lignes.length - 1]

    if (derniere !== undefined && Math.abs(derniere.y - fragment.y) <= TOLERANCE_LIGNE * hauteur) {
      derniere.fragments.push(fragment)
      continue
    }
    lignes.push({ y: fragment.y, hauteur, fragments: [fragment] })
  }

  return lignes
}

const assemblerLigne = (ligne: Ligne): string => {
  const ordonnes = [...ligne.fragments].sort((a, b) => a.x - b.x)
  let texte = ''
  let finPrecedente: number | null = null

  for (const fragment of ordonnes) {
    if (finPrecedente !== null) {
      const ecart = fragment.x - finPrecedente
      const seuil = FRACTION_ESPACE * (fragment.hauteur > 0 ? fragment.hauteur : 10)
      const colle = ecart <= seuil
      const dejaEspace = texte.endsWith(' ') || fragment.texte.startsWith(' ')
      if (!colle && !dejaEspace) texte += ' '
    }
    texte += fragment.texte
    finPrecedente = fragment.x + fragment.largeur
  }

  return texte.replace(/[ \t]+/g, ' ').trimEnd()
}

/**
 * Rend le texte d'une page, lignes et paragraphes reconstitues.
 *
 * Les paragraphes sont separes par une ligne vide, ce que la segmentation
 * utilise pour decouper les alineas.
 */
export function reconstituerTexte(fragments: readonly FragmentTexte[]): string {
  const lignes = regrouperEnLignes(fragments)
  if (lignes.length === 0) return ''

  // Interligne de reference : la mediane des ecarts observes resiste mieux
  // qu'une moyenne aux titres et aux notes de bas de page.
  const ecarts: number[] = []
  for (let index = 1; index < lignes.length; index += 1) {
    const precedente = lignes[index - 1]
    const courante = lignes[index]
    if (precedente === undefined || courante === undefined) continue
    ecarts.push(Math.abs(precedente.y - courante.y))
  }
  ecarts.sort((a, b) => a - b)
  const interligne = ecarts.length === 0 ? 0 : (ecarts[Math.floor(ecarts.length / 2)] ?? 0)

  let texte = ''
  lignes.forEach((ligne, index) => {
    const contenu = assemblerLigne(ligne)
    if (contenu.trim().length === 0) return

    if (index > 0) {
      const precedente = lignes[index - 1]
      const ecart = precedente === undefined ? 0 : Math.abs(precedente.y - ligne.y)
      const nouveauParagraphe = interligne > 0 && ecart > FACTEUR_PARAGRAPHE * interligne
      texte += nouveauParagraphe ? '\n\n' : '\n'
    }
    texte += contenu
  })

  return texte
}
