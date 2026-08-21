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
  /** Garantie identifiee, nommee, dans une piece probante. */
  ETABLIE = 'ETABLIE',
  /**
   * Garantie retrouvee au contrat, ABSENTE de l'attestation fournie.
   *
   * Ce n'est ni une conformite, ni un ecart : la couverture existe, mais le
   * bailleur ne peut pas s'en assurer sur la piece qu'on lui remet. Cela se
   * corrige par un courrier au courtier, pas par un avenant — et confondre les
   * deux fait perdre du temps a tout le monde.
   */
  JUSTIFICATION_INSUFFISANTE = 'JUSTIFICATION_INSUFFISANTE',
  /**
   * Correspondance probable, a confirmer : formulation englobante, ou garantie
   * connue seulement par une attestation, qui prouve l'existence d'un contrat
   * mais pas l'etendue de ce qu'il couvre.
   */
  PROBABLE = 'PROBABLE',
  /** Les pieces ne permettent pas de conclure. Ce n'est PAS une absence. */
  NON_DEMONTREE = 'NON_DEMONTREE',
  /** Documents suffisants et contradiction claire : l'ecart est confirme. */
  ECART_CONFIRME = 'ECART_CONFIRME',
}

export const LIBELLE_PREUVE: Record<NiveauPreuve, string> = {
  [NiveauPreuve.ETABLIE]: 'Couverture établie',
  [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]: 'Couverture existante, justification insuffisante',
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
  /** Ce qui, dans le CONTRAT, repond a cette exigence. */
  readonly couverture: Reconnaissance | null
  /** Ce que l'ATTESTATION mentionne — declaratif, jamais probant a lui seul. */
  readonly attestation: Reconnaissance | null
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
export type Sources = {
  readonly obligation: string
  /** Conditions particulieres et generales, avenants : les pieces probantes. */
  readonly contrat: string
  /** Attestations et courriels : declaratifs. Vides quand rien n'a ete fourni. */
  readonly attestation: string
}

export function rapprocher(sources: Sources): Rapprochement[] {
  const contratFourni = sources.contrat.trim().length > 0
  const attestationFournie = sources.attestation.trim().length > 0
  const piecesFournies = contratFourni || attestationFournie

  const exigences = reconnaitre(sources.obligation, 'OBLIGATION')
  const couvertures = contratFourni ? reconnaitre(sources.contrat, 'COUVERTURE') : []
  const attestees = attestationFournie ? reconnaitre(sources.attestation, 'COUVERTURE') : []
  const idsCouverts = [...new Set(couvertures.map((c) => c.garantieId))]
  const idsAttestes = [...new Set(attestees.map((c) => c.garantieId))]

  // Une exigence par garantie : la premiere occurrence porte l'ancrage, les
  // suivantes ne rajoutent rien au rapprochement.
  const premiere = new Map<string, Reconnaissance>()
  for (const exigence of exigences) {
    if (!premiere.has(exigence.garantieId)) premiere.set(exigence.garantieId, exigence)
  }

  return [...premiere.entries()].map(([garantieId, exigence]) => {
    const entree = garantie(garantieId)
    const auContrat = satisfaite(garantieId, idsCouverts)
    const aLAttestation = satisfaite(garantieId, idsAttestes)

    const trouvee =
      auContrat.parQuoi === null
        ? null
        : (couvertures.find((c) => c.garantieId === auContrat.parQuoi) ?? null)
    const mentionnee =
      aLAttestation.parQuoi === null
        ? null
        : (attestees.find((c) => c.garantieId === aLAttestation.parQuoi) ?? null)

    const niveau = decider(garantieId, {
      auContrat,
      aLAttestation,
      contratFourni,
      attestationFournie,
      piecesFournies,
    })

    return {
      garantieId,
      libelle: entree.libelle,
      categorie: entree.categorie,
      beneficiaire: entree.beneficiaire,
      exigence,
      couverture: trouvee,
      attestation: mentionnee,
      satisfaitePar: auContrat.parQuoi ?? aLAttestation.parQuoi,
      niveau,
      recherche: libellesRecherches(garantieId),
      conclusion: conclure(
        garantieId,
        niveau,
        auContrat.parQuoi ?? aLAttestation.parQuoi,
        piecesFournies,
      ),
      ecartees: exigence.ecartees,
    }
  })
}

type Contexte = {
  readonly auContrat: { readonly satisfaite: boolean; readonly parQuoi: string | null }
  readonly aLAttestation: { readonly satisfaite: boolean; readonly parQuoi: string | null }
  readonly contratFourni: boolean
  readonly attestationFournie: boolean
  readonly piecesFournies: boolean
}

/**
 * L'echelle de preuve, dans l'ordre ou un courtier la parcourt.
 *
 * Bail → Contrat → Attestation. La garantie peut etre exigee, exister au
 * contrat, et manquer a l'attestation : ce n'est ni une conformite ni un
 * ecart, et le distinguer evite d'envoyer negocier un avenant quand un
 * courriel au courtier suffirait.
 */
const decider = (garantieId: string, contexte: Contexte): NiveauPreuve => {
  if (!contexte.piecesFournies) return NiveauPreuve.NON_DEMONTREE

  if (contexte.auContrat.satisfaite) {
    // Trouvee au contrat. Reste a savoir si le bailleur peut le verifier.
    if (contexte.attestationFournie && !contexte.aLAttestation.satisfaite) {
      return NiveauPreuve.JUSTIFICATION_INSUFFISANTE
    }
    // Une garantie englobante repond, mais ce n'est pas la ligne exacte.
    return contexte.auContrat.parQuoi === garantieId
      ? NiveauPreuve.ETABLIE
      : NiveauPreuve.PROBABLE
  }

  // Connue seulement par l'attestation : elle prouve qu'un contrat existe, pas
  // ce qu'il couvre. On ne conclut donc pas a la conformite.
  if (contexte.aLAttestation.satisfaite) return NiveauPreuve.PROBABLE

  // Aucune piece probante fournie : on ne peut pas conclure a une absence.
  if (!contexte.contratFourni) return NiveauPreuve.NON_DEMONTREE

  return NiveauPreuve.ECART_CONFIRME
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
    case NiveauPreuve.JUSTIFICATION_INSUFFISANTE:
      return (
        `« ${entree.libelle} » figure au contrat, mais pas sur l’attestation produite. ` +
        `La couverture existe ; le bailleur ne peut pas s’en assurer sur la pièce qu’on lui ` +
        `remet. Demander une attestation détaillant cette garantie.`
      )
    case NiveauPreuve.PROBABLE:
      return parQuoi === null || parQuoi === garantieId
        ? `« ${entree.libelle} » n’est connue que par une attestation, qui prouve l’existence ` +
            `d’un contrat mais pas l’étendue de ce qu’il couvre. À confirmer aux conditions ` +
            `particulières.`
        : `Aucune ligne « ${entree.libelle} » au tableau, mais ` +
            `« ${garantie(parQuoi).libelle} » englobe cette garantie. ` +
            `À confirmer aux conditions particulières.`
    case NiveauPreuve.NON_DEMONTREE:
      return piecesFournies
        ? `Les pièces mentionnent le sujet sans permettre de conclure sur « ${entree.libelle} ».`
        : `Aucune pièce d’assurance n’a été fournie : la couverture de « ${entree.libelle} » ne peut pas être démontrée.`
    case NiveauPreuve.ECART_CONFIRME:
      // La recherche effectuee a son propre champ dans le poste de travail
      // comme dans le rapport : la repeter ici la ferait lire deux fois.
      return `Exigence de « ${entree.libelle} » non retrouvée dans les pièces produites.`
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
  /**
   * Ce qui a ete cherche dans les pieces.
   *
   * Le poste de travail affiche la recherche dans un champ dedie ; le
   * diagnostic d'un controle, lui, tient en une phrase et doit la porter —
   * sans quoi le praticien lit « non retrouvée » sans savoir sous quels
   * libelles on a cherche.
   */
  readonly recherche: readonly string[]
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
    NiveauPreuve.JUSTIFICATION_INSUFFISANTE,
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
    recherche: meilleur.recherche,
  }
}

/** Toutes les garanties de la nomenclature, pour l'affichage du perimetre. */
export const NOMBRE_GARANTIES_SUIVIES = NOMENCLATURE.length
