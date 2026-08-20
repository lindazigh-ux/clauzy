/**
 * Remplacant de la couche worker pour la construction autonome.
 *
 * Le produit isole la lecture et l'analyse dans un Web Worker (brief §3). Un
 * bundle d'un seul fichier ne peut pas en instancier un : la demonstration
 * appelle donc le moteur directement, sur le fil principal.
 *
 * C'est la SEULE difference de comportement avec l'application, et elle est
 * annoncee a l'ecran : sur un bail de deux cents pages, l'interface se fige le
 * temps de l'analyse, ce qui n'arrive pas dans le produit.
 */
import { analyser, type Analyse, type DocumentAnalyse } from '@/domain/moteur/moteur'
import { lireDocument, type DocumentImporte, type RoleDocument } from '@/lib/import'

export const workerDisponible = (): boolean => false

export type OptionsAppel = { readonly signal?: AbortSignal }

export async function lancerAnalyse(
  documents: readonly DocumentAnalyse[],
): Promise<{ readonly analyse: Analyse; readonly dansUnWorker: boolean }> {
  return { analyse: analyser(documents), dansUnWorker: false }
}

export async function lireFichier(
  nom: string,
  donnees: ArrayBuffer,
  role: RoleDocument = 'OBLIGATION',
): Promise<{ readonly document: DocumentImporte; readonly dansUnWorker: boolean }> {
  return { document: await lireDocument(nom, donnees, { role }), dansUnWorker: false }
}
