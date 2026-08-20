/**
 * Plan d'annotation du document source (brief §7, §14).
 *
 * C'est la fonction signature du produit : chaque commentaire du rapport Word
 * est ancre NATIVEMENT au passage original du bail, pas rappele en note de bas
 * de page. Le lecteur ouvre le bail dans Word, voit la clause surlignee et le
 * conseil en marge, comme si un confrere l'avait relu.
 *
 * Tout repose sur des offsets de caracteres conserves depuis la segmentation
 * (§5.3). On ne recolle jamais un commentaire par recherche de texte : deux
 * clauses d'un bail peuvent etre rigoureusement identiques, et l'ancrage
 * atterrirait trois articles plus loin, devant le client.
 *
 * Ce fichier est PUR : il ne connait pas docx. Il produit un plan que l'on peut
 * verifier caractere par caractere, sans ouvrir Word.
 */
import { MENTION_SANS_REPLI, Statut, aUnRepliAssurance } from '@/domain/controles'
import { LIBELLE_STATUT } from '@/domain/controles'
import type { Dossier, LigneRapport } from '@/domain/dossier'

export type Annotation = {
  readonly id: number
  readonly controleId: string
  readonly debut: number
  readonly fin: number
  /** Le passage original, tel qu'il figure dans le document. */
  readonly texteAncre: string
  readonly auteur: string
  /** Paragraphes du commentaire, dans l'ordre. */
  readonly corps: readonly string[]
  /** Vrai quand le praticien a rattache ce passage lui-meme (§6). */
  readonly manuelle: boolean
}

/** Un element du flux d'un paragraphe annote. */
export type Element =
  | { readonly type: 'texte'; readonly texte: string }
  | { readonly type: 'debut'; readonly id: number }
  | { readonly type: 'fin'; readonly id: number }
  | { readonly type: 'renvoi'; readonly id: number }

export type ParagrapheAnnote = {
  readonly elements: readonly Element[]
}

export type PlanAnnotation = {
  readonly documentId: string
  readonly annotations: readonly Annotation[]
  readonly paragraphes: readonly ParagrapheAnnote[]
}

const corpsDuCommentaire = (ligne: LigneRapport, manuelle: boolean): string[] => {
  const controle = ligne.controle
  const corps: string[] = [
    `${controle.id} — ${controle.titre} · ${ligne.ecarte ? 'Écarté par le praticien' : LIBELLE_STATUT[ligne.statut]}`,
  ]

  if (ligne.resumeEcart !== null) corps.push(`Écart chiffré : ${ligne.resumeEcart}`)
  corps.push(`Ce que risque le preneur : ${controle.consequence}`)
  corps.push(`Correction du bail, en priorité : ${controle.actionSource}`)
  corps.push(
    `Repli assurance : ${aUnRepliAssurance(controle) ? controle.actionCouverture : MENTION_SANS_REPLI}`,
  )
  corps.push(`Rédaction proposée : ${ligne.redaction}`)
  corps.push(`Preuve de clôture : ${controle.preuveCloture}`)

  if (controle.baseJuridique !== undefined) corps.push(`Base juridique : ${controle.baseJuridique}`)
  if (ligne.analyse !== null && ligne.analyse.trim().length > 0) {
    corps.push(`Analyse du praticien : ${ligne.analyse.trim()}`)
  }
  if (ligne.motif.length > 0) corps.push(`Motif de l’ajustement : ${ligne.motif}`)
  if (manuelle) corps.push('Passage rattaché à la main par le praticien.')

  return corps
}

/**
 * Choisit les passages a annoter dans un document.
 *
 * Un ancrage par controle et par document, plus TOUS les rattachements
 * manuels : le praticien qui a pris la peine de relier un passage veut le voir
 * annote, meme s'il en a relie plusieurs pour le meme controle.
 *
 * Les controles declares sans objet ne sont pas annotes — ils figurent a la
 * matrice, ou leur mention suffit.
 */
