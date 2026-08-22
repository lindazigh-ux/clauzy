/**
 * Reconnaissance des garanties dans un texte.
 *
 * Une seule regle, et c'est elle qui corrige le defaut d'origine :
 * on reconnait un RISQUE, pas un mot. « Assurer les locaux loués contre
 * l'incendie » et « responsabilité locative : 1 500 000 € » designent la meme
 * garantie et doivent se rapprocher ; « assurer l'immeuble appartenant au
 * bailleur » en designe une autre et ne doit pas s'y rapprocher.
 *
 * Deux mecanismes portent cette distinction :
 *
 *   - les motifs d'EXCLUSION (`Motif.exclut`), evalues dans la STIPULATION,
 *     pas dans le document : une clause de risques locatifs cede devant une
 *     clause qui vise l'immeuble du bailleur, mais la presence ailleurs dans
 *     le bail d'une clause sur l'immeuble ne doit rien changer ;
 *
 *   - la PRESEANCE : quand deux garanties se reconnaissent dans la meme
 *     stipulation et qu'elles se declarent mutuellement confuses, la plus
 *     specifique l'emporte, et le doute est CONSIGNE plutot qu'efface.
 */
import { NOMENCLATURE, garantie } from './nomenclature'
import type { Garantie, Motif } from './types'

/**
 * Une stipulation : la phrase qui porte la reconnaissance, avec sa position.
 *
 * `article` et `intitule` sont renseignes des que la stipulation vient d'un
 * document decoupe par `moteur/ancrage` — ce qui permet a un rapport de dire
 * « article 12.4 » plutot que « quelque part dans le bail ».
 */
export type Stipulation = {
  readonly texte: string
  readonly debut: number
  readonly fin: number
  readonly article?: string | null
  readonly intitule?: string | null
  /**
   * Le document d'où vient la stipulation, quand elle vient de `moteur/ancrage`.
   *
   * `debut` et `fin` sont des offsets DANS CE DOCUMENT. Sans son identifiant,
   * ils ne désignent rien — et l'écran qui surligne le bail ne saurait pas
   * lequel surligner.
   */
  readonly documentId?: string
}

export type Reconnaissance = {
  readonly garantieId: string
  /** 0 a 100. Les motifs ponderes s'additionnent en OU bruite. */
  readonly force: number
  readonly stipulation: Stipulation
  /** Le libelle des motifs qui ont repondu — la trace de recherche (§8 du cahier). */
  readonly motifs: readonly string[]
  /**
   * Garanties ecartees dans cette meme stipulation, et pourquoi. Rendu visible
   * au praticien : c'est ce qui lui permet de controler le raisonnement.
   */
  readonly ecartees: readonly { readonly garantieId: string; readonly raison: string }[]
}

/**
 * Decoupe en stipulations : la phrase est l'unite de decision.
 *
 * Une stipulation ne franchit ni un point, ni un point-virgule, ni un retour a
 * la ligne. C'est deja la fenetre que le moteur utilisait pour isoler les
 * montants ; on en fait ici l'unite d'analyse, parce qu'une exclusion doit
 * jouer dans la phrase et nulle part ailleurs.
 */
export function stipulations(texte: string, decalage = 0): Stipulation[] {
  const resultat: Stipulation[] = []
  let debut = 0

  for (let index = 0; index <= texte.length; index += 1) {
    const caractere = texte[index]
    const borne = index === texte.length || caractere === '.' || caractere === ';' || caractere === '\n'
    if (!borne) continue

    const brut = texte.slice(debut, index)
    if (brut.trim().length > 0) {
      // On garde les offsets ABSOLUS : ils portent l'ancrage Word (§7).
      const avant = brut.length - brut.trimStart().length
      const apres = brut.length - brut.trimEnd().length
      resultat.push({
        texte: brut.trim(),
        debut: decalage + debut + avant,
        fin: decalage + index - apres,
      })
    }
    debut = index + 1
  }

  return resultat
}

/** Ou, dans la stipulation, un motif a-t-il repondu. Null s'il n'a pas repondu. */
type Zone = { readonly debut: number; readonly fin: number }

const repond = (motif: Motif, texte: string): Zone | null => {
  const trouve = motif.pattern.exec(texte)
  if (trouve === null) return null
  // L'exclusion s'evalue dans la STIPULATION : c'est ce qui distingue
  // « assurer les locaux loués » de « assurer l'immeuble du bailleur ».
  if ((motif.exclut ?? []).some((exclusion) => exclusion.test(texte))) return null
  if (!(motif.contexte ?? []).every((condition) => condition.test(texte))) return null
  return { debut: trouve.index, fin: trouve.index + trouve[0].length }
}

/**
 * Ce qui, entre deux reconnaissances, annonce une SECONDE obligation.
 *
 * Une coordination enumere : « les risques locatifs AINSI QUE le vol ». Une
 * subordination decrit : « la responsabilité civile exploitation COUVRANT les
 * dommages causés aux tiers » — un seul engagement, defini par sa portee.
 */
const COORDINATION = /\bainsi qu|\bet\b|\bou\b|;/i

/**
 * Les deux motifs lisent-ils le MEME passage ?
 *
 * Oui s'ils se recouvrent — c'est le cas franc. Oui aussi si rien, entre eux,
 * n'annonce une seconde obligation : la lecture reste unique, et la preseance
 * doit departager. Non s'ils sont coordonnes : la phrase en enumere deux, et
 * ecarter la seconde ferait disparaitre une exigence entiere.
 */
