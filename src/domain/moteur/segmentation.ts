/**
 * Segmentation d'un document source en articles et alineas (brief §5.3, etape 1).
 *
 * Regle non negociable : les OFFSETS DE CARACTERES sont absolus et conserves
 * jusqu'au bout. C'est ce qui permet a l'export Word d'ancrer nativement chaque
 * commentaire au passage original du bail (§7). Un segment qui perd son offset
 * rend le livrable impossible — on ne recolle pas un commentaire par recherche
 * de texte, deux clauses pouvant etre rigoureusement identiques.
 *
 * Le decoupage est volontairement prudent : mieux vaut un gros segment qu'un
 * titre invente. Un faux titre deplacerait la ponderation de localisation du
 * moteur et fausserait la confiance.
 */

export type Alinea = {
  readonly debut: number
  readonly fin: number
  readonly texte: string
}

export type Segment = {
  readonly documentId: string
  /** Numero tel qu'ecrit : « 12 », « 12.3 », « III ». Null pour le preambule. */
  readonly numero: string | null
  /** Intitule de l'article, quand le document en porte un. */
  readonly titre: string | null
  /** Offsets absolus dans le texte d'origine, titre compris. */
  readonly debut: number
  readonly fin: number
  readonly texte: string
  readonly alineas: readonly Alinea[]
}

/**
 * Un titre d'article, dans les redactions rencontrees en pratique :
 *
 *   ARTICLE 12 - ASSURANCES
 *   Article 12.3 : Assurances du Preneur
 *   ART. 12 — Assurances
 *   TITRE III - OBLIGATIONS DU PRENEUR
 *   12.3.1 Renonciation a recours
 *   XII. ASSURANCES
 *
 * Le mot-cle (ARTICLE, TITRE...) est optionnel, mais son absence impose un
 * numero suivi d'un separateur ou d'un intitule : sans quoi toute enumeration
 * « 1. ... 2. ... » a l'interieur d'une clause serait prise pour un article.
 */
const MOT_CLE = String.raw`(?:ARTICLES?|Articles?|ART\.?|TITRES?|Titres?|CHAPITRES?|Chapitres?|SECTIONS?|Sections?|PARAGRAPHES?|Paragraphes?)`
const NUMERO = String.raw`(?:\d+(?:[.\-]\d+)*|[IVXLCDM]+)`
const AVEC_MOT_CLE = new RegExp(
  String.raw`^[ \t]*(${MOT_CLE})[ \t]*(${NUMERO})[ \t]*[-–—:.)]?[ \t]*(.*)$`,
)

const SANS_MOT_CLE = new RegExp(String.raw`^[ \t]*(${NUMERO})([.)])?[ \t]*[-–—:]?[ \t]+(.+)$`)

/** Au-dela, ce n'est plus un titre mais une phrase qui commence par un numero. */
const LONGUEUR_MAX_TITRE = 120

const estRomain = (valeur: string): boolean => /^[IVXLCDM]+$/.test(valeur)

type Entete = {
  readonly indexLigne: number
  readonly numero: string
  readonly titre: string | null
}

const lireEntete = (ligne: string): Omit<Entete, 'indexLigne'> | null => {
  if (ligne.trim().length === 0 || ligne.length > LONGUEUR_MAX_TITRE) return null

  const avecMotCle = AVEC_MOT_CLE.exec(ligne)
  if (avecMotCle !== null) {
    const numero = avecMotCle[2] ?? ''
    const titre = (avecMotCle[3] ?? '').trim()
    return { numero, titre: titre.length > 0 ? titre : null }
  }

  const sansMotCle = SANS_MOT_CLE.exec(ligne)
  if (sansMotCle !== null) {
    const numero = sansMotCle[1] ?? ''
    const ponctuation = sansMotCle[2]
    const titre = (sansMotCle[3] ?? '').trim()

    // Sans mot-cle, un titre doit ressembler a un titre : une majuscule en
    // tete, et aucune ponctuation de fin de phrase. « 1. Le present bail est
    // consenti... » est une phrase numerotee, pas un article.
    if (!/^[A-ZÀ-Ý]/.test(titre)) return null
    if (/[.;,]$/.test(titre)) return null

    // Un chiffre romain isole est trop ambigu (« I » d'une liste, « C » d'une
    // reference) : on exige la ponctuation qui le pose en tete d'article.
    if (estRomain(numero) && ponctuation === undefined) return null

    // Un entier nu, sans ponctuation ni sous-numero, n'est un titre que s'il
    // est suivi d'un intitule en capitales — signal fort, faux positif rare.
    const sousNumero = /[.\-]/.test(numero)
    if (ponctuation === undefined && !sousNumero && titre !== titre.toUpperCase()) return null

    return { numero, titre: titre.length > 0 ? titre : null }
  }

  return null
}

