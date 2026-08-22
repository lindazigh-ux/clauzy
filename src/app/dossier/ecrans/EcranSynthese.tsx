'use client'

import { useState } from 'react'

import { NiveauPreuve } from '@/domain/garanties/types'
import {
  INTERLOCUTEUR,
  LIBELLE_ACTION,
  StatutAffiche,
} from '@/domain/garanties/axes'
import type { Rapprochement } from '@/domain/moteur/rapprochement'
import { recit, type Dossier } from '@/domain/dossier'

import styles from '../atelier.module.css'
import { Badge, classeDe } from './statuts'

/**
 * L'écran d'accueil — « qu'est-ce que je dois faire maintenant ? » (§43).
 *
 * Ce n'est pas un tableau de bord. Un tableau de bord montre tout ; celui-ci
 * montre CINQ points, et cache le reste derrière un lien. Le moteur gère
 * quarante-cinq contrôles ; le courtier ne doit jamais avoir l'impression d'en
 * gérer quarante-cinq.
 *
 * Trois niveaux, dans l'ordre où l'œil descend :
 *   1. le récit — trois phrases, dix secondes ;
 *   2. quatre indicateurs — l'état du dossier, pas l'activité de l'outil ;
 *   3. les cartes à traiter — problème, impact, geste, et le raisonnement
 *      replié.
 */

/** Ce qui appelle une action, dans l'ordre où un courtier le traiterait. */
export const aTraiter = (dossier: Dossier): readonly Rapprochement[] => {
  const rang: Record<StatutAffiche, number> = {
    [StatutAffiche.CRITIQUE]: 0,
    [StatutAffiche.A_NEGOCIER]: 1,
    [StatutAffiche.A_VERIFIER]: 2,
    [StatutAffiche.INFORMATION]: 3,
    [StatutAffiche.CONFORME]: 4,
  }
  return [...(dossier.analyse?.rapprochements ?? [])]
    .filter((r) => r.statut !== StatutAffiche.CONFORME)
    .sort((a, b) => {
      const ordre = rang[a.statut] - rang[b.statut]
      if (ordre !== 0) return ordre
      // À statut égal, l'écart chiffré passe devant : un directeur immobilier
      // réagit à un euro, pas à une catégorie.
      return Number(b.chiffrage !== null) - Number(a.chiffrage !== null)
    })
}

const PREMIERES = 5

function Indicateur({
  valeur,
  nom,
  note,
  alerte = false,
}: {
  readonly valeur: number
  readonly nom: string
  readonly note?: string
  readonly alerte?: boolean
}) {
  const classe =
    valeur === 0 ? styles.indicateurVide : alerte ? styles.indicateurAlerte : ''
  return (
    <div className={`${styles.indicateur} ${classe}`}>
      <span className={styles.indicateurValeur}>{valeur}</span>
      <span className={styles.indicateurNom}>{nom}</span>
      {note !== undefined && <span className={styles.indicateurNote}>{note}</span>}
    </div>
  )
}

function CarteAction({ rapprochement }: { readonly rapprochement: Rapprochement }) {
  const [ouvert, setOuvert] = useState(false)
  const interlocuteur = INTERLOCUTEUR[rapprochement.recommandation.action]

  return (
    <li className={`${styles.carte} ${classeDe('carte', rapprochement.statut)}`}>
      <div className={styles.carteTete}>
        <h3 className={styles.carteTitre}>{rapprochement.libelle}</h3>
        <div className={styles.actions}>
          {rapprochement.chiffrage !== null && (
            <span className={styles.chiffre}>{rapprochement.chiffrage}</span>
          )}
          <Badge statut={rapprochement.statut} />
        </div>
      </div>

      <p className={styles.impact}>{rapprochement.conclusion}</p>

      <p className={styles.geste}>
        <span className={styles.gesteCode}>
          {LIBELLE_ACTION[rapprochement.recommandation.action]}
          {interlocuteur !== null && <span className={styles.aupresDe}> · {interlocuteur}</span>}
        </span>
        {rapprochement.recommandation.phrase}
      </p>

      <button type="button" className={styles.plier} onClick={() => setOuvert(!ouvert)}>
        {ouvert ? 'Masquer le raisonnement' : 'Voir le raisonnement'}
      </button>

      {ouvert && (
        <div className={styles.raisonnement}>
          <div className={styles.raisonnementLigne}>
            <span className={styles.raisonnementNom}>Ce que le bail exige</span>
            <span className={styles.citation}>
              {rapprochement.exigence === null
                ? '—'
                : `« ${rapprochement.exigence.stipulation.texte} »`}
            </span>
          </div>
          <div className={styles.raisonnementLigne}>
            <span className={styles.raisonnementNom}>Ce que le contrat porte</span>
            <span
              className={rapprochement.couverture === null ? styles.rien : styles.citation}
            >
              {rapprochement.couverture === null
                ? 'rien de correspondant'
                : `« ${rapprochement.couverture.stipulation.texte} »`}
            </span>
          </div>
          <div className={styles.raisonnementLigne}>
            <span className={styles.raisonnementNom}>Sur l’attestation</span>
            <span
              className={rapprochement.attestation === null ? styles.rien : styles.citation}
            >
              {rapprochement.attestation === null
                ? 'non mentionnée'
                : `« ${rapprochement.attestation.stipulation.texte} »`}
            </span>
          </div>
        </div>
      )}
    </li>
  )
}

