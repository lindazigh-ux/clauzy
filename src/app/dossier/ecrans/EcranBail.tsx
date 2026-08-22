'use client'

import { useMemo, useState } from 'react'

import { LIBELLE_GRAVITE, LIBELLE_ACTION, INTERLOCUTEUR } from '@/domain/garanties/axes'
import { LIBELLE_PREUVE } from '@/domain/garanties/types'
import type { Rapprochement } from '@/domain/moteur/rapprochement'
import type { Dossier } from '@/domain/dossier'
import type { DocumentImporte } from '@/lib/import'

import styles from '../atelier.module.css'
import { Badge, classeDe } from './statuts'

/**
 * Ce que le bail exige — le document à gauche, l'explication à droite (§17-39).
 *
 * L'ancien poste demandait au praticien de faire le lien lui-même : la matrice
 * d'un côté, le lecteur de document de l'autre, et à lui de retrouver la
 * clause. Ici le bail est SURLIGNÉ par statut, et cliquer sur une clause ouvre
 * son explication. C'est la lecture naturelle : on lit le bail, et l'outil
 * commente en marge.
 *
 * Le surlignage vient des offsets que le moteur porte déjà (`stipulation.debut`
 * et `fin`, ancrés au document par `moteur/ancrage`). Rien n'est recherché à
 * nouveau dans le texte : une recherche par chaîne surlignerait la mauvaise
 * occurrence dès qu'une clause se répète.
 */

type Tranche = {
  readonly debut: number
  readonly fin: number
  readonly rapprochement: Rapprochement
}

/**
 * Les tranches à surligner dans CE document, sans chevauchement.
 *
 * Deux garanties peuvent être reconnues dans la même stipulation : on garde la
 * première et l'on ignore la seconde plutôt que d'imbriquer deux `mark`, qui
 * produiraient un balisage invalide et un surlignage illisible.
 */
const tranches = (documentId: string, rapprochements: readonly Rapprochement[]): Tranche[] => {
  const brutes = rapprochements
    .flatMap((rapprochement) => {
      const stipulation = rapprochement.exigence?.stipulation
      if (stipulation === undefined || stipulation.documentId !== documentId) return []
      return [{ debut: stipulation.debut, fin: stipulation.fin, rapprochement }]
    })
    .sort((a, b) => a.debut - b.debut)

  const retenues: Tranche[] = []
  for (const tranche of brutes) {
    const derniere = retenues[retenues.length - 1]
    if (derniere !== undefined && tranche.debut < derniere.fin) continue
    retenues.push(tranche)
  }
  return retenues
}

function Document({
  document,
  rapprochements,
  actif,
  onChoisir,
}: {
  readonly document: DocumentImporte
  readonly rapprochements: readonly Rapprochement[]
  readonly actif: string | null
  readonly onChoisir: (garantieId: string) => void
}) {
  const morceaux = useMemo(() => {
    const decoupe: { texte: string; tranche: Tranche | null }[] = []
    let curseur = 0
    for (const tranche of tranches(document.id, rapprochements)) {
      if (tranche.debut > curseur) {
        decoupe.push({ texte: document.texte.slice(curseur, tranche.debut), tranche: null })
      }
      decoupe.push({ texte: document.texte.slice(tranche.debut, tranche.fin), tranche })
      curseur = tranche.fin
    }
    decoupe.push({ texte: document.texte.slice(curseur), tranche: null })
    return decoupe
  }, [document, rapprochements])

  return (
    <article className={styles.document}>
      <p className={styles.documentNom}>{document.nom}</p>
      <p className={styles.texteBail}>
        {morceaux.map((morceau, index) =>
          morceau.tranche === null ? (
            <span key={index}>{morceau.texte}</span>
          ) : (
            /*
              Un `span` et non un `button` : Chrome traite un bouton comme une
              boite atomique meme en `display: inline`, et la clause surlignee
              sortait du flux — le point qui la suivait tombait seul a la ligne.
              Le role et le clavier sont donc portes a la main.
            */
            <span
              key={index}
              role="button"
              tabIndex={0}
              aria-pressed={actif === morceau.tranche.rapprochement.garantieId}
              className={`${styles.surlignage} ${classeDe('surlignage', morceau.tranche.rapprochement.statut)} ${
                actif === morceau.tranche.rapprochement.garantieId ? styles.surlignageActif : ''
              }`}
              onClick={() => onChoisir(morceau.tranche?.rapprochement.garantieId ?? '')}
              onKeyDown={(evenement) => {
                if (evenement.key !== 'Enter' && evenement.key !== ' ') return
                evenement.preventDefault()
                onChoisir(morceau.tranche?.rapprochement.garantieId ?? '')
              }}
            >
              {morceau.texte}
            </span>
          ),
        )}
      </p>
    </article>
  )
}

