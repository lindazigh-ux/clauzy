/**
 * Rapprochement obligation / couverture, garantie par garantie.
 *
 * C'est le raisonnement que le moteur ne tenait pas :
 *
 *   obligation → risque concerne → garantie attendue → couverture trouvee
 *   → preuve → conclusion
 *
 * Avant, il allait de la clause au controle par des motifs de texte, et
 * concluait a un ecart des que la police n'employait pas les mots du bail. Un
 * courtier ne travaille pas ainsi : il nomme le risque, puis cherche ce qui le
 * porte, quel que soit le libelle du tableau de garanties.
 *
 * La sortie est faite pour etre LUE, pas seulement consommee : chaque
 * rapprochement porte ce qui a ete cherche, ce qui a ete trouve, et ce qui a
 * ete ecarte. Le praticien doit pouvoir controler le raisonnement plutot que
 * de le croire.
 */
import { NOMENCLATURE, garantie } from '../garanties/nomenclature'
import { reconnaitre, satisfaite, type Reconnaissance } from '../garanties/reconnaissance'
import { garantiesDe } from '../garanties/rattachement'
import type { Beneficiaire, Categorie } from '../garanties/types'

/**
 * Niveau de preuve — la distinction que le cahier reclame entre « absent » et
 * « non demontre ».
 *
 * Une IA ne devrait presque jamais ecrire « le client n'est pas assuré » parce
 * qu'elle n'a pas trouve la clause. Elle doit dire ce qu'elle sait, et avec
 * quelle certitude.
 */
export enum NiveauPreuve {
  /** Garantie identifiee, nommee, dans une piece. */
  ETABLIE = 'ETABLIE',
  /** Formulation differente mais correspondance probable — a confirmer. */
  PROBABLE = 'PROBABLE',
  /** Les pieces ne permettent pas de conclure. Ce n'est PAS une absence. */
  NON_DEMONTREE = 'NON_DEMONTREE',
  /** Documents suffisants et contradiction claire : l'ecart est confirme. */
  ECART_CONFIRME = 'ECART_CONFIRME',
}

export const LIBELLE_PREUVE: Record<NiveauPreuve, string> = {
  [NiveauPreuve.ETABLIE]: 'Couverture établie',
  [NiveauPreuve.PROBABLE]: 'Couverture probable',
  [NiveauPreuve.NON_DEMONTREE]: 'Couverture non démontrée',
  [NiveauPreuve.ECART_CONFIRME]: 'Écart confirmé',
}

export type Rapprochement = {
  readonly garantieId: string
  readonly libelle: string
  readonly categorie: Categorie
  readonly beneficiaire: Beneficiaire
  /** Ou l'exigence a ete lue dans le document source. */
  readonly exigence: Reconnaissance | null
  /** Ce qui, dans les pieces, repond a cette exigence. */
  readonly couverture: Reconnaissance | null
  /**
   * Par quelle garantie l'exigence est satisfaite : elle-meme, ou une garantie
   * englobante. Une RC occupant repond a une exigence de risques locatifs.
   */
  readonly satisfaitePar: string | null
  readonly niveau: NiveauPreuve
  /** Les libelles cherches dans les pieces — la trace, pour le praticien. */
  readonly recherche: readonly string[]
  readonly conclusion: string
  /** Confusions ecartees, et pourquoi. Jamais un choix silencieux. */
  readonly ecartees: readonly { readonly garantieId: string; readonly raison: string }[]
}

/** Ce que le moteur a cherche dans les pieces, en clair. */
const libellesRecherches = (garantieId: string): string[] => {
  const entree = garantie(garantieId)
  const englobantes = (entree.satisfaitePar ?? []).map((id) => garantie(id).libelle)
  return [entree.libelle, ...englobantes]
}

/**
 * Rapproche les exigences lues dans le document source de ce que portent les
 * pieces d'assurance.
 *
 * `piecesFournies` est distingue de « aucune garantie reconnue » : sans piece,
 * on ne conclut pas a un ecart, on constate qu'on ne peut pas conclure. C'est
 * la difference entre « absent » et « non demontre ».
 */
