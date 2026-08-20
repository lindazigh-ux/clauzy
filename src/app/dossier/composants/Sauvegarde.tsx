'use client'

import { useRef, useState } from 'react'

import {
  EXTENSION,
  deserialiser,
  estChiffre,
  nomFichier,
  serialiser,
  type Dossier,
} from '@/domain/dossier'
import { remettreFichier } from '@/lib/telechargement'

import styles from '../dossier.module.css'

/**
 * Sauvegarde et rechargement du dossier (brief §4, lot L3).
 *
 * Le fichier est ecrit et relu entierement dans le navigateur, puis telecharge
 * sur le poste du praticien. Rien ne part sur le serveur — il n'existe aucun
 * chemin de code pour cela.
 *
 * Le mot de passe est FACULTATIF a dessein : un dossier range dans un espace de
 * travail deja chiffre n'en a pas besoin, et un mot de passe oublie ferait
 * perdre deux heures de travail, ce qui serait pire que le risque couvert.
 */
export type SauvegardeProps = {
  readonly dossier: Dossier
  readonly enregistreLe: string | null
  readonly onEnregistre: () => void
  readonly onCharger: (dossier: Dossier) => void
}

const heure = (iso: string): string =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function Sauvegarde({ dossier, enregistreLe, onEnregistre, onCharger }: SauvegardeProps) {
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const entree = useRef<HTMLInputElement>(null)

  const modifie = enregistreLe === null || dossier.majLe > enregistreLe

  const enregistrer = async () => {
    setEnCours(true)
    setErreur(null)
    try {
      const contenu = await serialiser(dossier, motDePasse.length > 0 ? motDePasse : undefined)
      const remise = await remettreFichier(
        nomFichier(dossier),
        new Blob([contenu], { type: 'application/json' }),
      )

      if (remise.etat === 'enregistre') onEnregistre()
      else if (remise.etat === 'impossible') setErreur(remise.message)
    } catch (cause) {
      setErreur(
        cause instanceof Error
          ? cause.message
          : 'Le dossier n’a pas pu être enregistré. Réessayez, ou copiez votre analyse ailleurs.',
      )
    } finally {
      setEnCours(false)
    }
  }

  const ouvrir = async (fichier: File) => {
    setEnCours(true)
    setErreur(null)
    try {
      const contenu = await fichier.text()
      if (estChiffre(contenu) && motDePasse.length === 0) {
        setErreur(
          'Ce dossier est protégé par un mot de passe. Saisissez-le ci-dessus, puis rouvrez le ' +
            'fichier.',
        )
        return
      }
      onCharger(await deserialiser(contenu, motDePasse.length > 0 ? motDePasse : undefined))
    } catch (cause) {
      setErreur(
        cause instanceof Error
          ? cause.message
          : 'Ce fichier n’a pas pu être ouvert. Vérifiez qu’il s’agit bien d’un dossier Clauzy.',
      )
    } finally {
      setEnCours(false)
    }
  }

  return (
    <section className={styles.carte} aria-labelledby="titre-sauvegarde">
      <h2 id="titre-sauvegarde">
        Sauvegarde
        <span className={styles.compteur}>
          {modifie
            ? 'modifications non enregistrées'
            : enregistreLe === null
              ? ''
              : `enregistré à ${heure(enregistreLe)}`}
        </span>
      </h2>

      <p className={styles.vide} style={{ marginBottom: 'calc(var(--pas) * 4)' }}>
        Le fichier <code>{EXTENSION}</code> est écrit sur votre poste, jamais transmis. C’est votre
        seule sauvegarde : enregistrez avant de fermer l’onglet.
      </p>

      <div className={styles.editeur}>
        <div>
          <label className={styles.champLabel} htmlFor="mot-de-passe">
            Mot de passe — facultatif, pour chiffrer le fichier
          </label>
          <input
            id="mot-de-passe"
            type="password"
            className={styles.champ}
            value={motDePasse}
            autoComplete="off"
            placeholder="Laissez vide pour un fichier lisible tel quel"
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </div>

        <div className={styles.rangee}>
          <button
            type="button"
            className={styles.boutonPrimaire}
            onClick={() => void enregistrer()}
            disabled={enCours}
          >
            {enCours ? 'Traitement…' : 'Enregistrer le dossier'}
          </button>
          <button
            type="button"
            className={styles.bouton}
            onClick={() => entree.current?.click()}
            disabled={enCours}
          >
            Ouvrir un dossier
          </button>
          <input
            ref={entree}
            type="file"
            accept={`${EXTENSION},.json`}
            hidden
            onChange={(e) => {
              const fichier = e.target.files?.[0]
              if (fichier !== undefined) void ouvrir(fichier)
              e.target.value = ''
            }}
          />
        </div>

        {erreur !== null && (
          <p className={styles.erreur} role="alert">
            {erreur}
          </p>
        )}
      </div>
    </section>
  )
}
