/**
 * Ancrage des stipulations — chemin unique.
 *
 * Ce module existe parce que la même règle avait été écrite deux fois, et
 * corrigée une seule : la détection d'incohérences retranchait l'en-tête
 * d'article, le rapprochement des garanties non. Résultat, un rapport citait
 * « ARTICLE 13 — RENONCIATION À RECOURS » comme la clause en cause — un titre,
 * pas une stipulation, et un rapport inexploitable.
 *
 * Une seule fonction découpe désormais les documents, et les deux lectures s'en
 * servent. Une correction ici vaut pour les deux.
 */
import { stipulations, type Stipulation } from '../garanties/reconnaissance'
import { segmentContenant, segmenter, type Segment } from './segmentation'

export type RolePassage = 'OBLIGATION' | 'COUVERTURE' | 'ATTESTATION'

export type DocumentSource = {
  readonly id: string
  readonly role: RolePassage
  readonly texte: string
}

export type Passage = Stipulation & {
  readonly documentId: string
  readonly role: RolePassage
}

/**
 * Retranche l'en-tête d'article de ce qui sera cité.
 *
 * « ARTICLE 13 — RENONCIATION À RECOURS » porte les mots que cherchent les
 * motifs, mais ne stipule rien.
 *
 * On ne peut pas pour autant jeter toute stipulation qui touche la première
 * ligne : beaucoup de baux écrivent « ARTICLE 12 — Le Preneur renonce… » d'un
 * seul tenant, et la substance est alors SUR la ligne de titre. On retranche
 * donc le préfixe — numérotation puis intitulé — et l'on garde ce qui reste.
 *
 * Le décalage est reporté sur les offsets : l'ancrage doit continuer de pointer
 * le texte cité, au caractère près (§7).
 */
const NUMEROTATION = /^\s*(?:ARTICLE|ART\.?|TITRE|CHAPITRE)?\s*[0-9IVX]+(?:[.\-][0-9]+)*\s*[—–\-:.]?\s*/i

/** Sous ce seuil, ce qui reste n'est plus une stipulation mais un intitulé. */
const LONGUEUR_MINIMALE = 15

/**
 * Une stipulation est une phrase ; un intitulé est une étiquette.
 *
 * La distinction compte quand le bail écrit tout sur la ligne de titre :
 * « ARTICLE 12 — Le Preneur assurera l'immeuble… ». La segmentation prend
 * alors la clause entière pour l'intitulé de l'article, et la retrancher ferait
 * disparaître la stipulation. On garde donc ce qui ressemble à une phrase :
 * plusieurs mots, et pas une enseigne en capitales.
 */
const ressembleAUnePhrase = (texte: string): boolean => {
  const mots = texte.trim().split(/\s+/).filter((mot) => mot.length > 0)
  if (mots.length < 5) return false
  const lettres = texte.replace(/[^\p{L}]/gu, '')
  if (lettres.length === 0) return false
  const capitales = texte.replace(/[^\p{Lu}]/gu, '').length
  return capitales / lettres.length < 0.6
}

export const sansEnTete = (
  texte: string,
  segment: Segment | undefined,
): { readonly texte: string; readonly decalage: number } | null => {
  const premiereLigne = segment?.texte.split('\n', 1)[0] ?? ''
  // Une stipulation qui ne touche pas la ligne de titre n'a rien à retrancher.
  if (!premiereLigne.includes(texte.trim())) return { texte, decalage: 0 }

  /** Le décalage se mesure sur le texte d'origine : jamais recalculé à la main. */
  const garder = (retenu: string) => ({ texte: retenu, decalage: texte.indexOf(retenu) })

  const sansNumero = texte.replace(NUMEROTATION, '').trim()
  const intitule = segment?.titre ?? null

  if (intitule !== null && sansNumero.toUpperCase().startsWith(intitule.toUpperCase())) {
    const apres = sansNumero.slice(intitule.length).replace(/^\s*[—–\-:.]?\s*/, '').trim()
    // Ce qui suit l'intitulé est la vraie stipulation, quand il y en a une.
    if (apres.length >= LONGUEUR_MINIMALE) return garder(apres)
    // Sinon, l'« intitulé » EST peut-être la stipulation : on ne le jette que
    // s'il ne ressemble pas à une phrase.
    return ressembleAUnePhrase(sansNumero) ? garder(sansNumero) : null
  }

  return sansNumero.length < LONGUEUR_MINIMALE ? null : garder(sansNumero)
}

/**
 * Découpe un jeu de documents en stipulations citables, chacune ancrée à son
 * article. C'est la seule porte d'entrée : personne ne redécoupe à côté.
 */
export function passages(documents: readonly DocumentSource[]): Passage[] {
  const resultat: Passage[] = []
  for (const document of documents) {
    const segments = segmenter(document.id, document.texte)
    for (const stipulation of stipulations(document.texte)) {
      const segment = segmentContenant(segments, stipulation.debut)
      const utile = sansEnTete(stipulation.texte, segment)
      if (utile === null) continue
      resultat.push({
        documentId: document.id,
        role: document.role,
        article: segment?.numero ?? null,
        intitule: segment?.titre ?? null,
        texte: utile.texte,
        debut: stipulation.debut + utile.decalage,
        fin: stipulation.fin,
      })
    }
  }
  return resultat
}

/** « Article 12 », ou l'intitulé quand le document ne numérote pas. */
export const nommerArticle = (passage: {
  readonly article: string | null
  readonly intitule: string | null
}): string =>
  passage.article !== null
    ? `Article ${passage.article}`
    : (passage.intitule ?? 'Stipulation non numérotée')
