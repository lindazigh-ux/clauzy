'use client'

import type { Incoherence } from '@/domain/coherence/types'
import type { Dossier } from '@/domain/dossier'

import styles from '../atelier.module.css'

/**
 * Les clauses qui se contredisent (brief §10, §17-39).
 *
 * La seule vue du produit qui ne raisonne pas clause par clause. Chacune de
 * ces stipulations passerait sans remarque prise isolément ; c'est leur
 * coexistence qui pose problème, et c'est exactement ce qu'une relecture
 * linéaire ne voit pas.
 *
 * Le §10 impose ce que l'écran doit porter, et rien ne peut en sortir : la
 * clause A avec son extrait EXACT, la clause B avec le sien, pourquoi Clauzy
 * alerte, et l'action. On ne résout jamais une contradiction en silence — le
 * ton reste conditionnel, et c'est le praticien qui tranche.
 */

const reference = (article: string | null, intitule: string | null): string =>
  article !== null ? `Article ${article}` : (intitule ?? 'Stipulation non numérotée')

/**
 * La gravité de la règle, en clair.
 *
 * Le §10 demande aussi un « niveau de confiance ». La détection d'incohérences
 * n'en produit pas : elle conclut ou ne conclut pas, sur deux motifs ancrés.
 * Afficher une confiance inventée serait pire que de ne rien afficher — on
 * montre donc la gravité, qui, elle, existe.
 */
const LIBELLE_GRAVITE: Record<number, string> = {
  3: 'Critique',
  2: 'À négocier',
  1: 'Point de vigilance',
}

function Fiche({ incoherence }: { readonly incoherence: Incoherence }) {
  const classe =
    incoherence.gravite === 3 ? styles.carteCritique : styles.carteANegocier

  return (
    <li className={`${styles.confrontation} ${classe}`}>
      <div className={styles.carteTete}>
        <h3 className={styles.carteTitre}>{incoherence.titre}</h3>
        <span className={`${styles.badge} ${incoherence.gravite === 3 ? styles.badgeCritique : styles.badgeANegocier}`}>
          {LIBELLE_GRAVITE[incoherence.gravite] ?? 'À vérifier'}
        </span>
      </div>

      <p className={styles.impact}>{incoherence.resume}</p>

      <div className={styles.face}>
        <div className={styles.faceGauche}>
          <span className={styles.maillonNom}>
            {reference(incoherence.premier.article, incoherence.premier.intitule)}
          </span>
          <p className={styles.citation}>« {incoherence.premier.texte} »</p>
        </div>

        <div>
          {incoherence.second === null ? (
            <>
              <span className={styles.maillonNom}>Contrepartie attendue</span>
              <p className={styles.manquante}>
                Introuvable dans les pièces produites. C’est la moitié manquante, pas une
                contradiction.
              </p>
            </>
          ) : (
            <>
              <span className={styles.maillonNom}>
                {reference(incoherence.second.article, incoherence.second.intitule)}
              </span>
              <p className={styles.citation}>« {incoherence.second.texte} »</p>
            </>
          )}
        </div>
      </div>

      <p className={styles.pourquoi}>{incoherence.explication}</p>

      {incoherence.baseJuridique !== undefined && (
        <p className={styles.base}>{incoherence.baseJuridique}</p>
      )}

      <p className={styles.geste}>
        <span className={styles.gesteCode}>Ce que cela appelle</span>
        {incoherence.action}
      </p>
    </li>
  )
}

export function EcranContradictions({ dossier }: { readonly dossier: Dossier }) {
  const incoherences = dossier.analyse?.incoherences ?? []

  if (dossier.analyse === null) {
    return (
      <div className={styles.vide}>
        <p className={styles.videTitre}>Analyse à lancer</p>
        <p className={styles.videTexte}>
          Les clauses du bail sont confrontées deux à deux pour repérer celles qui s’annulent.
          L’analyse n’a pas encore tourné.
        </p>
      </div>
    )
  }

  if (incoherences.length === 0) {
    return (
      <div className={styles.vide}>
        <p className={styles.videTitre}>Aucune contradiction relevée</p>
        <p className={styles.videTexte}>
          C’est un résultat, pas une absence de contrôle : les stipulations ont été confrontées deux
          à deux.
        </p>
      </div>
    )
  }

  return (
    <>
      <p className={styles.sousTitre} style={{ marginBottom: 'calc(var(--pas) * 8)' }}>
        Ces clauses ne posent aucun problème prises isolément. C’est leur coexistence qui en pose
        un : au sinistre, chaque partie invoquera celle des deux qui l’arrange.
      </p>

      <ul className={styles.confrontations}>
        {incoherences.map((incoherence) => (
          <Fiche key={incoherence.regleId} incoherence={incoherence} />
        ))}
      </ul>
    </>
  )
}
