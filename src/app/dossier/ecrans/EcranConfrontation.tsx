'use client'

import { useState } from 'react'

import { INTERLOCUTEUR, LIBELLE_ACTION, StatutAffiche } from '@/domain/garanties/axes'
import { NiveauPreuve } from '@/domain/garanties/types'
import type { Rapprochement } from '@/domain/moteur/rapprochement'
import type { Dossier } from '@/domain/dossier'

import styles from '../atelier.module.css'
import { Badge, classeDe } from './statuts'
import { aTraiter } from './EcranSynthese'

/**
 * Bail × Assurance — l'écran le plus important (§17-39).
 *
 * Il montre la CHAÎNE, parce que c'est elle la proposition de valeur :
 *
 *     ce que le bail exige → ce que le contrat porte → ce qu’il en résulte
 *
 * Un tableau à trois colonnes dirait la même chose et ne montrerait rien : la
 * force du rapprochement, c'est de voir que « assurer les locaux loués contre
 * l'incendie » et « responsabilité locative : 1 500 000 € » sont la même
 * garantie, écrite dans deux langues. Les mettre côte à côte, c'est le
 * démontrer.
 *
 * L'écart chiffré est ce qui se lit en premier : c'est lui qui hiérarchise, et
 * lui seul porte le rouge.
 */

type Filtre = 'A_TRAITER' | 'TOUT'

function Confrontation({ rapprochement }: { readonly rapprochement: Rapprochement }) {
  const [ouvert, setOuvert] = useState(false)
  const interlocuteur = INTERLOCUTEUR[rapprochement.recommandation.action]

  return (
    <li className={`${styles.confrontation} ${classeDe('carte', rapprochement.statut)}`}>
      <div className={styles.carteTete}>
        <h3 className={styles.carteTitre}>{rapprochement.libelle}</h3>
        <div className={styles.actions}>
          {rapprochement.chiffrage !== null && (
            <span className={styles.chiffre}>{rapprochement.chiffrage}</span>
          )}
          <Badge statut={rapprochement.statut} />
        </div>
      </div>

      <div className={styles.chaine}>
        <div className={styles.maillon}>
          <span className={styles.maillonNom}>Ce que le bail exige</span>
          <span className={`${styles.maillonTexte} ${styles.citation}`}>
            {rapprochement.exigence === null
              ? '—'
              : `« ${rapprochement.exigence.stipulation.texte} »`}
          </span>
        </div>

        <div className={styles.maillon}>
          <span className={styles.maillonNom}>Ce que le contrat porte</span>
          <span
            className={`${styles.maillonTexte} ${
              rapprochement.couverture === null ? styles.rien : styles.citation
            }`}
          >
            {rapprochement.couverture === null
              ? 'rien de correspondant'
              : `« ${rapprochement.couverture.stipulation.texte} »`}
          </span>
        </div>

        <div className={styles.maillon}>
          <span className={styles.maillonNom}>Sur l’attestation</span>
          <span
            className={`${styles.maillonTexte} ${
              rapprochement.attestation === null ? styles.rien : styles.citation
            }`}
          >
            {rapprochement.attestation === null
              ? 'non mentionnée'
              : `« ${rapprochement.attestation.stipulation.texte} »`}
          </span>
        </div>
      </div>

      <p className={styles.conclusion}>{rapprochement.conclusion}</p>

      {rapprochement.statut !== StatutAffiche.CONFORME && (
        <>
          <button type="button" className={styles.plier} onClick={() => setOuvert(!ouvert)}>
            {ouvert ? 'Masquer le geste' : 'Que faire ?'}
          </button>
          {ouvert && (
            <p className={styles.geste}>
              <span className={styles.gesteCode}>
                {LIBELLE_ACTION[rapprochement.recommandation.action]}
                {interlocuteur !== null && (
                  <span className={styles.aupresDe}> · {interlocuteur}</span>
                )}
              </span>
              {rapprochement.recommandation.phrase}
            </p>
          )}
        </>
      )}
    </li>
  )
}

export function EcranConfrontation({
  dossier,
  onPieces,
}: {
  readonly dossier: Dossier
  readonly onPieces: () => void
}) {
  const [filtre, setFiltre] = useState<Filtre>('A_TRAITER')
  const rapprochements = dossier.analyse?.rapprochements ?? []
  const contratFourni = dossier.documents.some((d) => d.role === 'COUVERTURE')

  if (rapprochements.length === 0) {
    return (
      <div className={styles.vide}>
        <p className={styles.videTitre}>Rien à confronter</p>
        <p className={styles.videTexte}>
          Cet écran met en regard chaque obligation du bail et ce que les pièces d’assurance en
          portent. Il lui faut au moins un bail analysé.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.boutonPrimaire} onClick={onPieces}>
            Déposer des pièces
          </button>
        </div>
      </div>
    )
  }

  const liste = filtre === 'TOUT' ? rapprochements : aTraiter(dossier)
  const couvertes = rapprochements.filter((r) => r.niveau === NiveauPreuve.ETABLIE).length

  return (
    <>
      {!contratFourni && (
        <p className={styles.alerte}>
          Aucune condition particulière n’a été produite. Ce que vous lisez ci-dessous dit ce que le
          bail exige, jamais ce qui manque : sans police, aucune absence de couverture ne peut être
          établie.
        </p>
      )}

      <div className={styles.selecteur}>
        <button
          type="button"
          className={`${styles.pastille} ${filtre === 'A_TRAITER' ? styles.pastilleActive : ''}`}
          onClick={() => setFiltre('A_TRAITER')}
        >
          À traiter ({rapprochements.length - couvertes})
        </button>
        <button
          type="button"
          className={`${styles.pastille} ${filtre === 'TOUT' ? styles.pastilleActive : ''}`}
          onClick={() => setFiltre('TOUT')}
        >
          Toutes les obligations ({rapprochements.length})
        </button>
      </div>

      {liste.length === 0 ? (
        <div className={styles.vide}>
          <p className={styles.videTitre}>Rien à traiter</p>
          <p className={styles.videTexte}>
            Les {rapprochements.length} obligations lues dans le bail sont couvertes par les pièces
            produites.
          </p>
        </div>
      ) : (
        <ul className={styles.confrontations}>
          {liste.map((rapprochement) => (
            <Confrontation key={rapprochement.garantieId} rapprochement={rapprochement} />
          ))}
        </ul>
      )}
    </>
  )
}
