/**
 * pdfjs, cable pour un fichier HTML unique (demonstration seulement).
 *
 * Hors bundler, pdfjs va chercher son worker par une URL relative a son propre
 * module. Une page qui n'existe qu'en un seul fichier n'a pas d'URL relative a
 * offrir. On lui fournit donc le worker nous-memes : il est compile a part par
 * `construire.mjs`, embarque en texte, et instancie depuis un blob:.
 *
 * Le worker est cree en script CLASSIQUE, pas en module. Ce detail decide de
 * tout : pdfjs, laisse a lui-meme, instancie `new Worker(url, {type:'module'})`,
 * et un navigateur refuse un worker de type module servi depuis une page
 * file:// — d'ou l'echec « Setting up fake worker failed » quand on ouvre la
 * demonstration par un double-clic. Un worker classique, lui, demarre aussi
 * bien en file:// qu'en https:.
 *
 * Ce fichier ne sert QU'A la demonstration : l'application recoit son worker de
 * Next, qui sait resoudre `new URL(..., import.meta.url)`.
 */
// @ts-expect-error — module virtuel fourni par scripts/demo/construire.mjs
import { SOURCE_WORKER } from 'virtuel:pdf-worker'
// Chemin relatif volontaire : l'alias du build detourne le nom du paquet vers
// CE fichier, et l'on a besoin ici du vrai module.
import * as pdfjs from '../../node_modules/pdfjs-dist/legacy/build/pdf.mjs'

/**
 * Une seule URL de blob pour toute la page : elle est reutilisee a chaque PDF.
 * On ne la revoque pas — la revoquer condamnerait les lectures suivantes.
 */
let urlWorker: string | null = null

const adresseDuWorker = (): string => {
  if (urlWorker === null) {
    urlWorker = URL.createObjectURL(
      new Blob([SOURCE_WORKER as string], { type: 'text/javascript' }),
    )
  }
  return urlWorker
}

/** Le worker n'a pas pu demarrer : on dit quoi faire, pas « une erreur ». */
class WorkerIndisponible extends Error {
  constructor(cause: string) {
    super(
      `Le lecteur PDF n’a pas pu démarrer dans cette page (${cause}). ` +
        `Convertissez le PDF en texte, ou lancez l’application complète.`,
    )
    this.name = 'WorkerIndisponible'
  }
}

export const getDocument: typeof pdfjs.getDocument = (parametres) => {
  let worker: Worker
  try {
    // Script classique, a dessein : voir l'en-tete de fichier.
    worker = new Worker(adresseDuWorker())
  } catch (erreur) {
    throw new WorkerIndisponible(erreur instanceof Error ? erreur.message : String(erreur))
  }

  const tache = pdfjs.getDocument({
    ...(parametres as object),
    // Les types de pdfjs declarent `port: null`, alors que le code accepte
    // tout objet qui sait poster et ecouter — un Worker en fait partie, et
    // c'est ainsi que pdfjs s'en sert lui-meme.
    worker: new pdfjs.PDFWorker({ port: worker } as unknown as { port?: null }),
  } as Parameters<typeof pdfjs.getDocument>[0])

  // pdfjs ne detruit que les workers qu'il a crees lui-meme : celui-ci est le
  // notre, c'est donc a nous de l'arreter, sans quoi chaque PDF lu laisserait
  // un fil vivant derriere lui.
  const detruire = tache.destroy.bind(tache)
  tache.destroy = async () => {
    try {
      await detruire()
    } finally {
      worker.terminate()
    }
  }

  return tache
}

export * from '../../node_modules/pdfjs-dist/legacy/build/pdf.mjs'
