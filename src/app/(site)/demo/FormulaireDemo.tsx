'use client'

import { useId, useState } from 'react'

import { appelApi } from '@/lib/net'

import styles from '../site.module.css'
import propres from '../accueil.module.css'

/**
 * Demande de demonstration (brief §9) — la seconde entree de conversion.
 *
 * Aucun champ de texte libre, et c'est une decision, pas un oubli : le §2
 * n'autorise a sortir que l'identite, l'organisation, l'abonnement, les quotas,
 * les metadonnees de dossier saisies a la main et des statistiques anonymes.
 * Un message libre n'entre dans aucune de ces cases — et un formulaire de
 * contact est exactement l'endroit ou quelqu'un collerait un extrait de bail.
 *
 * Le besoin se choisit donc dans une enumeration fermee, que la couche reseau
 * verifie, et le detail se dit de vive voix.
 */
const BESOINS = [
  { valeur: 'DECOUVERTE', libelle: 'Découvrir l’outil' },
  { valeur: 'EQUIPE', libelle: 'Équiper une équipe' },
  { valeur: 'REFERENTIEL_SUR_MESURE', libelle: 'Ajouter nos propres contrôles' },
  { valeur: 'SECURITE_ET_DPA', libelle: 'Revue de sécurité et DPA' },
  { valeur: 'INTEGRATION', libelle: 'Intégration à nos outils' },
] as const

const TAILLES = ['1', '2-5', '6-20', '21-100', '100+'] as const

type Etat = 'saisie' | 'envoi' | 'envoye' | 'erreur'

export function FormulaireDemo() {
  const ids = {
    nom: useId(),
    email: useId(),
    organisation: useId(),
    taille: useId(),
    besoin: useId(),
  }

  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [tailleEquipe, setTailleEquipe] = useState<string>('2-5')
  const [besoin, setBesoin] = useState<string>('DECOUVERTE')
  const [etat, setEtat] = useState<Etat>('saisie')

  const envoyer = async (evenement: React.FormEvent) => {
    evenement.preventDefault()
    setEtat('envoi')
    try {
      await appelApi('contact.demo', {
        email,
        ...(nom === '' ? {} : { nom }),
        ...(organisation === '' ? {} : { organisation }),
        tailleEquipe,
        besoin,
      })
      setEtat('envoye')
    } catch {
      setEtat('erreur')
    }
  }

  if (etat === 'envoye') {
    return (
      <div className={styles.encadre}>
        <h2>Demande enregistrée</h2>
        <p>
          Nous revenons vers <strong>{email}</strong> sous un jour ouvré, avec deux créneaux. En
          attendant, le dossier d’exemple donne une idée assez juste de ce que vous verrez.
        </p>
        <p>
          <a href="/dossier">Ouvrir le poste de travail</a>
        </p>
      </div>
    )
  }

  return (
    <>
      <form className={propres.formulaire} onSubmit={envoyer}>
        <div className={propres.champ}>
          <label htmlFor={ids.nom}>Nom</label>
          <input
            id={ids.nom}
            type="text"
            autoComplete="name"
            maxLength={120}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </div>

        <div className={propres.champ}>
          <label htmlFor={ids.email}>Adresse professionnelle</label>
          <input
            id={ids.email}
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
          <label htmlFor={ids.organisation}>Cabinet ou entreprise</label>
          <input
            id={ids.organisation}
            type="text"
            autoComplete="organization"
            maxLength={160}
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
          />
        </div>

        <div className={propres.champ}>
          <label htmlFor={ids.taille}>Personnes concernées</label>
          <select
            id={ids.taille}
            value={tailleEquipe}
            onChange={(e) => setTailleEquipe(e.target.value)}
          >
            {TAILLES.map((taille) => (
              <option key={taille} value={taille}>
                {taille}
              </option>
            ))}
          </select>
        </div>

        <div className={propres.champ}>
          <label htmlFor={ids.besoin}>Ce que vous voulez voir</label>
          <select id={ids.besoin} value={besoin} onChange={(e) => setBesoin(e.target.value)}>
            {BESOINS.map((entree) => (
              <option key={entree.valeur} value={entree.valeur}>
                {entree.libelle}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className={styles.boutonPrimaire} disabled={etat === 'envoi'}>
          {etat === 'envoi' ? 'Envoi…' : 'Demander un créneau'}
        </button>
      </form>

      {etat === 'erreur' && (
        <p className={propres.erreur} role="alert">
          L’envoi n’a pas abouti. Réessayez dans un instant. Si le problème persiste, le dossier
          d’exemple montre l’essentiel sans attendre de créneau.
        </p>
      )}

      <p className={propres.mentionFormulaire}>
        Ce formulaire ne comporte volontairement aucun champ de message libre : la couche réseau du
        produit n’accepte que des métadonnées, et un champ libre serait exactement l’endroit où un
        extrait de bail finirait par être collé. Le détail se dit de vive voix.
      </p>
    </>
  )
}
