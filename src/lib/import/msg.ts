/**
 * Lecture d'un courriel Outlook (.msg) — brief §3, §4.
 *
 * Le mail d'attestation est une piece a part entiere : sa date d'envoi sert au
 * calcul de la relance compagnie (§7, lot L5), et l'attestation elle-meme est
 * presque toujours en piece jointe. On extrait donc l'entete, le corps, ET les
 * pieces jointes, que la couche d'import relira ensuite recursivement.
 *
 * msgreader est charge en import DYNAMIQUE, comme les autres moteurs (§13).
 */

export type PieceJointeBrute = {
  readonly nom: string
  readonly donnees: ArrayBuffer
}

export type LectureMsg = {
  readonly texte: string
  readonly objet: string | null
  readonly expediteur: string | null
  readonly destinataires: readonly string[]
  readonly envoyeLe: string | null
  readonly piecesJointes: readonly PieceJointeBrute[]
  readonly avertissements: readonly string[]
}

const chaine = (valeur: unknown): string | null => {
  if (typeof valeur !== 'string') return null
  const nettoyee = valeur.trim()
  return nettoyee.length === 0 ? null : nettoyee
}

/**
 * Outlook stocke la date d'envoi sous des formes variables selon la version.
 * Une date illisible n'est pas une erreur : elle devient un avertissement, et
 * le praticien la saisit a la main. Le moteur ne devine jamais une date — une
 * relance calculee sur une date fausse est pire qu'une relance non calculee.
 */
const dateIso = (valeur: unknown): string | null => {
  if (valeur instanceof Date) {
    return Number.isNaN(valeur.getTime()) ? null : valeur.toISOString()
  }
  if (typeof valeur !== 'string' && typeof valeur !== 'number') return null
  const date = new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

type ChampsMsg = Record<string, unknown>

export async function lireMsg(donnees: ArrayBuffer): Promise<LectureMsg> {
  const msgreader = await import('@kenjiuno/msgreader')
  const MsgReader = (msgreader.default ?? msgreader) as unknown as new (
    donnees: ArrayBuffer,
  ) => {
    getFileData: () => ChampsMsg
    getAttachment: (indice: number | ChampsMsg) => { fileName?: string; content?: Uint8Array }
  }

  const lecteur = new MsgReader(donnees)
  const champs = lecteur.getFileData()

  const avertissements: string[] = []
  const objet = chaine(champs.subject)
  const expediteur = chaine(champs.senderEmail) ?? chaine(champs.senderName)

  const destinataires = Array.isArray(champs.recipients)
    ? (champs.recipients as ChampsMsg[])
        .map((r) => chaine(r.email) ?? chaine(r.name))
        .filter((valeur): valeur is string => valeur !== null)
    : []

  const envoyeLe =
    dateIso(champs.messageDeliveryTime) ??
    dateIso(champs.clientSubmitTime) ??
    dateIso(champs.creationTime)

  if (envoyeLe === null) {
    avertissements.push(
      'La date d’envoi du courriel n’a pas pu être lue. Saisissez-la à la main : ' +
        'c’est elle qui date la prochaine relance.',
    )
  }

  const piecesJointes: PieceJointeBrute[] = []
  const listeBrute = Array.isArray(champs.attachments) ? (champs.attachments as ChampsMsg[]) : []

  listeBrute.forEach((entree, indice) => {
    try {
      const jointe = lecteur.getAttachment(entree ?? indice)
      const contenu = jointe.content
      if (contenu === undefined || contenu.byteLength === 0) return
      const copie = new ArrayBuffer(contenu.byteLength)
      new Uint8Array(copie).set(contenu)
      piecesJointes.push({ nom: jointe.fileName ?? `piece-jointe-${indice + 1}`, donnees: copie })
    } catch {
      avertissements.push(
        `La pièce jointe n° ${indice + 1} n’a pas pu être extraite. ` +
          `Enregistrez-la depuis Outlook et importez-la séparément.`,
      )
    }
  })

  const corps = chaine(champs.body) ?? ''
  const entete = [
    objet === null ? null : `Objet : ${objet}`,
    expediteur === null ? null : `De : ${expediteur}`,
    destinataires.length === 0 ? null : `À : ${destinataires.join(', ')}`,
    envoyeLe === null ? null : `Envoyé le : ${envoyeLe}`,
  ].filter((ligne): ligne is string => ligne !== null)

  return {
    texte: entete.length === 0 ? corps : `${entete.join('\n')}\n\n${corps}`,
    objet,
    expediteur,
    destinataires,
    envoyeLe,
    piecesJointes,
    avertissements,
  }
}
