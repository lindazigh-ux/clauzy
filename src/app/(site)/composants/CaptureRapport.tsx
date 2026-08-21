'use client'

import { useId, useState } from 'react'

import { appelApi } from '@/lib/net'

import styles from '../site.module.css'
import propres from '../accueil.module.css'

/**
 * Capture d'email contre un rapport d'exemple (brief §9).
 *
 * Le rapport promis porte sur un bail SYNTHETIQUE. Ce n'est pas un detail de
 * formulation : le §5.4 interdit d'utiliser un document client reel comme
 * donnee de test ou de demonstration, sous quelque forme que ce soit, y compris
 * anonymise.
 *
 * L'appel passe par la couche reseau, qui n'accepte que les deux champs
 * declares au catalogue. Le formulaire ne PEUT pas faire fuir autre chose,
 * meme si quelqu'un ajoutait un champ a la legere.
 */
type Etat = 'saisie' | 'envoi' | 'envoye' | 'erreur'

export function CaptureRapport() {
  const idEmail = useId()
  const idOrganisation = useId()
  const [email, setEmail] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [etat, setEtat] = useState<Etat>('saisie')
  const [message, setMessage] = useState('')

  const envoyer = async (evenement: React.FormEvent) => {
    evenement.preventDefault()
    setEtat('envoi')
    try {
      await appelApi('contact.rapportExemple', {
        email,
        ...(organisation === '' ? {} : { organisation }),
      })
      setEtat('envoye')
    } catch {
      setEtat('erreur')
      setMessage(
        'L’envoi n’a pas abouti. Réessayez dans un instant, ou ouvrez directement le dossier ' +
          'd’exemple : il produit le même rapport, tout de suite.',
      )
    }
  }

  if (etat === 'envoye') {
    return (
      <section className={propres.capture}>
        <h2>C’est noté</h2>
        <p>
          Le rapport d’exemple part à <strong>{email}</strong>. Il porte sur un bail synthétique —
          nous n’utilisons jamais le document d’un client, même anonymisé.
        </p>
      </section>
    )
  }

  return (
    <section className={propres.capture}>
      <span className={styles.surtitre}>Voir avant de décider</span>
      <h2>Recevoir un rapport d’exemple</h2>
      <p>
        Le livrable complet — synthèse, matrice des {40} contrôles, rédactions de remplacement,
        périmètre et limites — sur un bail synthétique représentatif. Deux pièces jointes : la note
        Word annotée et le rapport client PDF.
      </p>

      <form className={propres.formulaire} onSubmit={envoyer}>
        <div className={propres.champ}>
          <label htmlFor={idEmail}>Adresse professionnelle</label>
          <input
            id={idEmail}
            type="email"
            required
            autoComplete="email"
            maxLength={320}
            placeholder="prenom.nom@cabinet.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className={propres.champ}>
          <label htmlFor={idOrganisation}>Cabinet ou entreprise (facultatif)</label>
          <input
            id={idOrganisation}
            type="text"
            autoComplete="organization"
            maxLength={160}
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
          />
        </div>
        <button type="submit" className={styles.boutonPrimaire} disabled={etat === 'envoi'}>
          {etat === 'envoi' ? 'Envoi…' : 'Recevoir le rapport'}
        </button>
      </form>

      {etat === 'erreur' && (
        <p className={propres.erreur} role="alert">
          {message}
        </p>
      )}

      <p className={propres.mentionFormulaire}>
        Nous ne transmettons que ce que vous saisissez ici. Aucun document, aucun nom de client,
        aucun nom de fichier — la couche réseau du produit refuse ces champs, et son catalogue est
        publié.
      </p>
    </section>
  )
}