function Explication({
  rapprochement,
  expert,
}: {
  readonly rapprochement: Rapprochement
  readonly expert: boolean
}) {
  const [raisonnement, setRaisonnement] = useState(false)
  const interlocuteur = INTERLOCUTEUR[rapprochement.recommandation.action]

  return (
    <div className={`${styles.carte} ${classeDe('carte', rapprochement.statut)}`}>
      <div className={styles.carteTete}>
        <h3 className={styles.carteTitre}>{rapprochement.libelle}</h3>
        <Badge statut={rapprochement.statut} />
      </div>

      <p className={styles.impact}>{rapprochement.conclusion}</p>

      {rapprochement.chiffrage !== null && (
        <p className={styles.chiffre}>{rapprochement.chiffrage}</p>
      )}

      <p className={styles.geste}>
        <span className={styles.gesteCode}>
          {LIBELLE_ACTION[rapprochement.recommandation.action]}
          {interlocuteur !== null && <span className={styles.aupresDe}> · {interlocuteur}</span>}
        </span>
        {rapprochement.recommandation.phrase}
      </p>

      <button
        type="button"
        className={styles.plier}
        onClick={() => setRaisonnement(!raisonnement)}
      >
        {raisonnement ? 'Masquer le raisonnement' : 'Voir le raisonnement'}
      </button>

      {raisonnement && (
        <div className={styles.raisonnement}>
          <div className={styles.raisonnementLigne}>
            <span className={styles.raisonnementNom}>Niveau de preuve</span>
            <span>{LIBELLE_PREUVE[rapprochement.niveau]}</span>
          </div>
          <div className={styles.raisonnementLigne}>
            <span className={styles.raisonnementNom}>Gravité métier</span>
            <span>{LIBELLE_GRAVITE[rapprochement.gravite]}</span>
          </div>
          <div className={styles.raisonnementLigne}>
            <span className={styles.raisonnementNom}>Trouvé au contrat</span>
            <span className={rapprochement.couverture === null ? styles.rien : styles.citation}>
              {rapprochement.couverture === null
                ? 'rien de correspondant'
                : `« ${rapprochement.couverture.stipulation.texte} »`}
            </span>
          </div>

          {/* Niveau 3 : le diagnostic du moteur, réservé au mode expert (§39). */}
          {expert && (
            <>
              <div className={styles.raisonnementLigne}>
                <span className={styles.raisonnementNom}>Recherche effectuée</span>
                <span>{rapprochement.recherche.join(' · ')}</span>
              </div>
              {rapprochement.ecartees.length > 0 && (
                <div className={styles.raisonnementLigne}>
                  <span className={styles.raisonnementNom}>Lectures écartées</span>
                  <span>
                    {rapprochement.ecartees.map((e) => e.garantieId).join(' · ')}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function EcranBail({
  dossier,
  expert,
  onPieces,
}: {
  readonly dossier: Dossier
  readonly expert: boolean
  readonly onPieces: () => void
}) {
  const baux = dossier.documents.filter((d) => d.role === 'OBLIGATION')
  const rapprochements = dossier.analyse?.rapprochements ?? []
  const [choisi, setChoisi] = useState<string | null>(null)
  const [documentChoisi, setDocumentChoisi] = useState<string | null>(null)

  const document = baux.find((d) => d.id === documentChoisi) ?? baux[0]
  const actif =
    rapprochements.find((r) => r.garantieId === choisi) ??
    rapprochements.find((r) => r.exigence?.stipulation.documentId === document?.id) ??
    null

  if (document === undefined) {
    return (
      <div className={styles.vide}>
        <p className={styles.videTitre}>Aucun bail importé</p>
        <p className={styles.videTexte}>
          Cet écran lit le bail et surligne, clause par clause, ce que chacune exige. Déposez le
          bail pour commencer — le contrat d’assurance viendra ensuite.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.boutonPrimaire} onClick={onPieces}>
            Déposer le bail
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {baux.length > 1 && (
        <div className={styles.selecteur}>
          {baux.map((bail) => (
            <button
              key={bail.id}
              type="button"
              className={`${styles.pastille} ${bail.id === document.id ? styles.pastilleActive : ''}`}
              onClick={() => {
                setDocumentChoisi(bail.id)
                setChoisi(null)
              }}
            >
              {bail.nom}
            </button>
          ))}
        </div>
      )}

      <div className={styles.split}>
        <Document
          document={document}
          rapprochements={rapprochements}
          actif={actif?.garantieId ?? null}
          onChoisir={setChoisi}
        />

        <div className={styles.panneau}>
          {actif === null ? (
            <div className={styles.vide}>
              <p className={styles.videTitre}>
                {rapprochements.length === 0
                  ? 'Aucune obligation reconnue'
                  : 'Choisissez une clause'}
              </p>
              <p className={styles.videTexte}>
                {rapprochements.length === 0
                  ? 'Lancez l’analyse, ou vérifiez que ce document a bien été rangé du côté « Bail et avenants ».'
                  : 'Les passages surlignés portent une obligation d’assurance. Cliquez sur l’un d’eux pour voir ce qu’il exige.'}
              </p>
            </div>
          ) : (
            <Explication key={actif.garantieId} rapprochement={actif} expert={expert} />
          )}
        </div>
      </div>
    </>
  )
}
