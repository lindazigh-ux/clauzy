/**
 * Détection des incohérences internes.
 *
 * Le principe tient en une phrase : les deux moitiés d'une règle doivent se
 * trouver dans des STIPULATIONS DIFFÉRENTES. Deux motifs qui répondent sur la
 * même phrase décrivent le même fait — pas deux faits qui se contredisent.
 *
 * Chaque moitié est ancrée à son article, parce qu'une alerte utile dit
 * « entre les articles 12.4 et 16.2 » et non « quelque part dans le bail ».
 */
import { stipulations } from '../garanties/reconnaissance'
import { segmentContenant, segmenter, type Segment } from '../moteur/segmentation'
import { REGLES } from './regles'
import type { Ancrage, Incoherence, Motif, Regle } from './types'

export type DocumentSource = {
  readonly id: string
  readonly role: 'OBLIGATION' | 'COUVERTURE' | 'ATTESTATION'
  readonly texte: string
}

type Candidate = { readonly ancrage: Ancrage; readonly segment: Segment | undefined }

/**
 * Retranche l'en-tête d'article de ce qui est cité.
 *
 * « ARTICLE 13 — RENONCIATION À RECOURS » contient les mots que cherchent les
 * règles, mais ne stipule rien. Le citer comme clause en cause donnerait un
 * rapport inexploitable : le lecteur ne saurait pas quel texte on lui reproche.
 *
 * On ne peut pas pour autant jeter toute stipulation qui touche à la première
 * ligne : beaucoup de baux écrivent « ARTICLE 12 — Le Preneur renonce… » d'un
 * seul tenant, et la substance est alors SUR la ligne de titre. On retranche
 * donc le préfixe — numérotation puis intitulé — et l'on garde ce qui reste.
 *
 * Le décalage est reporté sur les offsets : l'ancrage doit continuer de
 * pointer le texte cité, au caractère près (§7).
 */
const NUMEROTATION = /^\s*(?:ARTICLE|ART\.?|TITRE|CHAPITRE)?\s*[0-9IVX]+(?:[.\-][0-9]+)*\s*[—–\-:.]?\s*/i

/** Sous ce seuil, ce qui reste n'est plus une stipulation mais un intitulé. */
const LONGUEUR_MINIMALE = 15

const sansEnTete = (
  texte: string,
  segment: Segment | undefined,
): { readonly texte: string; readonly decalage: number } | null => {
  const premiereLigne = segment?.texte.split('\n', 1)[0] ?? ''
  // Une stipulation qui ne touche pas la ligne de titre n'a rien à retrancher.
  if (!premiereLigne.includes(texte.trim())) return { texte, decalage: 0 }

  let reste = texte.replace(NUMEROTATION, '')
  let decalage = texte.length - reste.length

  const intitule = segment?.titre ?? null
  if (intitule !== null && reste.toUpperCase().startsWith(intitule.toUpperCase())) {
    const coupe = reste.slice(intitule.length).replace(/^\s*[—–\-:.]?\s*/, '')
    decalage += reste.length - coupe.length
    reste = coupe
  }

  reste = reste.trim()
  return reste.length < LONGUEUR_MINIMALE ? null : { texte: reste, decalage }
}

/** Toutes les stipulations d'un jeu de documents, chacune ancrée à son article. */
const ancrer = (documents: readonly DocumentSource[]): Candidate[] => {
  const resultat: Candidate[] = []
  for (const document of documents) {
    const segments = segmenter(document.id, document.texte)
    for (const stipulation of stipulations(document.texte)) {
      const segment = segmentContenant(segments, stipulation.debut)
      const utile = sansEnTete(stipulation.texte, segment)
      if (utile === null) continue
      resultat.push({
        ancrage: {
          documentId: document.id,
          article: segment?.numero ?? null,
          intitule: segment?.titre ?? null,
          texte: utile.texte,
          debut: stipulation.debut + utile.decalage,
          fin: stipulation.fin,
        },
        segment,
      })
    }
  }
  return resultat
}

const repond = (motif: Motif, texte: string): boolean =>
  motif.pattern.test(texte) && !(motif.exclut ?? []).some((exclusion) => exclusion.test(texte))

/** « articles 12.4 et 16.2 », ou une formulation honnête quand rien n'est numéroté. */
const nommer = (ancrage: Ancrage): string =>
  ancrage.article !== null
    ? `l’article ${ancrage.article}`
    : ancrage.intitule !== null
      ? `« ${ancrage.intitule} »`
      : 'une stipulation non numérotée'

const resumer = (regle: Regle, premier: Ancrage, second: Ancrage | null): string => {
  if (regle.nature === 'LACUNE') {
    return `Point à vérifier — ${nommer(premier)} appelle une contrepartie introuvable dans les pièces produites.`
  }
  return `Incohérence potentielle entre ${nommer(premier)} et ${nommer(second as Ancrage)}.`
}

/**
 * Confronte le document source à lui-même, et aux pièces d'assurance.
 *
 * Une règle ne se déclenche qu'une fois : plusieurs couples d'articles
 * illustrant le même défaut n'ajoutent rien au rapport, et noieraient les
 * autres règles. Le premier couple trouvé porte l'alerte.
 */
export function detecterIncoherences(documents: readonly DocumentSource[]): Incoherence[] {
  const source = ancrer(documents.filter((d) => d.role === 'OBLIGATION'))
  const pieces = ancrer(documents.filter((d) => d.role !== 'OBLIGATION'))
  const piecesFournies = pieces.length > 0

  const trouvees: Incoherence[] = []

  for (const regle of REGLES) {
    const premiers = source.filter((c) => repond(regle.premier, c.ancrage.texte))
    if (premiers.length === 0) continue

    const bassin = regle.cherche === 'OBLIGATION' ? source : pieces

    if (regle.nature === 'LACUNE') {
      // Sans pièce d'assurance on ne conclut pas à une lacune : on ne peut
      // simplement pas savoir. C'est la même règle que partout ailleurs —
      // « absent » n'est pas « non démontré ».
      if (regle.cherche === 'COUVERTURE' && !piecesFournies) continue
      const contrepartie = bassin.find((c) => repond(regle.second, c.ancrage.texte))
      if (contrepartie !== undefined) continue

      const premier = premiers[0]
      if (premier === undefined) continue
      trouvees.push(construire(regle, premier.ancrage, null))
      continue
    }

    // Contradiction : les deux moitiés doivent venir de stipulations
    // DIFFÉRENTES. Deux motifs qui répondent sur la même phrase décrivent le
    // même fait, pas deux faits contradictoires.
    let couple: { premier: Ancrage; second: Ancrage } | null = null
    for (const candidatePremier of premiers) {
      const candidateSecond = bassin.find(
        (c) =>
          c.ancrage.debut !== candidatePremier.ancrage.debut &&
          repond(regle.second, c.ancrage.texte),
      )
      if (candidateSecond !== undefined) {
        couple = { premier: candidatePremier.ancrage, second: candidateSecond.ancrage }
        break
      }
    }
    if (couple === null) continue

    trouvees.push(construire(regle, couple.premier, couple.second))
  }

  return trouvees
}

const construire = (regle: Regle, premier: Ancrage, second: Ancrage | null): Incoherence => ({
  regleId: regle.id,
  titre: regle.titre,
  nature: regle.nature,
  gravite: regle.gravite,
  premier,
  second,
  explication: regle.explication,
  action: regle.action,
  ...(regle.baseJuridique === undefined ? {} : { baseJuridique: regle.baseJuridique }),
  resume: resumer(regle, premier, second),
})
