'use client'

import { useState } from 'react'

import {
  JALONS,
  calendrier,
  enFrancais,
  formulerProchaineAction,
  prochaineAction,
  type Dossier,
  type IdJalon,
  type Suivi as SuiviDossier,
} from '@/domain/dossier'
import { remettreFichier } from '@/lib/telechargement'

import styles from '../dossier.module.css'

/**
 * Suivi d'attestation et calendrier de relance (brief §7, lot L5).
 *
 * Obtenir une attestation conforme n'est pas un evenement, c'est une relance.
 * Les cinq jalons se comptent depuis la date d'envoi de la demande — lue du
 * courriel importe quand elle l'est, saisie a la main sinon. Sans elle, aucun
 * calendrier n'est affiche : une relance calculee sur une date fausse est pire
 * qu'une relance non calculee.
 *
 * Le praticien coche ce qu'il a REELLEMENT envoye. Clauzy ne suppose jamais
 * qu'une relance a ete faite parce que sa date est passee.
 */
export type SuiviProps = {
  readonly dossier: Dossier
  readonly onSuivi: (suivi: Partial<SuiviDossier>) => void
  readonly onBasculer: (jalon: IdJalon) => void
}

/** Une date ISO en valeur d'input[type=date], et retour. */
const enJour = (iso: string | null): string => (iso === null ? '' : iso.slice(0, 10))
const depuisJour = (jour: string): string | null =>
  jour.length === 0 ? null : new Date(`${jour}T09:00:00.000Z`).toISOString()

export function Suivi({ dossier, onSuivi, onBasculer }: SuiviProps) {
  const [erreur, setErreur] = useState<string | null>(null)
  const [dernier, setDernier] = useState<string | null>(null)

  const suivi = dossier.suivi
  const entrees = calendrier(suivi)
  const prochaine = prochaineAction(suivi)

  const exporterIcs = async () => {
    setErreur(null)
    setDernier(null)
    try {
      const { exporterCalendrier } = await import('@/lib/export/ics')
      const calendrierIcs = exporterCalendrier(suivi, {
        reference: dossier.reference,
        client: dossier.client.raisonSociale,
        destinataire: suivi.destinataire,
      })

      if (calendrierIcs.nombreJalons === 0) {
        setErreur(
          'Il n’y a rien à poser dans un agenda : renseignez la date d’envoi, ou le suivi est ' +
            'déjà clos.',
        )
        return
      }

      const remise = await remettreFichier(
        calendrierIcs.nomFichier,
        new Blob([calendrierIcs.contenu], { type: 'text/calendar' }),
      )

      if (remise.etat === 'impossible') setErreur(remise.message)
      else if (remise.etat === 'enregistre') {
        setDernier(
          `${calendrierIcs.nombreJalons} rappel${calendrierIcs.nombreJalons > 1 ? 's' : ''} ` +
            `à ouvrir dans votre agenda.`,
        )
      }
    } catch (cause) {
      setErreur(
        cause instanceof Error
          ? cause.message
          : 'Le calendrier n’a pas pu être produit. Réessayez.',
      )
    }
  }

  return (
    <section className={styles.carte} aria-labelledby="titre-suivi">
      <h2 id="titre-suivi">
        Suivi d’attestation
        <span className={styles.compteur}>{JALONS.length} jalons</span>
      </h2>

      {suivi.envoyeLe !== null && prochaine !== null && (
        <p
          className={`${styles.prochaineAction} ${
            prochaine.etat === 'EN_RETARD' ? styles.prochaineActionRetard : ''
          }`}
        >
          <span className={styles.prochaineActionLibelle}>Prochaine action</span>
          <span>{formulerProchaineAction(suivi)}</span>
        </p>
      )}

      <div className={styles.editeur}>
        <div className={styles.rangee}>
          <div style={{ flex: 1, minWidth: '9rem' }}>
            <label className={styles.champLabel} htmlFor="suivi-envoi">
              Demande envoyée le
            </label>
            <input
              id="suivi-envoi"
              type="date"
              className={styles.champ}
              value={enJour(suivi.envoyeLe)}
              onChange={(e) => onSuivi({ envoyeLe: depuisJour(e.target.value) })}
            />
          </div>
          <div style={{ flex: 1, minWidth: '9rem' }}>
            <label className={styles.champLabel} htmlFor="suivi-recu">
              Attestation reçue le
            </label>
            <input
              id="suivi-recu"
              type="date"
              className={styles.champ}
              value={enJour(suivi.recuLe)}
              onChange={(e) => onSuivi({ recuLe: depuisJour(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className={styles.champLabel} htmlFor="suivi-destinataire">
            Destinataire de la demande
          </label>
          <input
            id="suivi-destinataire"
            className={styles.champ}
            value={suivi.destinataire}
            placeholder="Compagnie ou courtier"
            onChange={(e) => onSuivi({ destinataire: e.target.value })}
          />
        </div>

        {suivi.envoyeLe === null ? (
          <p className={styles.vide}>
            Renseignez la date d’envoi de la demande : les cinq jalons s’en déduisent. Elle est
            reprise automatiquement d’un courriel Outlook importé, quand elle y est lisible.
          </p>
        ) : (
          <ul className={styles.jalons}>
            {entrees.map((entree) => (
              <li
                key={entree.jalon.id}
                className={[
                  styles.jalon,
                  entree.etat === 'FAIT' ? styles.jalonFait : '',
                  entree.etat === 'EN_RETARD' ? styles.jalonRetard : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <button
                  type="button"
                  className={styles.jalonPastille}
                  aria-pressed={entree.etat === 'FAIT'}
                  aria-label={`Marquer « ${entree.jalon.libelle} » comme fait`}
                  onClick={() => onBasculer(entree.jalon.id)}
                >
                  {entree.etat === 'FAIT' ? '✓' : ''}
                </button>
                <span className={styles.jalonLibelle}>
                  {entree.jalon.libelle}
                  <span className={styles.jalonAction}>{entree.jalon.action}</span>
                </span>
                <span className={styles.jalonDate}>{enFrancais(entree.echeance)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.rangee}>
          <button type="button" className={styles.bouton} onClick={() => void exporterIcs()}>
            Poser les rappels dans mon agenda
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