const memePassage = (a: readonly Zone[], b: readonly Zone[], texte: string): boolean =>
  a.some((zoneA) =>
    b.some((zoneB) => {
      if (zoneA.debut < zoneB.fin && zoneB.debut < zoneA.fin) return true
      const entre = texte.slice(
        Math.min(zoneA.fin, zoneB.fin),
        Math.max(zoneA.debut, zoneB.debut),
      )
      return !COORDINATION.test(entre)
    }),
  )

/** OU bruite : deux indices faibles valent mieux qu'un, sans jamais atteindre 100 par accident. */
const combiner = (poids: readonly number[]): number => {
  const restant = poids.reduce((acc, p) => acc * (1 - Math.min(Math.max(p, 0), 1)), 1)
  return Math.round((1 - restant) * 100)
}

type Brute = {
  garantie: Garantie
  force: number
  motifs: string[]
  /** Au moins un motif NOMMAIT la garantie, au lieu de la paraphraser. */
  expres: boolean
  /** Ou la reconnaissance a eu lieu dans la stipulation. */
  zones: Zone[]
}

export const reconnaitreDans = (
  stipulation: Stipulation,
  cote: 'OBLIGATION' | 'COUVERTURE',
): Reconnaissance[] => {
  const brutes: Brute[] = []

  for (const entree of NOMENCLATURE) {
    const motifs = cote === 'OBLIGATION' ? entree.motifsObligation : entree.motifsCouverture
    const repondus = motifs
      .map((motif) => ({ motif, zone: repond(motif, stipulation.texte) }))
      .filter((r): r is { motif: Motif; zone: Zone } => r.zone !== null)
    if (repondus.length === 0) continue

    brutes.push({
      garantie: entree,
      force: combiner(repondus.map(({ motif }) => motif.poids ?? 1)),
      motifs: repondus.map(
        ({ motif }, index) => motif.libelle ?? `motif ${index + 1} de « ${entree.libelle} »`,
      ),
      expres: repondus.some(({ motif }) => motif.expres === true),
      zones: repondus.map(({ zone }) => zone),
    })
  }

  // Preseance. Deux garanties reconnues dans la meme stipulation ne
  // s'excluent PAS par principe : « les risques locatifs ainsi que le recours
  // des voisins et des tiers » en nomme deux, et les deux sont exigees.
  //
  // La preseance ne joue que sur une PARAPHRASE — un texte qui ne nomme
  // aucune des deux et se prete a plusieurs lectures. Alors la plus specifique
  // l'emporte, et l'autre est CONSIGNEE, jamais effacee en silence : le
  // praticien doit pouvoir voir ce que le moteur a ecarte, et pourquoi.
  const retenues: Brute[] = []
  const ecartees = new Map<string, { garantieId: string; raison: string }[]>()

  // Le nom l'emporte sur la paraphrase, puis la force departage.
  const ordre = [...brutes].sort(
    (a, b) => Number(b.expres) - Number(a.expres) || b.force - a.force,
  )

  for (const candidate of ordre) {
    // Une garantie expressement nommee ne se laisse jamais ecarter.
    if (candidate.expres) {
      retenues.push(candidate)
      continue
    }

    // Une rivale n'en est une que si elle lit LE MEME PASSAGE. « Le Preneur
    // garantira les risques locatifs ainsi que le vol et le vandalisme des
    // biens garnissant les locaux » nomme deux obligations coordonnees : la
    // seconde n'est pas une lecture concurrente de la premiere, et l'ecarter
    // faisait disparaitre une exigence entiere.
    const rivale = retenues.find(
      (retenue) =>
        (retenue.garantie.confusions.some((c) => c.avec === candidate.garantie.id) ||
          candidate.garantie.confusions.some((c) => c.avec === retenue.garantie.id)) &&
        memePassage(retenue.zones, candidate.zones, stipulation.texte),
    )
    if (rivale === undefined) {
      retenues.push(candidate)
      continue
    }

    const confusion =
      rivale.garantie.confusions.find((c) => c.avec === candidate.garantie.id) ??
      candidate.garantie.confusions.find((c) => c.avec === rivale.garantie.id)
    const liste = ecartees.get(rivale.garantie.id) ?? []
    liste.push({
      garantieId: candidate.garantie.id,
      raison:
        confusion?.distinction ??
        'Confusion fréquente, écartée au profit de la lecture la plus spécifique.',
    })
    ecartees.set(rivale.garantie.id, liste)
  }

  return retenues.map((retenue) => ({
    garantieId: retenue.garantie.id,
    force: retenue.force,
    stipulation,
    motifs: retenue.motifs,
    ecartees: ecartees.get(retenue.garantie.id) ?? [],
  }))
}

/** Reconnait toutes les garanties d'un texte, stipulation par stipulation. */
export function reconnaitre(
  texte: string,
  cote: 'OBLIGATION' | 'COUVERTURE',
  decalage = 0,
): Reconnaissance[] {
  return stipulations(texte, decalage).flatMap((stipulation) =>
    reconnaitreDans(stipulation, cote),
  )
}

/**
 * Une exigence est-elle satisfaite par ce qui a ete reconnu dans les pieces ?
 *
 * Elle l'est par elle-meme, ou par une garantie qui l'englobe : une RC occupant
 * repond a une exigence de risques locatifs. Reclamer la ligne exacte
 * reviendrait a reclamer un mot, pas une couverture.
 */
export function satisfaite(
  exigenceId: string,
  couvertes: readonly string[],
): { readonly satisfaite: boolean; readonly parQuoi: string | null } {
  if (couvertes.includes(exigenceId)) return { satisfaite: true, parQuoi: exigenceId }

  const englobantes = garantie(exigenceId).satisfaitePar ?? []
  const trouvee = englobantes.find((id) => couvertes.includes(id))
  return trouvee === undefined
    ? { satisfaite: false, parQuoi: null }
    : { satisfaite: true, parQuoi: trouvee }
}
