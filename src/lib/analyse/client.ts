/**
 * Point d'entree de la lecture et de l'analyse cote application (brief §3).
 *
 * Dans un navigateur, les deux partent dans un Web Worker : l'interface reste
 * repondante pendant tout le calcul, et le praticien peut continuer a saisir
 * son perimetre pendant qu'un bail de deux cents pages se lit.
 *
 * Hors navigateur — rendu serveur, tests unitaires — le worker n'existe pas et
 * les fonctions sont appelees directement. Le repli est explicite plutot que
 * silencieux : chaque appel dit lequel des deux chemins a servi, pour qu'une
 * regression ne se transforme pas en interface gelee sans que personne ne le voie.
 */
import { analyser, type Analyse, type DocumentAnalyse } from '@/domain/moteur/moteur'
import { lireDocument, type DocumentImporte, type RoleDocument } from '@/lib/import'

import type { Demande, Reponse } from './protocole'

export const workerDisponible = (): boolean => typeof Worker !== 'undefined'

let compteur = 0
const prochaineRequete = (): string => `req-${(compteur += 1)}`

export type OptionsAppel = {
  readonly signal?: AbortSignal
}

/** Omit distributif : un Omit ordinaire aplatirait l'union des demandes. */
type SansRequete<T> = T extends unknown ? Omit<T, 'requete'> : never

/**
 * Un aller-retour avec le worker. Le worker est cree pour la demande et detruit
 * ensuite : une analyse dure quelques secondes, garder un fil en vie entre deux
 * dossiers ne rapporterait rien et retiendrait la memoire des documents.
 */
async function allerRetour<T>(
  demande: SansRequete<Demande>,
  extraire: (reponse: Reponse) => T | undefined,
  transferables: Transferable[],
  options: OptionsAppel,
): Promise<T> {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  const requete = prochaineRequete()

  try {
    return await new Promise<T>((resoudre, rejeter) => {
      options.signal?.addEventListener('abort', () => rejeter(new Error('Traitement interrompu.')), {
        once: true,
      })

      worker.onmessage = (evenement: MessageEvent<Reponse>) => {
        const reponse = evenement.data
        if (reponse.requete !== requete) return
        if (reponse.type === 'erreur') {
          rejeter(new Error(reponse.message))
          return
        }
        const valeur = extraire(reponse)
        if (valeur === undefined) {
          rejeter(new Error('Réponse inattendue du moteur. Rechargez la page et relancez.'))
          return
        }
        resoudre(valeur)
      }

      worker.onerror = () => {
        rejeter(
          new Error(
            'Le traitement n’a pas pu démarrer sur ce navigateur. Rechargez la page ; ' +
              'si le problème persiste, ouvrez le dossier dans un autre navigateur.',
          ),
        )
      }

      worker.postMessage({ ...demande, requete } as Demande, transferables)
    })
  } finally {
    worker.terminate()
  }
}

/** Lance une analyse. Renvoie le resultat et le chemin emprunte. */
export async function lancerAnalyse(
  documents: readonly DocumentAnalyse[],
  options: OptionsAppel = {},
): Promise<{ readonly analyse: Analyse; readonly dansUnWorker: boolean }> {
  if (!workerDisponible()) {
    return { analyse: analyser(documents), dansUnWorker: false }
  }

  const analyse = await allerRetour<Analyse>(
    { type: 'analyser', documents },
    (reponse) => (reponse.type === 'resultat' ? reponse.analyse : undefined),
    [],
    options,
  )
  return { analyse, dansUnWorker: true }
}

/**
 * Lit un fichier. L'ArrayBuffer est TRANSFERE au worker, pas copie : un bail de
 * 40 Mo ne doit pas exister deux fois en memoire. Le tampon devient donc
 * inutilisable de ce cote — c'est voulu, et c'est sans consequence puisque le
 * document lu revient avec son texte.
 */
export async function lireFichier(
  nom: string,
  donnees: ArrayBuffer,
  role: RoleDocument = 'OBLIGATION',
  options: OptionsAppel = {},
): Promise<{ readonly document: DocumentImporte; readonly dansUnWorker: boolean }> {
  if (!workerDisponible()) {
    return { document: await lireDocument(nom, donnees, { role }), dansUnWorker: false }
  }

  const document = await allerRetour<DocumentImporte>(
    { type: 'lire', nom, donnees, role },
    (reponse) => (reponse.type === 'document' ? reponse.document : undefined),
    [donnees],
    options,
  )
  return { document, dansUnWorker: true }
}
