'use client'

import { useState } from 'react'

import { REFERENTIEL, type Gravite } from '@/domain/controles'
import type { Observation, Perimetre as PerimetreDossier } from '@/domain/dossier'

import styles from '../dossier.module.css'
import { LIBELLE_GRAVITE } from './etiquettes'

/**
 * Perimetre, limites et observations libres (brief §6, §7).
 *
 * C'est la page qui distingue un livrable d'une sortie machine, et celle qui
 * protege. Le moteur ne sait pas ce qu'on ne lui a pas donne : les pieces
 * manquantes et les hypotheses se saisissent a la main, et remontent telles
 * quelles au rapport.
 */

type ListeEditableProps = {
  readonly titre: string
  readonly invitation: string
  readonly valeurs: readonly string[]
  readonly onChanger: (valeurs: readonly string[]) => void
}

function ListeEditable({ titre, invitation, valeurs, onChanger }: ListeEditableProps) {
  const [saisie, setSaisie] = useState('')

  const ajouter = () => {
    const propre = saisie.trim()
    if (propre.length === 0) return
    onChanger([...valeurs, propre])
    setSaisie('')
  }

  return (
    <div>
      <span className={styles.champLabel}>{titre}</span>
      {valeurs.length > 0 && (
        <ul className={styles.listeSimple} style={{ marginBottom: 'calc(var(--pas) * 2)' }}>
          {valeurs.map((valeur, index) => (
            <li key={`${valeur}-${index}`} className={styles.puce}>
              <span>{valeur}</span>
              <button
                type="button"
                className={styles.boutonDiscret}
                onClick={() => onChanger(valeurs.filter((_, i) => i !== index))}
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.rangee}>
        <input
          className={styles.champ}
          style={{ flex: 1, minWidth: '12rem' }}
          value={saisie}
          placeholder={invitation}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              ajouter()
            }
          }}
        />
        <button type="button" className={styles.bouton} onClick={ajouter}>
          Ajouter
        </button>
      </div>
    </div>
  )
}

export function PanneauPerimetre({
  perimetre,
  onChanger,
}: {
  readonly perimetre: PerimetreDossier
  readonly onChanger: (modifications: Partial<PerimetreDossier>) => void
}) {
  const [controleSansObjet, setControleSansObjet] = useState(REFERENTIEL[0]?.id ?? '')

  return (
    <section className={styles.carte} aria-labelledby="titre-perimetre">
      <h2 id="titre-perimetre">Périmètre et limites</h2>
      <p className={styles.vide} style={{ marginBottom: 'calc(var(--pas) * 4)' }}>
        Ce que vous avez reçu, ce qui manque, ce que vous avez supposé. Cette page ouvre le rapport
        et le protège.
      </p>

      <div className={styles.editeur}>
        <ListeEditable
          titre="Pièces reçues"
          invitation="Ex. : bail du 12 janvier 2024"
          valeurs={perimetre.piecesRecues}
          onChanger={(piecesRecues) => onChanger({ piecesRecues })}
        />
        <ListeEditable
          titre="Pièces manquantes"
          invitation="Ex. : conditions générales de la police"
          valeurs={perimetre.piecesManquantes}
          onChanger={(piecesManquantes) => onChanger({ piecesManquantes })}
        />
        <ListeEditable
          titre="Hypothèses retenues"
          invitation="Ex. : les surfaces sont celles de l’état des lieux"
          valeurs={perimetre.hypotheses}
          onChanger={(hypotheses) => onChanger({ hypotheses })}
        />

        <div>
          <span className={styles.champLabel}>Contrôles sans objet pour ce dossier</span>
          {perimetre.controlesSansObjet.length > 0 && (
            <ul className={styles.listeSimple} style={{ marginBottom: 'calc(var(--pas) * 2)' }}>
              {perimetre.controlesSansObjet.map((id) => (
                <li key={id} className={styles.puce}>
                  <span>
                    <span className={styles.identifiant}>{id}</span>{' '}
                    {REFERENTIEL.find((c) => c.id === id)?.titre ?? ''}
                  </span>
                  <button
                    type="button"
                    className={styles.boutonDiscret}
                    onClick={() =>
                      onChanger({
                        controlesSansObjet: perimetre.controlesSansObjet.filter((v) => v !== id),
                      })
                    }
                  >
                    Remettre au décompte
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className={styles.rangee}>
            <select
              className={styles.roleSelect}
              value={controleSansObjet}
              aria-label="Contrôle à déclarer sans objet"
              onChange={(e) => setControleSansObjet(e.target.value)}
            >
              {REFERENTIEL.map((controle) => (
                <option key={controle.id} value={controle.id}>
                  {controle.id} — {controle.titre}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.bouton}
              onClick={() => {
                if (perimetre.controlesSansObjet.includes(controleSansObjet)) return
                onChanger({
                  controlesSansObjet: [...perimetre.controlesSansObjet, controleSansObjet],
                })
              }}
            >
              Déclarer sans objet
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function PanneauObservations({
  observations,
  onAjouter,
  onRetirer,
}: {
  readonly observations: readonly Observation[]
  readonly onAjouter: (observation: { titre: string; texte: string; gravite: Gravite }) => void
  readonly onRetirer: (id: string) => void
}) {
  const [titre, setTitre] = useState('')
  const [texte, setTexte] = useState('')
  const [gravite, setGravite] = useState<Gravite>(2)

  const ajouter = () => {
    if (titre.trim().length === 0 || texte.trim().length === 0) return
    onAjouter({ titre: titre.trim(), texte: texte.trim(), gravite })
    setTitre('')
    setTexte('')
  }

  return (
    <section className={styles.carte} aria-labelledby="titre-observations">
      <h2 id="titre-observations">
        Observations libres
        <span className={styles.compteur}>hors des 40 contrôles</span>
      </h2>

      {observations.length === 0 ? (
        <p className={styles.vide}>
          Un point qui ne relève d’aucun des 40 contrôles mérite quand même d’être écrit. Ajoutez-le
          ici : il figurera au rapport.
        </p>
      ) : (
        <ul className={styles.listeSimple} style={{ marginBottom: 'calc(var(--pas) * 4)' }}>
          {observations.map((observation) => (
            <li key={observation.id} className={styles.puce}>
              <span>
                <strong>{observation.titre}</strong>
                <span className={styles.sousTitre}>{observation.texte}</span>
                <span className={styles.documentMeta}>{LIBELLE_GRAVITE[observation.gravite]}</span>
              </span>
              <button
                type="button"
                className={styles.boutonDiscret}
                onClick={() => onRetirer(observation.id)}
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.editeur}>
        <div>
          <label className={styles.champLabel} htmlFor="obs-titre">
            Intitulé
          </label>
          <input
            id="obs-titre"
            className={styles.champ}
            value={titre}
            placeholder="Ex. : caution solidaire du dirigeant"
            onChange={(e) => setTitre(e.target.value)}
          />
        </div>
        <div>
          <label className={styles.champLabel} htmlFor="obs-texte">
            Observation
          </label>
          <textarea
            id="obs-texte"
            className={styles.zoneTexte}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
          />
        </div>
        <div className={styles.rangee}>
          <select
            className={styles.roleSelect}
            value={gravite}
            aria-label="Gravité de l’observation"
            onChange={(e) => setGravite(Number(e.target.value) as Gravite)}
          >
            {([3, 2, 1] as Gravite[]).map((valeur) => (
              <option key={valeur} value={valeur}>
                {LIBELLE_GRAVITE[valeur]}
              </option>
            ))}
          </select>
          <button type="button" className={styles.bouton} onClick={ajouter}>
            Ajouter l’observation
          </button>
        </div>
      </div>
    </section>
  )
}
