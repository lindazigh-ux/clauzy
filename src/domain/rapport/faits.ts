/**
 * Les faits métier d'un rapport — la liste que les deux livrables doivent
 * porter, à l'identique.
 *
 * La note Word et le rapport client sont rendus par deux moteurs différents,
 * l'un en OOXML, l'autre en HTML pour l'impression. Rien n'empêchait l'un de
 * dire « 45 contrôles » pendant que l'autre en annonçait 40, ni l'un d'omettre
 * les pièces manquantes que l'autre listait. Personne ne s'en apercevait avant
 * le client.
 *
 * Ce module énumère ce qu'un rapport DOIT contenir, quel que soit son support.
 * Un test de parité vérifie ensuite que les deux le portent réellement.
 */
import { NOMBRE_CONTROLES } from '../controles'
import { LIBELLE_PREUVE } from '../garanties/types'
import {
  MENTION_LIMITE,
  formulerProchaineAction,
  preconisations,
  resultatsAffiches,
  synthetiser,
  type Dossier,
} from '../dossier'

/** Un fait, et d'où il vient. Le libellé sert aux messages d'échec. */
export type Fait = {
  readonly rubrique: string
  /** Le texte qui doit se retrouver, mot pour mot, dans les deux livrables. */
  readonly texte: string
}

/**
 * Ce qu'un rapport doit dire, dossier donné.
 *
 * On ne retient que des faits VÉRIFIABLES par recherche de texte : un chiffre,
 * une référence de contrôle, une pièce nommée. La mise en forme, l'ordre des
 * sections et les formulations d'accompagnement ne sont pas comparés — les
 * deux supports ont le droit de différer là-dessus.
 */
export function faitsDuRapport(dossier: Dossier): Fait[] {
  const faits: Fait[] = []
  const ajouter = (rubrique: string, texte: string) => {
    if (texte.trim().length > 0) faits.push({ rubrique, texte: texte.trim() })
  }

  // Le nombre de contrôles, dérivé — jamais recopié.
  ajouter('synthèse', String(NOMBRE_CONTROLES))
  ajouter('synthèse', synthetiser(dossier).phrase)

  for (const piece of dossier.perimetre.piecesRecues) ajouter('périmètre — pièce reçue', piece)
  for (const piece of dossier.perimetre.piecesManquantes) {
    ajouter('périmètre — pièce manquante', piece)
  }
  for (const hypothese of dossier.perimetre.hypotheses) ajouter('périmètre — hypothèse', hypothese)

  for (const rapprochement of dossier.analyse?.rapprochements ?? []) {
    ajouter('rapprochement', rapprochement.libelle)
    ajouter('rapprochement — niveau', LIBELLE_PREUVE[rapprochement.niveau])
    if (rapprochement.chiffrage !== null) {
      ajouter('rapprochement — chiffrage', rapprochement.chiffrage)
    }
  }

  for (const incoherence of dossier.analyse?.incoherences ?? []) {
    ajouter('cohérence', incoherence.titre)
    ajouter('cohérence — référence', incoherence.regleId)
  }

  for (const ligne of preconisations(dossier)) {
    ajouter('préconisation', ligne.controle.id)
    ajouter('préconisation — titre', ligne.controle.titre)
  }

  // La matrice porte chaque contrôle : c'est la règle du §5.2, et elle doit se
  // vérifier sur le papier comme à l'écran.
  for (const ligne of resultatsAffiches(dossier)) ajouter('matrice', ligne.controle.id)

  for (const observation of dossier.observations) ajouter('observation', observation.titre)

  ajouter('suivi', formulerProchaineAction(dossier.suivi))
  ajouter('mention', MENTION_LIMITE)

  return faits
}
