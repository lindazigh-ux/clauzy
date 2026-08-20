/**
 * Lecture d'un document Word (brief §3).
 *
 * mammoth est charge en import DYNAMIQUE, pour les memes raisons que pdfjs.
 *
 * `extractRawText` est prefere a la conversion HTML : la structure dont le
 * moteur a besoin est celle des paragraphes, pas celle des styles. Un titre
 * d'article reste sur sa ligne, ce qui suffit a la segmentation.
 */

export type LectureDocx = {
  readonly texte: string
  readonly avertissements: readonly string[]
}

/**
 * mammoth expose deux entrees selon l'environnement : `arrayBuffer` dans le
 * navigateur — la cible reelle — et `buffer` sous Node, ou tournent les tests.
 * On prend la premiere, et l'on retombe sur la seconde plutot que de faire
 * dependre le code de production de la forme des tests.
 */
const lireAvecMammoth = async (
  mammoth: typeof import('mammoth'),
  donnees: ArrayBuffer,
): Promise<Awaited<ReturnType<typeof mammoth.extractRawText>>> => {
  try {
    return await mammoth.extractRawText({ arrayBuffer: donnees })
  } catch (erreur) {
    const nodeBuffer = (globalThis as { Buffer?: { from: (a: ArrayBuffer) => unknown } }).Buffer
    if (nodeBuffer === undefined) throw erreur
    return await mammoth.extractRawText({
      buffer: nodeBuffer.from(donnees),
    } as unknown as Parameters<typeof mammoth.extractRawText>[0])
  }
}

export async function lireDocx(donnees: ArrayBuffer): Promise<LectureDocx> {
  const mammoth = await import('mammoth')
  const resultat = await lireAvecMammoth(mammoth, donnees)

  const avertissements = (resultat.messages ?? [])
    .filter((message) => message.type === 'warning' || message.type === 'error')
    .map((message) => `Lecture Word : ${message.message}`)

  return { texte: resultat.value ?? '', avertissements }
}
