/**
 * Worker d'analyse (brief §3).
 *
 * Une analyse parcourt les 40 controles sur un bail entier et ses pieces. Sur
 * un bail long, cela represente assez de travail pour figer une interface : le
 * worker isole ce calcul du fil principal.
 *
 * Il porte deux traitements — la lecture des fichiers et l'analyse — et rien
 * d'autre : aucune regle metier ici, aucun acces reseau. La couche src/lib/net
 * n'y est meme pas importee.
 */
import { analyser } from '@/domain/moteur/moteur'
import { lireDocument } from '@/lib/import'

import type { Demande, Reponse } from './protocole'

const repondre = (reponse: Reponse): void => {
  ;(self as unknown as { postMessage: (message: Reponse) => void }).postMessage(reponse)
}

const messageDErreur = (erreur: unknown, repli: string): string =>
  erreur instanceof Error ? erreur.message : repli

self.onmessage = async (evenement: MessageEvent<Demande>) => {
  const demande = evenement.data

  if (demande?.type === 'analyser') {
    try {
      repondre({ type: 'resultat', requete: demande.requete, analyse: analyser(demande.documents) })
    } catch (erreur) {
      repondre({
        type: 'erreur',
        requete: demande.requete,
        message: messageDErreur(
          erreur,
          'L’analyse s’est interrompue. Rechargez la page et relancez-la.',
        ),
      })
    }
    return
  }

  if (demande?.type === 'lire') {
    try {
      const document = await lireDocument(demande.nom, demande.donnees, { role: demande.role })
      repondre({ type: 'document', requete: demande.requete, document })
    } catch (erreur) {
      repondre({
        type: 'erreur',
        requete: demande.requete,
        message: messageDErreur(
          erreur,
          `« ${demande.nom} » n’a pas pu être lu. Réenregistrez-le, ou collez son texte.`,
        ),
      })
    }
  }
}
