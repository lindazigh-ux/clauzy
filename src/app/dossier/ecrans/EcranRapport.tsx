'use client'

import { useState } from 'react'

import { VUES } from '@/domain/rapport/vues'
import { synthetiser, type Cabinet, type Dossier, type FicheClient, type IdJalon, type Perimetre, type Suivi as SuiviDossier } from '@/domain/dossier'
import { remettreFichier } from '@/lib/telechargement'

import styles from '../atelier.module.css'
import { Repliable } from './Repliable'
import { Livrable } from '../composants/Livrable'
import { PanneauObservations, PanneauPerimetre } from '../composants/Perimetre'
import { Suivi } from '../composants/Suivi'

/**
 * Les deux livrables, et ce qui les alimente (brief §17-39, §7).
 *
 * « Deux livrables distincts : rapport courtier complet (Word) et note client
 * simplifiée (PDF). » L'ancien écran les proposait comme deux boutons voisins,
 * sans dire en quoi ils diffèrent — et le praticien envoyait au client celui
 * qui contient les traces de détection.
 *
 * Ce que chaque vue porte n'est pas décrit ici : il vient de `domain/rapport/
 * vues`, où la séparation est définie. Un écran qui réécrirait la liste la
 * ferait diverger au premier ajout.
 */
export function EcranRapport({
  dossier,
  onCabinet,
  onClient,
  onPerimetre,
  onObservation,
  onRetirerObservation,
  onSuivi,
  onBasculerJalon,
}: {
  readonly dossier: Dossier
  readonly onCabinet: (cabinet: Partial<Cabinet>) => void
  readonly onClient: (client: Partial<FicheClient>) => void
  readonly onPerimetre: (modifications: Partial<Perimetre>) => void
  readonly onObservation: (observation: { titre: string; texte: string; gravite: 1 | 2 | 3 }) => void
  readonly onRetirerObservation: (id: string) => void
  readonly onSuivi: (suivi: Partial<SuiviDossier>) => void
  readonly onBasculerJalon: (jalon: IdJalon) => void
}) {
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [dernier, setDernier] = useState<string | null>(null)
  const synthese = synthetiser(dossier)

  const exporterWord = async () => {
    setEnCours(true)
    setErreur(null)
    setDernier(null)
    try {
      // `docx` est chargé ici, et nulle part ailleurs : il n'a rien à faire
      // dans le bundle initial (§13).
      const { exporterWord: construire } = await import('@/lib/export/word')
      const rapport = await construire(dossier)
      const remise = await remettreFichier(rapport.nomFichier, rapport.donnees)
      if (remise.etat === 'impossible') {
        setErreur(remise.message)
      } else if (remise.etat === 'enregistre') {
        const n = rapport.nombreCommentaires
        setDernier(
          `Rapport exporté — ${n} commentaire${n > 1 ? 's' : ''} ancré${n > 1 ? 's' : ''} au texte du bail.`,
        )
      }
    } catch (cause) {
      setErreur(
        cause instanceof Error
          ? cause.message
          : 'Le rapport n’a pas pu être produit. Enregistrez le dossier, rechargez la page et relancez l’export.',
      )
    } finally {
      setEnCours(false)
    }
  }

  return (
    <>
      <div className={styles.livrables}>
        <section className={styles.livrable}>
          <h2 className={styles.livrableTitre}>{VUES.COURTIER.libelle}</h2>
          <p className={styles.livrableTexte}>{VUES.COURTIER.destinataire}</p>
          <ul className={styles.livrablePorte}>
            {VUES.COURTIER.porte.map((ligne) => (
              <li key={ligne}>{ligne}</li>
            ))}
          </ul>
          <button
            type="button"
            className={styles.boutonPrimaire}
            onClick={() => void exporterWord()}
            disabled={enCours}
          >
            {enCours ? 'Préparation…' : 'Exporter en Word'}
          </button>
          {dernier !== null && <p className={styles.confirmation}>{dernier}</p>}
          {erreur !== null && (
            <p className={styles.alerte} role="alert">
              {erreur}
            </p>
          )}
        </section>

        <section className={styles.livrable}>
          <h2 className={styles.livrableTitre}>{VUES.CLIENT.libelle}</h2>
          <p className={styles.livrableTexte}>{VUES.CLIENT.destinataire}</p>
          <ul className={styles.livrablePorte}>
            {VUES.CLIENT.ecarte.map((ligne) => (
              <li key={ligne}>Sans : {ligne.toLowerCase()}</li>
            ))}
          </ul>
          <button type="button" className={styles.bouton} onClick={() => window.print()}>
            Imprimer en PDF
          </button>
          <p className={styles.livrableTexte}>
            Le PDF est produit par la fonction d’impression du navigateur : rien ne part sur un
            service de conversion.
          </p>
        </section>
      </div>

      <h2 className={styles.titreBloc}>Ce qui alimente les deux</h2>
      <div className={styles.heritage}>
        <Repliable
          titre="Identité du cabinet et du client"
          note={
            dossier.cabinet.nom.trim().length === 0
              ? 'à renseigner — le rapport sort aux couleurs du cabinet'
              : dossier.cabinet.nom
          }
        >
          <Livrable dossier={dossier} onCabinet={onCabinet} onClient={onClient} />
        </Repliable>

        <Repliable
          titre="Périmètre et limites"
          note={`${dossier.perimetre.piecesRecues.length} reçue${dossier.perimetre.piecesRecues.length > 1 ? 's' : ''} · ${dossier.perimetre.piecesManquantes.length} manquante${dossier.perimetre.piecesManquantes.length > 1 ? 's' : ''} · ${dossier.perimetre.hypotheses.length} hypothèse${dossier.perimetre.hypotheses.length > 1 ? 's' : ''}`}
        >
          <PanneauPerimetre perimetre={dossier.perimetre} onChanger={onPerimetre} />
        </Repliable>

        <Repliable
          titre="Observations libres"
          note={
            dossier.observations.length === 0
              ? 'aucune — hors des contrôles du référentiel'
              : `${dossier.observations.length} observation${dossier.observations.length > 1 ? 's' : ''}`
          }
        >
          <PanneauObservations
            observations={dossier.observations}
            onAjouter={onObservation}
            onRetirer={onRetirerObservation}
          />
        </Repliable>

        <Repliable
          titre="Suivi de l’attestation"
          note={
            dossier.suivi.recuLe !== null
              ? 'attestation reçue'
              : dossier.suivi.envoyeLe === null
                ? 'aucune demande envoyée'
                : 'calendrier posé'
          }
        >
          <Suivi dossier={dossier} onSuivi={onSuivi} onBasculer={onBasculerJalon} />
        </Repliable>
      </div>

      {/*
        Le compte des contrôles a sa place ICI, et nulle part ailleurs dans
        l'interface : c'est ce que le rapport annonce, et ce qui prouve
        l'étendue du travail au client (§43).
      */}
      <p className={styles.avertissementExpert} style={{ marginTop: 'calc(var(--pas) * 8)' }}>
        Le rapport annonce : {synthese.phrase}
      </p>
    </>
  )
}
