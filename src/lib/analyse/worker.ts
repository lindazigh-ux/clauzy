/**
 * Worker d'analyse (brief §3).
 *
 * Une analyse parcourt les 40 controles sur un bail entier et ses pieces. Sur
 * un bail long, cela represente assez de travail pour figer une interface : le
 * worker isole ce calcul du fil principal.
 *
 * Ce fichier ne fait volontairement rien d'autre que porter le moteur : aucune
 * regle metier ici, aucun acces reseau — la couche src/lib/net n'y est meme pas
 * importee.
 */
import { analyser } from '@/domain/moteur/moteur'

import type { DemandeAnalyse, ReponseAnalyse } from './protocole'

const repondre = (reponse: ReponseAnalyse): void => {
  ;(self as unknown as { postMessage: (message: ReponseAnalyse) => void }).postMessage(reponse)
}

self.onmessage = (evenement: MessageEvent<DemandeAnalyse>) => {
  const demande = evenement.data
  if (demande?.type !== 'analyser') return

  try {
    repondre({ type: 'resultat', requete: demande.requete, analyse: analyser(demande.documents) })
  } catch (erreur) {
    repondre({
      type: 'erreur',
      requete: demande.requete,
      message:
        erreur instanceof Error
          ? erreur.message
          : 'L’analyse s’est interrompue. Rechargez la page et relancez-la.',
    })
  }
}
