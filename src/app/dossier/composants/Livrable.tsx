'use client'

import { useState } from 'react'

import type { Cabinet, Dossier, FicheClient } from '@/domain/dossier'
import { remettreFichier } from '@/lib/telechargement'

import styles from '../dossier.module.css'

/**
 * Le livrable (brief §7).
 *
 * C'est ce que le client achete — a soigner davantage que l'interface.
 *
 * Deux sorties : la note Word ANNOTEE, dont les commentaires sont ancres au
 * passage original du bail, et le PDF client, produit par la fonction
 * d'impression du navigateur. Aucune des deux ne passe par un service de
 * conversion : lire et ecrire un document ne doit dependre d'aucun tiers (§14).
 *
 * L'identite saisie ici est celle du CABINET : le rapport sort a ses couleurs,
 * pas a celles de Clauzy. Elle reste sur le poste, comme le reste du dossier.
 */
export type LivrableProps = {
  readonly dossier: Dossier
  readonly onCabinet: (cabinet: Partial<Cabinet>) => void
  readonly onClient: (client: Partial<FicheClient>) => void
}

export function Livrable({ dossier, onCabinet, onClient }: LivrableProps) {
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [dernier, setDernier] = useState<string | null>(null)

  const exporterWord = async () => {
    setEnCours(true)
    setErreur(null)
    try {
      // `docx` est charge ici, et nulle part ailleurs : il n'a rien a faire
      // dans le bundle initial (§13).
      const { exporterWord: construire } = await import('@/lib/export/word')
      const rapport = await construire(dossier)
      const remise = await remettreFichier(rapport.nomFichier, rapport.donnees)

      if (remise.etat === 'impossible') {
        setErreur(remise.message)
      } else if (remise.etat === 'enregistre') {
        setDernier(
          `Note exportée — ${rapport.nombreCommentaires} commentaire${
            rapport.nombreCommentaires > 1 ? 's' : ''
          } ancré${rapport.nombreCommentaires > 1 ? 's' : ''} au texte du bail.`,
        )
      }
    } catch (cause) {
      setErreur(
        cause instanceof Error
          ? cause.message
          : 'La note n’a pas pu être produite. Enregistrez le dossier, rechargez la page et ' +
            'relancez l’export.',
      )
    } finally {
      setEnCours(false)
    }
  }

  const champ = (
    id: string,
    libelle: string,
    valeur: string,
    onChanger: (valeur: string) => void,
    invitation?: string,
  ) => (
    <div>
      <label className={styles.champLabel} htmlFor={id}>
        {libelle}
      </label>
      <input
        id={id}
        className={styles.champ}
        value={valeur}
        placeholder={invitation}
        onChange={(e) => onChanger(e.target.value)}
      />
    </div>
  )

  return (
    <section className={styles.carte} aria-labelledby="titre-livrable">
      <h2 id="titre-livrable">Livrable</h2>
      <p className={styles.vide} style={{ marginBottom: 'calc(var(--pas) * 4)' }}>
        Le rapport sort aux couleurs de votre cabinet. La marque Clauzy tient en pied de page.
      </p>

      <div className={styles.editeur}>
        {champ('cabinet-nom', 'Cabinet ou direction', dossier.cabinet.nom, (nom) =>
          onCabinet({ nom }),
        )}

        <div className={styles.rangee}>
          <div style={{ flex: 1, minWidth: '10rem' }}>
            {champ('cabinet-praticien', 'Praticien', dossier.cabinet.praticien, (praticien) =>
              onCabinet({ praticien }),
            )}
          </div>
          <div style={{ flex: 1, minWidth: '10rem' }}>
            {champ(
              'cabinet-qualite',
              'Qualité',
              dossier.cabinet.qualite,
              (qualite) => onCabinet({ qualite }),
              'courtier, avocat, directrice juridique…',
            )}
          </div>
        </div>

        <div>
          <label className={styles.champLabel} htmlFor="cabinet-couleur">
            Couleur de la page de garde
          </label>
          <input
            id="cabinet-couleur"
            type="color"
            className={styles.roleSelect}
            value={`#${dossier.cabinet.couleur}`}
            onChange={(e) => onCabinet({ couleur: e.target.value.replace('#', '').toUpperCase() })}
          />
        </div>

        {champ('client-raison', 'Client', dossier.client.raisonSociale, (raisonSociale) =>
          onClient({ raisonSociale }),
        )}
        {champ('client-adresse', 'Adresse du site', dossier.client.adresse, (adresse) =>
          onClient({ adresse }),
        )}
        {champ('client-activite', 'Activité exercée', dossier.client.activite, (activite) =>
          onClient({ activite }),
        )}

        <div className={styles.rangee}>
          <button
            type="button"
            className={styles.boutonPrimaire}
            onClick={() => void exporterWord()}
            disabled={enCours}
          >
            {enCours ? 'Préparation…' : 'Exporter la note Word annotée'}
          </button>
          <button type="button" className={styles.bouton} onClick={() => window.print()}>
            Imprimer la note en PDF
          </button>
        </div>

        {dernier !== null && <p className={styles.vide}>{dernier}</p>}
        {erreur !== null && (
          <p className={styles.erreur} role="alert">
            {erreur}
          </p>
        )}
      </div>
    </section>
  )
}