export function rapprocher(
  texteObligation: string,
  texteCouverture: string,
  piecesFournies: boolean,
): Rapprochement[] {
  const exigences = reconnaitre(texteObligation, 'OBLIGATION')
  const couvertures = piecesFournies ? reconnaitre(texteCouverture, 'COUVERTURE') : []
  const idsCouverts = [...new Set(couvertures.map((c) => c.garantieId))]

  // Une exigence par garantie : la premiere occurrence porte l'ancrage, les
  // suivantes ne rajoutent rien au rapprochement.
  const premiere = new Map<string, Reconnaissance>()
  for (const exigence of exigences) {
    if (!premiere.has(exigence.garantieId)) premiere.set(exigence.garantieId, exigence)
  }

  return [...premiere.entries()].map(([garantieId, exigence]) => {
    const entree = garantie(garantieId)
    const resultat = satisfaite(garantieId, idsCouverts)
    const trouvee =
      resultat.parQuoi === null
        ? null
        : (couvertures.find((c) => c.garantieId === resultat.parQuoi) ?? null)

    const niveau = !piecesFournies
      ? NiveauPreuve.NON_DEMONTREE
      : resultat.satisfaite
        ? // Une garantie englobante repond, mais elle n'est pas la ligne
          // exacte : on le dit plutot que d'affirmer une equivalence.
          resultat.parQuoi === garantieId
          ? NiveauPreuve.ETABLIE
          : NiveauPreuve.PROBABLE
        : NiveauPreuve.ECART_CONFIRME

    return {
      garantieId,
      libelle: entree.libelle,
      categorie: entree.categorie,
      beneficiaire: entree.beneficiaire,
      exigence,
      couverture: trouvee,
      satisfaitePar: resultat.parQuoi,
      niveau,
      recherche: libellesRecherches(garantieId),
      conclusion: conclure(garantieId, niveau, resultat.parQuoi, piecesFournies),
      ecartees: exigence.ecartees,
    }
  })
}

const conclure = (
  garantieId: string,
  niveau: NiveauPreuve,
  parQuoi: string | null,
  piecesFournies: boolean,
): string => {
  const entree = garantie(garantieId)
  switch (niveau) {
    case NiveauPreuve.ETABLIE:
      return `Exigence de « ${entree.libelle} » retrouvée dans les pièces d’assurance.`
    case NiveauPreuve.PROBABLE:
      return (
        `Aucune ligne « ${entree.libelle} » au tableau, mais ` +
        `« ${garantie(parQuoi as string).libelle} » englobe cette garantie. ` +
        `À confirmer aux conditions particulières.`
      )
    case NiveauPreuve.NON_DEMONTREE:
      return piecesFournies
        ? `Les pièces mentionnent le sujet sans permettre de conclure sur « ${entree.libelle} ».`
        : `Aucune pièce d’assurance n’a été fournie : la couverture de « ${entree.libelle} » ne peut pas être démontrée.`
    case NiveauPreuve.ECART_CONFIRME:
      return (
        `Exigence de « ${entree.libelle} » non retrouvée dans les pièces produites. ` +
        `Recherche effectuée sur : ${libellesRecherches(garantieId).join(', ').toLowerCase()}.`
      )
  }
}

/**
 * Ce que les pieces demontrent pour un controle donne.
 *
 * Rendu au moteur pour qu'il cesse de chercher les mots du controle dans la
 * police. Null quand le controle n'interroge aucune garantie — un delai
 * d'attestation ou une hierarchie contractuelle ne se demontrent pas par une
 * piece d'assurance.
 */
export type AppuiGarantie = {
  readonly garantieId: string
  readonly niveau: NiveauPreuve
  readonly satisfaitePar: string | null
  readonly conclusion: string
}

export function appuiPourControle(
  controleId: string,
  rapprochements: readonly Rapprochement[],
): AppuiGarantie | null {
  const attendues = garantiesDe(controleId)
  if (attendues.length === 0) return null

  const concernes = rapprochements.filter((r) => attendues.includes(r.garantieId))
  if (concernes.length === 0) return null

  // Le meilleur appui l'emporte : une garantie etablie suffit a soutenir le
  // controle, meme si une autre du meme groupe reste non demontree — le
  // controle qui porte sur cette autre garantie la signalera pour son compte.
  const ordre = [
    NiveauPreuve.ETABLIE,
    NiveauPreuve.PROBABLE,
    NiveauPreuve.NON_DEMONTREE,
    NiveauPreuve.ECART_CONFIRME,
  ]
  const meilleur = [...concernes].sort(
    (a, b) => ordre.indexOf(a.niveau) - ordre.indexOf(b.niveau),
  )[0]
  if (meilleur === undefined) return null

  return {
    garantieId: meilleur.garantieId,
    niveau: meilleur.niveau,
    satisfaitePar: meilleur.satisfaitePar,
    conclusion: meilleur.conclusion,
  }
}

/** Toutes les garanties de la nomenclature, pour l'affichage du perimetre. */
export const NOMBRE_GARANTIES_SUIVIES = NOMENCLATURE.length