export function planifierAnnotations(
  dossier: Dossier,
  lignes: readonly LigneRapport[],
  documentId: string,
  texte: string,
  auteur: string,
): PlanAnnotation {
  const brutes: Omit<Annotation, 'id'>[] = []

  for (const ligne of lignes) {
    if (ligne.sansObjet) continue

    for (const rattachement of ligne.rattachements) {
      if (rattachement.documentId !== documentId || rattachement.cote !== 'OBLIGATION') continue
      brutes.push({
        controleId: ligne.controle.id,
        debut: rattachement.debut,
        fin: rattachement.fin,
        texteAncre: texte.slice(rattachement.debut, rattachement.fin),
        auteur,
        corps: corpsDuCommentaire(ligne, true),
        manuelle: true,
      })
    }

    // Un seul ancrage automatique par controle : le moteur releve souvent la
    // meme stipulation plusieurs fois, et quarante commentaires suffisent a
    // saturer une marge.
    const extrait = ligne.resultatMoteur?.extraitsObligation.find(
      (e) => e.documentId === documentId,
    )
    if (extrait === undefined) continue
    if (ligne.statut === Statut.ABSENT_DU_BAIL) continue

    brutes.push({
      controleId: ligne.controle.id,
      debut: extrait.debut,
      fin: extrait.fin,
      texteAncre: texte.slice(extrait.debut, extrait.fin),
      auteur,
      corps: corpsDuCommentaire(ligne, false),
      manuelle: false,
    })
  }

  const annotations: Annotation[] = brutes
    // Une plage hors du texte viendrait d'un dossier rouvert apres qu'une piece
    // a change : on la laisse tomber plutot que d'ancrer au hasard.
    .filter((a) => a.debut >= 0 && a.fin <= texte.length && a.fin > a.debut)
    .sort((a, b) => a.debut - b.debut || b.fin - a.fin)
    .map((annotation, index) => ({ ...annotation, id: index }))

  return { documentId, annotations, paragraphes: decouperEnParagraphes(texte, annotations) }
}

type Evenement = { readonly offset: number; readonly type: 'debut' | 'fin'; readonly id: number }

/**
 * Repartit le texte et les marqueurs en paragraphes.
 *
 * Une plage de commentaire peut franchir un paragraphe : c'est valide en
 * OOXML, et cela evite de tronquer une stipulation qui court sur deux alineas.
 */
function decouperEnParagraphes(
  texte: string,
  annotations: readonly Annotation[],
): ParagrapheAnnote[] {
  const evenements: Evenement[] = annotations
    .flatMap((a): Evenement[] => [
      { offset: a.debut, type: 'debut', id: a.id },
      { offset: a.fin, type: 'fin', id: a.id },
    ])
    // A offset egal, on ferme avant d'ouvrir : le renvoi d'un commentaire doit
    // rester colle a la fin de SON passage.
    .sort((a, b) => a.offset - b.offset || (a.type === b.type ? a.id - b.id : a.type === 'fin' ? -1 : 1))

  const paragraphes: ParagrapheAnnote[] = []
  let curseurEvenement = 0
  let position = 0

  const lignes = texte.split('\n')

  for (const ligne of lignes) {
    const debutLigne = position
    const finLigne = position + ligne.length
    const elements: Element[] = []
    let curseurTexte = debutLigne

    while (
      curseurEvenement < evenements.length &&
      (evenements[curseurEvenement]?.offset ?? Infinity) <= finLigne
    ) {
      const evenement = evenements[curseurEvenement]
      if (evenement === undefined) break

      const jusqua = Math.max(curseurTexte, Math.min(evenement.offset, finLigne))
      if (jusqua > curseurTexte) {
        elements.push({ type: 'texte', texte: texte.slice(curseurTexte, jusqua) })
        curseurTexte = jusqua
      }

      if (evenement.type === 'debut') {
        elements.push({ type: 'debut', id: evenement.id })
      } else {
        elements.push({ type: 'fin', id: evenement.id })
        elements.push({ type: 'renvoi', id: evenement.id })
      }
      curseurEvenement += 1
    }

    if (finLigne > curseurTexte) {
      elements.push({ type: 'texte', texte: texte.slice(curseurTexte, finLigne) })
    }

    paragraphes.push({ elements })
    position = finLigne + 1
  }

  return paragraphes
}

/** Le texte du plan, reconstitue : doit etre identique au document d'origine. */
export function texteDuPlan(plan: PlanAnnotation): string {
  return plan.paragraphes
    .map((paragraphe) =>
      paragraphe.elements
        .filter((element): element is { type: 'texte'; texte: string } => element.type === 'texte')
        .map((element) => element.texte)
        .join(''),
    )
    .join('\n')
}

/**
 * Le passage effectivement encadre par une plage de commentaire.
 *
 * C'est la verification du critere §14 : ce qui se trouve entre le marqueur
 * d'ouverture et celui de fermeture doit etre exactement le passage original.
 */
export function passageAncre(plan: PlanAnnotation, id: number): string {
  let dansLaPlage = false
  let capture = ''

  plan.paragraphes.forEach((paragraphe, index) => {
    if (dansLaPlage && index > 0) capture += '\n'
    for (const element of paragraphe.elements) {
      if (element.type === 'debut' && element.id === id) dansLaPlage = true
      else if (element.type === 'fin' && element.id === id) dansLaPlage = false
      else if (element.type === 'texte' && dansLaPlage) capture += element.texte
    }
  })

  return capture
}
