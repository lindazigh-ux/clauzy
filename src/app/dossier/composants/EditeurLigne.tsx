'use client'

import { useState } from 'react'

import {
  LIBELLE_STATUT,
  MENTION_SANS_REPLI,
  Statut,
  aUnRepliAssurance,
  type Gravite,
} from '@/domain/controles'
import type { LigneRapport } from '@/domain/dossier'

import styles from '../dossier.module.css'
import { Etiquette, LIBELLE_GRAVITE } from './etiquettes'

/**
 * Edition d'une ligne avant export (brief §6).
 *
 * Le praticien reprend l'analyse a la main : il reformule, change la gravite,
 * ecarte un faux positif avec motif, reecrit la redaction proposee. Le moteur
 * propose, la professionnelle dispose — et le rapport porte la trace de qui a
 * decide quoi.
 *
 * Le motif est exige des qu'un statut est force ou qu'un controle est ecarte :
 * une modification manuelle sans motif n'est pas opposable.
 *
 * Le composant est monte avec `key={controle.id}` : changer de controle le
 * remonte, ce qui reinitialise le formulaire sans effet de synchronisation.
 */
export type EditeurLigneProps = {
  readonly ligne: LigneRapport
  readonly onReecrire: (champs: { analyse?: string; redaction?: string }) => void
  readonly onGravite: (gravite: Gravite) => void
  readonly onEcarter: (motif: string) => void
  readonly onReprendre: () => void
  readonly onForcerStatut: (statut: Statut, motif: string) => void
  readonly onDetacher: (index: number) => void
  readonly erreur: string | null
}

const GRAVITES: Gravite[] = [3, 2, 1]

export function EditeurLigne({
  ligne,
  onReecrire,
  onGravite,
  onEcarter,
  onReprendre,
  onForcerStatut,
  onDetacher,
  erreur,
}: EditeurLigneProps) {
  const [analyse, setAnalyse] = useState(ligne.analyse ?? '')
  const [redaction, setRedaction] = useState(ligne.redaction)
  const [motif, setMotif] = useState('')
  const [statutVise, setStatutVise] = useState<Statut>(ligne.statut)

  const controle = ligne.controle
  const diagnostic = ligne.resultatMoteur?.diagnostic ?? null

  return (
    <section className={styles.carte} aria-labelledby="titre-editeur">
      <h2 id="titre-editeur">
        <span className={styles.identifiant}>{controle.id}</span> {controle.titre}
      </h2>

      <div className={styles.editeur}>
        <div className={styles.rangee}>
          <Etiquette statut={ligne.statut} gravite={ligne.gravite} ecarte={ligne.ecarte} />
          <span className={styles.documentMeta}>confiance {ligne.confiance} / 100</span>
        </div>

        <p className={styles.editeurEnjeu}>
          <strong>Ce que la clause doit faire.</strong> {controle.obligation}
        </p>
        <p className={styles.editeurEnjeu}>
          <strong>Ce que risque le preneur.</strong> {controle.consequence}
        </p>
        <p className={styles.editeurEnjeu}>
          <strong>Correction du bail, en priorité.</strong> {controle.actionSource}
        </p>
        <p className={styles.editeurEnjeu}>
          <strong>Repli assurance.</strong>{' '}
          {aUnRepliAssurance(controle) ? controle.actionCouverture : MENTION_SANS_REPLI}
        </p>
        {controle.baseJuridique !== undefined && (
          <p className={styles.editeurEnjeu}>
            <strong>Base juridique.</strong> {controle.baseJuridique}
          </p>
        )}

        {diagnostic !== null && (
          <div className={styles.diagnostic}>
            <strong>Pourquoi cet état.</strong> {diagnostic.motif}
            {diagnostic.signaux.length > 0 && (
              <ul>
                {diagnostic.signaux.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {ligne.resultatMoteur !== null && ligne.resultatMoteur.extraitsObligation.length > 0 && (
          <div>
            <span className={styles.champLabel}>Passages relevés dans le bail</span>
            <ul className={styles.listeSimple}>
              {ligne.resultatMoteur.extraitsObligation.slice(0, 3).map((extrait) => (
                <li key={`${extrait.documentId}-${extrait.debut}`} className={styles.citation}>
                  {extrait.texte}
                </li>
              ))}
            </ul>
          </div>
        )}

        {ligne.rattachements.length > 0 && (
          <div>
            <span className={styles.champLabel}>Passages rattachés à la main</span>
            <ul className={styles.listeSimple}>
              {ligne.rattachements.map((rattachement, index) => (
                <li key={`${rattachement.debut}-${index}`} className={styles.puce}>
                  <span className={styles.citation}>{rattachement.texte}</span>
                  <button
                    type="button"
                    className={styles.boutonDiscret}
                    onClick={() => onDetacher(index)}
                  >
                    Détacher
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className={styles.champLabel} htmlFor="champ-analyse">
            Analyse rédigée, telle qu’elle figurera au rapport
          </label>
          <textarea
            id="champ-analyse"
            className={styles.zoneTexte}
            value={analyse}
            placeholder="Le moteur ne rédige pas l’analyse : c’est votre conseil, pas le sien."
            onChange={(e) => setAnalyse(e.target.value)}
            onBlur={() => onReecrire({ analyse })}
          />
        </div>

        <div>
          <label className={styles.champLabel} htmlFor="champ-redaction">
            Rédaction proposée au bailleur
          </label>
          <textarea
            id="champ-redaction"
            className={styles.zoneTexte}
            value={redaction}
            onChange={(e) => setRedaction(e.target.value)}
            onBlur={() => onReecrire({ redaction })}
          />
        </div>

        <div>
          <span className={styles.champLabel}>Gravité retenue</span>
          <div className={styles.rangee}>
            {GRAVITES.map((gravite) => (
              <button
                key={gravite}
                type="button"
                className={styles.compteurCase}
                aria-pressed={ligne.gravite === gravite}
                onClick={() => onGravite(gravite)}
              >
                <span className={styles.compteurLibelle}>{LIBELLE_GRAVITE[gravite]}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={styles.champLabel} htmlFor="champ-motif">
            Motif — exigé pour écarter un contrôle ou forcer son état
          </label>
          <input
            id="champ-motif"
            className={styles.champ}
            value={motif}
            placeholder="Ex. : clause supprimée par l’avenant du 3 mars 2026."
            onChange={(e) => setMotif(e.target.value)}
          />
        </div>

        <div className={styles.rangee}>
          <select
            className={styles.roleSelect}
            value={statutVise}
            aria-label="État à retenir"
            onChange={(e) => setStatutVise(e.target.value as Statut)}
          >
            {Object.values(Statut).map((statut) => (
              <option key={statut} value={statut}>
                {LIBELLE_STATUT[statut]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.bouton}
            onClick={() => onForcerStatut(statutVise, motif)}
          >
            Retenir cet état
          </button>

          {ligne.ecarte ? (
            <button type="button" className={styles.bouton} onClick={onReprendre}>
              Remettre au décompte
            </button>
          ) : (
            <button type="button" className={styles.bouton} onClick={() => onEcarter(motif)}>
              Écarter comme faux positif
            </button>
          )}
        </div>

        {ligne.motif.length > 0 && (
          <p className={styles.documentMeta}>Motif enregistré : {ligne.motif}</p>
        )}

        {erreur !== null && (
          <p className={styles.erreur} role="alert">
            {erreur}
          </p>
        )}
      </div>
    </section>
  )
}
