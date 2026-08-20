/**
 * Remise d'un fichier au praticien.
 *
 * Deux mondes, un seul appel :
 *
 *   - dans l'APPLICATION, le fichier est remis par un lien de telechargement
 *     ordinaire, comme n'importe quel export ;
 *   - dans la DEMONSTRATION publiee, le visualiseur ne laisse pas une page
 *     declencher un telechargement : il faut passer par sa propre passerelle,
 *     qui demande confirmation au lecteur.
 *
 * Rien n'est televerse dans un cas comme dans l'autre : le fichier est
 * construit dans le navigateur et n'en sort pas (§2).
 */

export type ResultatRemise =
  | { readonly etat: 'enregistre'; readonly nom: string }
  | { readonly etat: 'refuse' }
  | { readonly etat: 'impossible'; readonly message: string }

type PasserelleTelechargement = {
  save: (requete: { filename: string; data: Blob }) => Promise<unknown>
}

type HoteClaude = {
  use?: (nom: string) => Promise<PasserelleTelechargement | null>
}

const hote = (): HoteClaude | undefined =>
  (globalThis as { claude?: HoteClaude }).claude

const codeDErreur = (cause: unknown): string =>
  typeof cause === 'object' && cause !== null && 'code' in cause
    ? String((cause as { code: unknown }).code)
    : ''

/**
 * L'extension decide de ce que le visualiseur accepte.
 *
 * `.clauzy` n'est dans aucune liste, alors que le fichier EST du JSON : on lui
 * ajoute `.json` plutot que de refuser la sauvegarde. Le dossier se rouvre
 * ensuite sans difficulte — la lecture regarde le contenu, pas le nom.
 */
const nomDeRepli = (nom: string): string | null => (nom.endsWith('.clauzy') ? `${nom}.json` : null)

const remettreParLien = (nom: string, donnees: Blob): ResultatRemise => {
  const lien = document.createElement('a')
  const url = URL.createObjectURL(donnees)
  lien.href = url
  lien.download = nom
  lien.click()
  URL.revokeObjectURL(url)
  return { etat: 'enregistre', nom }
}

export async function remettreFichier(nom: string, donnees: Blob): Promise<ResultatRemise> {
  const passerelle = await hote()?.use?.('downloads')

  if (passerelle === undefined) return remettreParLien(nom, donnees)

  if (passerelle === null) {
    return {
      etat: 'impossible',
      message:
        'Ce visualiseur n’autorise pas l’enregistrement de fichiers. Ouvrez la démonstration ' +
        'depuis un fichier local, ou lancez l’application complète.',
    }
  }

  const essayer = async (candidat: string): Promise<ResultatRemise> => {
    try {
      await passerelle.save({ filename: candidat, data: donnees })
      return { etat: 'enregistre', nom: candidat }
    } catch (cause) {
      const code = codeDErreur(cause)

      if (code === 'declined') return { etat: 'refuse' }

      if (code === 'rejected_extension' || code === 'extension_not_enabled') {
        const repli = nomDeRepli(candidat)
        if (repli !== null) return essayer(repli)
        return {
          etat: 'impossible',
          message:
            'Ce visualiseur n’autorise pas l’enregistrement de fichiers Word. Imprimez la note ' +
            'en PDF, ou lancez l’application complète pour obtenir la version annotée.',
        }
      }

      if (code === 'too_large') {
        return {
          etat: 'impossible',
          message: 'Le fichier dépasse la taille que ce visualiseur accepte (16 Mo).',
        }
      }

      if (code === 'rate_limited') {
        return {
          etat: 'impossible',
          message: 'Une demande d’enregistrement est déjà ouverte. Terminez-la, puis réessayez.',
        }
      }

      return {
        etat: 'impossible',
        message:
          'L’enregistrement n’a pas abouti. Réessayez, ou lancez l’application complète pour ' +
          'exporter le dossier.',
      }
    }
  }

  return essayer(nom)
}
