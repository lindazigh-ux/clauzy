/**
 * Point d'entree de l'analyse cote application (brief §3).
 *
 * Dans un navigateur, l'analyse part dans un Web Worker : l'interface reste
 * repondante pendant tout le calcul, et le praticien peut continuer a saisir
 * son perimetre.
 *
 * Hors navigateur — rendu serveur, tests unitaires — le worker n'existe pas et
 * le moteur est appele directement. Le repli est explicite plutot que silencieux :
 * `analyseDansUnWorker()` dit lequel des deux chemins a servi, pour qu'une
 * regression ne se transforme pas en interface gelee sans que personne ne le voie.
 */
import { analyser, type Analyse, type DocumentAnalyse } from '@/domain/moteur/moteur'

import type { DemandeAnalyse, ReponseAnalyse } from './protocole'

export const workerDisponible = (): boolean => typeof Worker !== 'undefined'

let compteur = 0
const prochaineRequete = (): string => `analyse-${(compteur += 1)}`

/**
 * Lance une analyse. Renvoie le resultat et le chemin emprunte, pour que
 * l'appelant puisse signaler un repli inattendu.
 */
export async function lancerAnalyse(
  documents: readonly DocumentAnalyse[],
  options: { readonly signal?: AbortSignal } = {},
): Promise<{ readonly analyse: Analyse; readonly dansUnWorker: boolean }> {
  if (!workerDisponible()) {
    return { analyse: analyser(documents), dansUnWorker: false }
  }

  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  const requete = prochaineRequete()

  try {
    const analyse = await new Promise<Analyse>((resoudre, rejeter) => {
      const abandonner = () => {
        rejeter(new Error('Analyse interrompue.'))
      }
      options.signal?.addEventListener('abort', abandonner, { once: true })

      worker.onmessage = (evenement: MessageEvent<ReponseAnalyse>) => {
        const reponse = evenement.data
        if (reponse.requete !== requete) return
        if (reponse.type === 'resultat') resoudre(reponse.analyse)
        else rejeter(new Error(reponse.message))
      }

      worker.onerror = () => {
        rejeter(
          new Error(
            'L’analyse n’a pas pu démarrer sur ce navigateur. Rechargez la page ; ' +
              'si le problème persiste, ouvrez le dossier dans un autre navigateur.',
          ),
        )
      }

      const demande: DemandeAnalyse = { type: 'analyser', requete, documents }
      worker.postMessage(demande)
    })

    return { analyse, dansUnWorker: true }
  } finally {
    worker.terminate()
  }
}
