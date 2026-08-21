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
import { nommerArticle, passages, type DocumentSource } from '../moteur/ancrage'
import { REGLES } from './regles'
import type { Ancrage, Incoherence, Motif, Regle } from './types'

export type { DocumentSource }

type Candidate = { readonly ancrage: Ancrage }

/**
 * Les stipulations citables d'un jeu de documents.
 *
 * Le decoupage et le retranchement des en-tetes vivent dans
 * `moteur/ancrage` : ils servaient ici et au rapprochement, et n'existaient
 * que d'un cote.
 */
const ancrer = (documents: readonly DocumentSource[]): Candidate[] =>
  passages(documents).map((passage) => ({
    ancrage: {
      documentId: passage.documentId,
      article: passage.article ?? null,
      intitule: passage.intitule ?? null,
      texte: passage.texte,
      debut: passage.debut,
      fin: passage.fin,
    },
  }))

const repond = (motif: Motif, texte: string): boolean =>
  motif.pattern.test(texte) && !(motif.exclut ?? []).some((exclusion) => exclusion.test(texte))

/** « l'article 12.4 », ou une formulation honnête quand rien n'est numéroté. */
const nommer = (ancrage: Ancrage): string =>
  ancrage.article !== null ? `l’article ${ancrage.article}` : nommerArticle(ancrage).toLowerCase()

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