/** Decoupe le corps d'un segment en alineas, offsets absolus conserves. */
const decouperAlineas = (texte: string, decalage: number): Alinea[] => {
  const alineas: Alinea[] = []
  // Un alinea se termine sur une ligne vide ou une fin de bloc.
  const morceaux = texte.split(/(\n[ \t]*\n)/)
  let curseur = 0

  for (const morceau of morceaux) {
    const estSeparateur = /^\n[ \t]*\n$/.test(morceau)
    if (!estSeparateur) {
      const avant = morceau.length - morceau.trimStart().length
      const contenu = morceau.trim()
      if (contenu.length > 0) {
        const debut = decalage + curseur + avant
        alineas.push({ debut, fin: debut + contenu.length, texte: contenu })
      }
    }
    curseur += morceau.length
  }

  return alineas
}

/**
 * Segmente un document. Renvoie toujours au moins un segment : un document sans
 * aucun titre reconnaissable produit un segment unique couvrant tout le texte,
 * ce qui est le comportement correct pour un bail redige a l'anglo-saxonne ou
 * un bail minimaliste — le moteur travaille alors sans ponderation de
 * localisation, mais il travaille.
 */
export function segmenter(documentId: string, texte: string): Segment[] {
  const lignes = texte.split('\n')

  // Offset absolu du debut de chaque ligne.
  const offsets: number[] = []
  let position = 0
  for (const ligne of lignes) {
    offsets.push(position)
    position += ligne.length + 1
  }

  const entetes: Entete[] = []
  lignes.forEach((ligne, indexLigne) => {
    const entete = lireEntete(ligne)
    if (entete !== null) entetes.push({ ...entete, indexLigne })
  })

  const construire = (
    numero: string | null,
    titre: string | null,
    debut: number,
    fin: number,
  ): Segment | null => {
    const brut = texte.slice(debut, fin)
    if (brut.trim().length === 0) return null
    return {
      documentId,
      numero,
      titre,
      debut,
      fin,
      texte: brut,
      alineas: decouperAlineas(brut, debut),
    }
  }

  if (entetes.length === 0) {
    const unique = construire(null, null, 0, texte.length)
    return unique === null ? [] : [unique]
  }

  const segments: Segment[] = []

  const premier = entetes[0]
  if (premier !== undefined && premier.indexLigne > 0) {
    const preambule = construire(null, null, 0, offsets[premier.indexLigne] ?? 0)
    if (preambule !== null) segments.push(preambule)
  }

  entetes.forEach((entete, index) => {
    const suivante = entetes[index + 1]
    const debut = offsets[entete.indexLigne] ?? 0
    const fin = suivante === undefined ? texte.length : (offsets[suivante.indexLigne] ?? texte.length)
    const segment = construire(entete.numero, entete.titre, debut, fin)
    if (segment !== null) segments.push(segment)
  })

  return segments
}

/** Le segment qui contient un offset donne — pour remonter d'un extrait a son article. */
export function segmentContenant(segments: readonly Segment[], offset: number): Segment | undefined {
  return segments.find((segment) => offset >= segment.debut && offset < segment.fin)
}

/** Repere de lecture humaine : « Article 12.3 — Assurances ». */
export function repere(segment: Segment): string {
  if (segment.numero === null) return segment.titre ?? 'Preambule'
  const tete = `Article ${segment.numero}`
  return segment.titre === null ? tete : `${tete} — ${segment.titre}`
}