export function EcranSynthese({
  dossier,
  analyseEnCours,
  onAnalyser,
  onPieces,
  onTout,
}: {
  readonly dossier: Dossier
  readonly analyseEnCours: boolean
  readonly onAnalyser: () => void
  readonly onPieces: () => void
  readonly onTout: () => void
}) {
  const histoire = recit(dossier)
  const rapprochements = dossier.analyse?.rapprochements ?? []
  const liste = aTraiter(dossier)
  const couvertes = rapprochements.filter((r) => r.niveau === NiveauPreuve.ETABLIE).length
  const critiques = liste.filter((r) => r.statut === StatutAffiche.CRITIQUE).length
  const aNegocier = liste.filter((r) => r.statut === StatutAffiche.A_NEGOCIER).length
  const aVerifier = liste.filter((r) => r.statut === StatutAffiche.A_VERIFIER).length

  if (histoire.invitation !== null) {
    return (
      <div className={styles.vide}>
        <p className={styles.videTitre}>
          {dossier.documents.length === 0 ? 'Dossier vide' : 'Pièces en attente d’analyse'}
        </p>
        <p className={styles.videTexte}>{histoire.invitation}</p>
        <div className={styles.actions}>
          {dossier.documents.length === 0 ? (
            <button type="button" className={styles.boutonPrimaire} onClick={onPieces}>
              Déposer des pièces
            </button>
          ) : (
            <button
              type="button"
              className={styles.boutonPrimaire}
              onClick={onAnalyser}
              disabled={analyseEnCours}
            >
              {analyseEnCours ? 'Analyse en cours…' : 'Analyser les pièces'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.recit}>
        {histoire.phrases.map((phrase) => (
          <p key={phrase}>{phrase}</p>
        ))}
      </div>

      <div className={styles.indicateurs}>
        <Indicateur
          valeur={critiques}
          nom="Critique"
          note="expose le preneur"
          alerte
        />
        <Indicateur valeur={aNegocier} nom="À négocier" note="avec le bailleur" />
        <Indicateur valeur={aVerifier} nom="À vérifier" note="sur pièces" />
        <Indicateur valeur={couvertes} nom="Couvertes" note="rien à faire" />
      </div>

      {liste.length === 0 ? (
        <div className={styles.vide}>
          <p className={styles.videTitre}>Rien à traiter</p>
          <p className={styles.videTexte}>
            Chaque obligation lue dans le bail est couverte par les pièces produites. Le dossier
            peut être livré.
          </p>
        </div>
      ) : (
        <>
          <h2 className={styles.titreBloc}>À traiter en priorité</h2>
          <ul className={styles.cartes}>
            {liste.slice(0, PREMIERES).map((rapprochement) => (
              <CarteAction key={rapprochement.garantieId} rapprochement={rapprochement} />
            ))}
          </ul>
          {liste.length > PREMIERES && (
            <p className={styles.reste}>
              {liste.length - PREMIERES} autre{liste.length - PREMIERES > 1 ? 's' : ''} point
              {liste.length - PREMIERES > 1 ? 's' : ''} à traiter.{' '}
              <button type="button" className={styles.plier} onClick={onTout}>
                Voir la confrontation complète
              </button>
            </p>
          )}
        </>
      )}
    </>
  )
}
