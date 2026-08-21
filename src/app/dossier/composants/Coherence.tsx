'use client'

import type { Incoherence } from '@/domain/coherence/types'

import styles from '../dossier.module.css'
import propres from './coherence.module.css'

/**
 * Cohérence interne du bail (cahier de renforcement, point 3).
 *
 * La seule vue du produit qui ne raisonne pas clause par clause. Chaque
 * stipulation citée ici passerait sans remarque prise isolément : c'est leur
 * coexistence qui pose problème, et c'est exactement ce qu'une relecture
 * linéaire ne voit pas.
 *
 * Le ton reste conditionnel — « incohérence potentielle ». Une rédaction
 * inhabituelle peut réconcilier les deux clauses ; l'outil montre et explique,
 * le praticien tranche.
 */

const reference = (article: string | null, intitule: string | null): string =>
  article !== null ? `Article ${article}` : (intitule ?? 'Stipulation non numérotée')

export function PanneauCoherence({
  incoherences,
}: {
  readonly incoherences: readonly Incoherence[]
}) {
  if (incoherences.length === 0) {
    return (
      <section className={styles.carte}>
        <h2>Cohérence interne</h2>
        <p className={styles.vide}>
          Aucune contradiction n’a été relevée entre les clauses du bail. C’est un résultat, pas une
          absence de contrôle : les stipulations ont été confrontées deux à deux.
        </p>
      </section>
    )
  }

  return (
    <section className={styles.carte}>
      <h2>Cohérence interne</h2>
      <p className={propres.chapo}>
        Ces clauses ne posent aucun problème prises isolément. C’est leur coexistence qui en pose
        un : au sinistre, chaque partie invoquera celle des deux qui l’arrange.
      </p>

      <ul className={propres.liste}>
        {incoherences.map((incoherence) => (
          <li
            key={incoherence.regleId}
            className={incoherence.gravite === 3 ? propres.ficheCritique : propres.fiche}
          >
            <div className={propres.tete}>
              <span className={propres.signal} aria-hidden="true">
                ⚠
              </span>
              <div>
                <p className={propres.resume}>{incoherence.resume}</p>
                <h3 className={propres.titre}>
                  {incoherence.titre}
                  <span className={propres.reference}>{incoherence.regleId}</span>
                </h3>
              </div>
            </div>

            <div className={propres.clauses}>
              <div className={propres.clause}>
                <span className={propres.clauseEtiquette}>
                  {reference(incoherence.premier.article, incoherence.premier.intitule)}
                </span>
                <p className={propres.citation}>« {incoherence.premier.texte} »</p>
              </div>

              {incoherence.second === null ? (
                <div className={propres.clause}>
                  <span className={propres.clauseEtiquette}>Contrepartie attendue</span>
                  <p className={propres.manquante}>
                    Introuvable dans les pièces produites. C’est la moitié manquante, pas une
                    contradiction.
                  </p>
                </div>
              ) : (
                <div className={propres.clause}>
                  <span className={propres.clauseEtiquette}>
                    {reference(incoherence.second.article, incoherence.second.intitule)}
                  </span>
                  <p className={propres.citation}>« {incoherence.second.texte} »</p>
                </div>
              )}
            </div>

            <p className={propres.explication}>{incoherence.explication}</p>

            {incoherence.baseJuridique !== undefined && (
              <p className={propres.base}>{incoherence.baseJuridique}</p>
            )}

            <p className={propres.action}>{incoherence.action}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
