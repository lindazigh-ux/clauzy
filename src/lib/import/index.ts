/**
 * Import local de documents (brief §3, §14).
 *
 * Un seul point d'entree : `lireDocument()`. Le fichier est lu depuis le disque
 * du praticien, decode dans le navigateur, et rien d'autre. Aucune de ces
 * fonctions n'importe src/lib/net, et le test d'architecture le verifie.
 *
 * Les trois moteurs de parsing sont charges en import dynamique, uniquement
 * quand un fichier de ce format se presente (§13). Le budget de performance
 * echoue si l'un d'eux apparait dans le bundle initial.
 */
import { ErreurLecture, type DocumentImporte, type FormatFichier, type RoleDocument } from './types'

export { ErreurLecture } from './types'
export type { DocumentImporte, EnteteCourriel, FormatFichier, RoleDocument } from './types'
export { reconstituerTexte, type FragmentTexte } from './lignes'

/**
 * Au-dela, la lecture fige le navigateur sans rien apporter : un bail de plus
 * de 60 Mo est un scan d'images, dont aucun texte ne sortira.
 */
export const TAILLE_MAX_OCTETS = 60 * 1024 * 1024

/** Profondeur d'imbrication : un courriel dans un courriel, on s'arrete la. */
const PROFONDEUR_MAX = 1

const SIGNATURES: readonly { readonly format: FormatFichier; readonly octets: readonly number[] }[] = [
  { format: 'pdf', octets: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { format: 'msg', octets: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // conteneur OLE
  { format: 'docx', octets: [0x50, 0x4b, 0x03, 0x04] }, // conteneur ZIP
]

const correspond = (vue: Uint8Array, octets: readonly number[]): boolean =>
  octets.every((octet, index) => vue[index] === octet)

/**
 * Le format est deduit du CONTENU, pas de l'extension : un « .pdf » renomme en
 * « .docx » se lit quand meme, et un fichier hostile ne gagne rien a mentir sur
 * son extension.
 */
export function detecterFormat(nom: string, donnees: ArrayBuffer): FormatFichier {
  const vue = new Uint8Array(donnees.slice(0, 8))
  for (const signature of SIGNATURES) {
    if (correspond(vue, signature.octets)) return signature.format
  }
  const extension = nom.toLowerCase().split('.').pop() ?? ''
  if (extension === 'pdf') return 'pdf'
  if (extension === 'docx' || extension === 'doc') return 'docx'
  if (extension === 'msg') return 'msg'
  return 'texte'
}

const decoderTexte = (donnees: ArrayBuffer): string => {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(donnees)
  // U+FFFD en nombre signale un encodage occidental hérité, encore courant
  // dans les exports de logiciels de gestion locative.
  const suspects = (utf8.match(/�/g) ?? []).length
  if (suspects > utf8.length / 200) {
    return new TextDecoder('windows-1252', { fatal: false }).decode(donnees)
  }
  return utf8
}

/** Normalise les fins de ligne : la segmentation raisonne en « \n ». */
const normaliser = (texte: string): string => texte.replace(/\r\n?/g, '\n').replace(/ /g, ' ')

let compteur = 0
const prochainId = (): string => `doc-${(compteur += 1)}`

export type OptionsLecture = {
  readonly role?: RoleDocument
  /** Usage interne : profondeur courante de recursion dans les pieces jointes. */
  readonly profondeur?: number
}

/**
 * Lit un fichier et rend un document exploitable par le moteur.
 *
 * Une lecture qui echoue dit quoi faire (§8) : jamais « une erreur est
 * survenue », toujours l'action qui debloque le praticien.
 */
export async function lireDocument(
  nom: string,
  donnees: ArrayBuffer,
  options: OptionsLecture = {},
): Promise<DocumentImporte> {
  const role = options.role ?? 'OBLIGATION'
  const profondeur = options.profondeur ?? 0

  if (donnees.byteLength === 0) {
    throw new ErreurLecture(nom, `« ${nom} » est vide. Vérifiez le fichier et réimportez-le.`)
  }
  if (donnees.byteLength > TAILLE_MAX_OCTETS) {
    const mo = Math.round(donnees.byteLength / (1024 * 1024))
    throw new ErreurLecture(
      nom,
      `« ${nom} » pèse ${mo} Mo, au-delà de la limite de lecture. ` +
        `S’il s’agit d’un scan, exportez-le avec une couche texte, ou découpez-le par article.`,
    )
  }

  const format = detecterFormat(nom, donnees)
  const commun = { id: prochainId(), nom, format, role, taille: donnees.byteLength } as const

  try {
    if (format === 'pdf') {
      const { lirePdf } = await import('./pdf')
      const lecture = await lirePdf(donnees)
      return {
        ...commun,
        texte: normaliser(lecture.texte),
        pages: lecture.pages,
        avertissements: lecture.avertissements,
        courriel: null,
        piecesJointes: [],
      }
    }

    if (format === 'docx') {
      const { lireDocx } = await import('./docx')
      const lecture = await lireDocx(donnees)
      return {
        ...commun,
        texte: normaliser(lecture.texte),
        pages: null,
        avertissements: lecture.avertissements,
        courriel: null,
        piecesJointes: [],
      }
    }

    if (format === 'msg') {
      const { lireMsg } = await import('./msg')
      const lecture = await lireMsg(donnees)
      const avertissements = [...lecture.avertissements]

      const piecesJointes: DocumentImporte[] = []
      if (profondeur < PROFONDEUR_MAX) {
        for (const jointe of lecture.piecesJointes) {
          try {
            piecesJointes.push(
              await lireDocument(jointe.nom, jointe.donnees, {
                role: 'COUVERTURE',
                profondeur: profondeur + 1,
              }),
            )
          } catch (erreur) {
            avertissements.push(
              erreur instanceof ErreurLecture
                ? erreur.message
                : `La pièce jointe « ${jointe.nom} » n’a pas pu être lue. Importez-la séparément.`,
            )
          }
        }
      }

      return {
        ...commun,
        texte: normaliser(lecture.texte),
        pages: null,
        avertissements,
        courriel: {
          objet: lecture.objet,
          expediteur: lecture.expediteur,
          destinataires: lecture.destinataires,
          envoyeLe: lecture.envoyeLe,
        },
        piecesJointes,
      }
    }

    const texte = normaliser(decoderTexte(donnees))
    return {
      ...commun,
      texte,
      pages: null,
      avertissements:
        texte.trim().length === 0
          ? [`« ${nom} » ne contient aucun texte exploitable.`]
          : [],
      courriel: null,
      piecesJointes: [],
    }
  } catch (erreur) {
    if (erreur instanceof ErreurLecture) throw erreur
    const detail = erreur instanceof Error ? erreur.message : String(erreur)
    throw new ErreurLecture(
      nom,
      `« ${nom} » n’a pas pu être lu (${detail}). ` +
        `Réenregistrez-le depuis son application d’origine, ou collez son texte directement.`,
    )
  }
}

/** Aplatit un document et ses pieces jointes en documents soumis au moteur. */
export function documentsAnalysables(
  documents: readonly DocumentImporte[],
): { readonly id: string; readonly role: RoleDocument; readonly texte: string }[] {
  const aplatis: { id: string; role: RoleDocument; texte: string }[] = []
  for (const document of documents) {
    if (document.texte.trim().length > 0) {
      aplatis.push({ id: document.id, role: document.role, texte: document.texte })
    }
    aplatis.push(...documentsAnalysables(document.piecesJointes))
  }
  return aplatis
}
