'use client'

import { useState } from 'react'

import { garantie } from '@/domain/garanties/nomenclature'
import { Beneficiaire, LIBELLE_BENEFICIAIRE } from '@/domain/garanties/types'
import { LIBELLE_PREUVE, NiveauPreuve, type Rapprochement } from '@/domain/moteur/rapprochement'

import styles from '../dossier.module.css'
import propres from './rapprochement.module.css'

/**
 * Le rapprochement, risque par risque (cahier de renforcement, points 2 et 8).
 *
 * C'est la vue qui manquait : la matrice dit ce que chaque CONTROLE conclut,
 * celle-ci dit ce que chaque RISQUE devient. Un courtier lit d'abord
 * ceci — quelle garantie est exigée, laquelle est portée, avec quelle preuve —
 * puis descend dans les contrôles.
 *
 * Chaque ligne s'ouvre sur la trace du raisonnement : ce qui a été cherché,
 * dans quels vocabulaires, ce qui a été trouvé, et ce qui a été écarté. Le
 * praticien doit pouvoir CONTROLER la conclusion, pas la croire.
 */

const CLASSE_NIVEAU: Record<NiveauPreuve, string> = {
  [NiveauPreuve.ETABLIE]: 'etablie',
  [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]: 'justification',
  [NiveauPreuve.PROBABLE]: 'probable',
  [NiveauPreuve.NON_DEMONTREE]: 'nonDemontree',
  [NiveauPreuve.ECART_CONFIRME]: 'ecart',
}

export function PanneauRapprochement({
  rapprochements,
}: {
  readonly rapprochements: readonly Rapprochement[]
}) {
  const [ouverte, setOuverte] = useState<string | null>(null)

  if (rapprochements.length === 0) {
    return (
      <section className={styles.carte}>
        <h2>Rapprochement des garanties</h2>
        <p className={styles.vide}>
          Aucune obligation d’assurance n’a encore été reconnue dans les pièces importées. Lancez
          l’analyse, ou vérifiez que le bail a bien été rangé du côté « Bail et avenants ».
        </p>
      </section>
    )
  }

  return (
    <section className={styles.carte}>
      <h2>Rapprochement des garanties</h2>
      <p className={propres.chapo}>
        Ce que le bail exige, risque par risque, et ce que les pièces démontrent. Ouvrez une ligne
        pour voir ce qui a été cherché et ce qui a été écarté.
      </p>

      <ul className={propres.liste}>
        {rapprochements.map((rapprochement) => {
          const ouvert = ouverte === rapprochement.garantieId
          const entree = garantie(rapprochement.garantieId)

          return (
            <li key={rapprochement.garantieId} className={propres.ligne}>
              <button
                type="button"
                className={propres.tete}
                aria-expanded={ouvert}
                onClick={() => setOuverte(ouvert ? null : rapprochement.garantieId)}
              >
                <span className={propres.nom}>
                  {rapprochement.libelle}
                  {rapprochement.beneficiaire !== Beneficiaire.MIXTE && (
                    <span className={propres.beneficiaire}>
                      protège : {LIBELLE_BENEFICIAIRE[rapprochement.beneficiaire].toLowerCase()}
                    </span>
                  )}
                </span>
                <span
                  className={`${propres.niveau} ${propres[CLASSE_NIVEAU[rapprochement.niveau]]}`}
                >
                  {LIBELLE_PREUVE[rapprochement.niveau]}
                </span>
              </button>

              {ouvert && (
                <div className={propres.detail}>
                  <p className={propres.conclusion}>{rapprochement.conclusion}</p>

                  <dl className={propres.trace}>
                    <dt>Exigence lue dans le bail</dt>
                    <dd className={propres.citation}>
                      « {rapprochement.exigence?.stipulation.texte ?? '—'} »
                    </dd>

                    <dt>Recherche effectuée dans les pièces</dt>
                    <dd>{rapprochement.recherche.join(' · ')}</dd>

                    {rapprochement.chiffrage !== null && (
                      <>
                        <dt>Comparaison des montants</dt>
                        <dd className={propres.chiffrage}>{rapprochement.chiffrage}</dd>
                      </>
                    )}

                    <dt>Trouvé au contrat</dt>
                    <dd className={rapprochement.couverture === null ? propres.rien : propres.citation}>
                      {rapprochement.couverture === null
                        ? 'rien'
                        : `« ${rapprochement.couverture.stipulation.texte} »`}
                    </dd>

                    <dt>Mentionné à l’attestation</dt>
                    <dd
                      className={rapprochement.attestation === null ? propres.rien : propres.citation}
                    >
                      {rapprochement.attestation === null
                        ? 'rien'
                        : `« ${rapprochement.attestation.stipulation.texte} »`}
                    </dd>

                    <dt>Ce que cette garantie ne couvre pas</dt>
                    <dd>
                      <ul className={propres.exclusions}>
                        {entree.neCouvrePas.map((ligne) => (
                          <li key={ligne}>{ligne}</li>
                        ))}
                      </ul>
                    </dd>

                    {entree.baseJuridique !== undefined && (
                      <>
                        <dt>Base juridique</dt>
                        <dd>{entree.baseJuridique}</dd>
                      </>
                    )}

                    {rapprochement.ecartees.length > 0 && (
                      <>
                        <dt>Lectures écartées</dt>
                        <dd>
                          {rapprochement.ecartees.map((ecartee) => (
                            <p key={ecartee.garantieId} className={propres.ecartee}>
                              <strong>{garantie(ecartee.garantieId).libelle}</strong> —{' '}
                              {ecartee.raison}
                            </p>
                          ))}
                        </dd>
                      </>
                    )}
                  </dl>

                  <p className={propres.action}>{rapprochement.action}</p>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
