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
import { reconnaitreDans, satisfaite, type Reconnaissance } from '../garanties/reconnaissance'
import { garantiesDe } from '../garanties/rattachement'
import {
  ACTION_PAR_CATEGORIE,
  NiveauPreuve,
  type Beneficiaire,
  type Categorie,
} from '../garanties/types'
import { passages, type DocumentSource } from './ancrage'
import { enMois, extraireValeurs, type ValeurExtraite } from './extracteurs'

/**
 * Niveau de preuve — la distinction que le cahier reclame entre « absent » et
 * « non demontre ».
 *
 * Une IA ne devrait presque jamais ecrire « le client n'est pas assuré » parce
 * qu'elle n'a pas trouve la clause. Elle doit dire ce qu'elle sait, et avec
 * quelle certitude.
 */
export { NiveauPreuve, LIBELLE_PREUVE } from '../garanties/types'

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
  /**
   * « 2 400 000 € exigés · 900 000 € soutenus », quand les deux cotes portent
   * une valeur comparable. Null sinon — on ne chiffre jamais au jugé.
   */
  readonly chiffrage: string | null
  /**
   * Le geste que ce niveau appelle POUR CETTE garantie.
   *
   * Il vient du domaine, jamais de l'affichage : la meme phrase se retrouvait
   * recopiee dans le poste de travail, dans le Word et dans le rapport client,
   * et les trois pouvaient deriver. Elle n'existe plus qu'ici.
   */
  readonly action: string
}

/**
 * L'action propre a la garantie si elle en porte une, celle de sa categorie
 * sinon. Une action generique appliquee a tout — « negocier la clause d'abord,
 * chiffrer l'extension ensuite » — est fausse une fois sur deux : on ne negocie
 * pas une franchise, et sur l'assurance de l'immeuble du bailleur, proposer de
 * souscrire reviendrait a faire financer au preneur un bien qui n'est pas le
 * sien.
 */
const actionPour = (garantieId: string, niveau: NiveauPreuve): string => {
  const entree = garantie(garantieId)
  return entree.actions?.[niveau] ?? ACTION_PAR_CATEGORIE[entree.categorie][niveau]
}

/**
 * Confronte les valeurs des deux cotes.
 *
 * Sans elle, le moteur declarait « couverture etablie » sur une garantie
 * exigee a 2 400 000 € et souscrite a 900 000 €. Trouver le bon LIBELLE ne
 * suffit pas : une garantie presente mais insuffisante est un ecart, et c'est
 * meme l'ecart le plus courant.
 *
 * Dans le doute on ne chiffre pas : plusieurs valeurs discordantes dans la
 * meme stipulation rendraient la comparaison arbitraire (§5.3).
 */
type Comparaison = { readonly resume: string; readonly insuffisant: boolean }

const valeurUnique = (texte: string, nature: ValeurExtraite['nature']): ValeurExtraite | null => {
  const trouvees = extraireValeurs(texte).filter((v) => v.nature === nature)
  const premiere = trouvees[0]
  if (premiere === undefined) return null
  const memeValeur = trouvees.every((v) =>
    v.nature === 'duree' && premiere.nature === 'duree'
      ? v.valeur === premiere.valeur && v.unite === premiere.unite
      : 'valeur' in v && 'valeur' in premiere && v.valeur === premiere.valeur,
  )
  return memeValeur ? premiere : null
}

const decrire = (valeur: ValeurExtraite): string => {
  switch (valeur.nature) {
    case 'duree': {
      const unites: Record<string, string> = {
        jour: 'jour', semaine: 'semaine', mois: 'mois', annee: 'an',
      }
      const unite = unites[valeur.unite] ?? valeur.unite
      return `${valeur.valeur} ${unite}${valeur.valeur > 1 && unite !== 'mois' ? 's' : ''}`
    }
    case 'montant_eur':
      return `${valeur.valeur.toLocaleString('fr-FR')} €`
    case 'pourcentage':
      return `${valeur.valeur} %`
    case 'date':
      return valeur.iso
  }
}

const comparer = (
  exigence: Reconnaissance | null,
  couverture: Reconnaissance | null,
): Comparaison | null => {
  if (exigence === null || couverture === null) return null

  for (const nature of ['montant_eur', 'duree', 'pourcentage'] as const) {
    const exige = valeurUnique(exigence.stipulation.texte, nature)
    const soutenu = valeurUnique(couverture.stipulation.texte, nature)
    if (exige === null || soutenu === null) continue
    if (decrire(exige) === decrire(soutenu)) return null

    const chiffres =
      exige.nature === 'duree' && soutenu.nature === 'duree'
        ? { gauche: enMois(exige.valeur, exige.unite), droite: enMois(soutenu.valeur, soutenu.unite) }
        : exige.nature !== 'duree' && soutenu.nature !== 'duree' && 'valeur' in exige && 'valeur' in soutenu
          ? { gauche: exige.valeur, droite: soutenu.valeur }
          : null

    return {
      resume: `${decrire(exige)} exigés · ${decrire(soutenu)} soutenus`,
      insuffisant: chiffres !== null && chiffres.droite < chiffres.gauche,
    }
  }
  return null
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
/**
 * Rapproche un jeu de documents.
 *
 * Il prend les DOCUMENTS et non des chaines : le decoupage passe par
 * `moteur/ancrage`, seul endroit qui sait retrancher un en-tete d'article et
 * rattacher une stipulation a son numero. Passer du texte brut, c'est
 * redecouper a cote — et c'est ainsi qu'un rapport a fini par citer
 * « ARTICLE 13 — RENONCIATION À RECOURS » comme la clause en cause.
 */
export function rapprocher(documents: readonly DocumentSource[]): Rapprochement[] {
  const tous = passages(documents)
  const contratFourni = tous.some((p) => p.role === 'COUVERTURE')
  const attestationFournie = tous.some((p) => p.role === 'ATTESTATION')
  const piecesFournies = contratFourni || attestationFournie

  const lire = (role: DocumentSource['role'], cote: 'OBLIGATION' | 'COUVERTURE') =>
    tous.filter((p) => p.role === role).flatMap((p) => reconnaitreDans(p, cote))

  const exigences = lire('OBLIGATION', 'OBLIGATION')
  const couvertures = lire('COUVERTURE', 'COUVERTURE')
  const attestees = lire('ATTESTATION', 'COUVERTURE')
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

    // Le libellé peut correspondre et le montant manquer : une garantie
    // présente mais insuffisante reste un écart.
    const comparaison = comparer(exigence, trouvee)

    const niveau =
      comparaison?.insuffisant === true && contratFourni
        ? NiveauPreuve.ECART_CONFIRME
        : decider(garantieId, {
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
      conclusion:
        comparaison?.insuffisant === true && contratFourni
          ? `La garantie « ${entree.libelle} » figure aux pièces, mais en deçà de ce que le ` +
            `document source exige (${comparaison.resume}).`
          : conclure(garantieId, niveau, auContrat.parQuoi ?? aLAttestation.parQuoi, piecesFournies),
      ecartees: exigence.ecartees,
      chiffrage: comparaison?.resume ?? null,
      action: actionPour(garantieId, niveau),
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
  readonly action: string
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
    action: meilleur.action,
  }
}

/** Toutes les garanties de la nomenclature, pour l'affichage du perimetre. */
export const NOMBRE_GARANTIES_SUIVIES = NOMENCLATURE.length
