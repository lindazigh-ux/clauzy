import {
  LIBELLE_RESPONSABLE,
  MENTION_SANS_REPLI,
  Nature,
  aUnRepliAssurance,
  type Controle,
} from '@/domain/controles'

import styles from './controles.module.css'

/** Ce qu'une gravite veut dire, en clair. Le chiffre seul ne dit rien. */
export const LIBELLE_GRAVITE: Record<1 | 2 | 3, string> = {
  3: 'Critique',
  2: 'À négocier',
  1: 'Point de vigilance',
}

/**
 * Ce qu'une nature implique pour le lecteur — c'est la cle de lecture du
 * referentiel, et elle merite d'etre dite plutot que devinee.
 */
export const EXPLICATION_NATURE: Record<Nature, string> = {
  [Nature.CROISEMENT]:
    'Ne se tranche qu’avec les pièces d’assurance : sans elles, le contrôle reste à vérifier.',
  [Nature.TRANSFERT_BAIL]:
    'Le défaut vient de la rédaction. Aucune police ne le corrige : la négociation est contractuelle.',
  [Nature.DOUBLE]:
    'Visible dans la rédaction, et aggravé au croisement avec les pièces d’assurance.',
  [Nature.FORMALISME]:
    'Procédure, délais, sanctions. Aucune pièce d’assurance ne répond à ce point.',
}

/* Les classes des CSS Modules sont typees `string | undefined` sous
   `noUncheckedIndexedAccess` : className l'accepte tel quel. */
const classeGravite = (gravite: 1 | 2 | 3): string | undefined =>
  gravite === 3 ? styles.jetonCritique : gravite === 2 ? styles.jetonNegocier : styles.jetonVigilance

/**
 * Fiche publique d'un controle (brief §9).
 *
 * Entierement derivee du referentiel : rien n'est reecrit pour le site. Le
 * lecteur voit exactement ce que le moteur applique — c'est la meilleure preuve
 * qu'on puisse donner d'un referentiel, et cela rend impossible qu'une page
 * marketing survive a un controle qui aurait change.
 *
 * L'ordre des lignes est celui du rapport : ce que la clause doit faire, ce
 * qu'on risque, ce qu'on corrige d'abord, ce qu'on fait a defaut (§13).
 */
export function FicheControle({ controle }: { controle: Controle }) {
  const repli = aUnRepliAssurance(controle)

  return (
    <article className={styles.fiche} id={controle.id}>
      <div className={styles.ficheTete}>
        <span className={styles.ficheId}>{controle.id}</span>
        <h3 className={styles.ficheTitre}>{controle.titre}</h3>
        <div className={styles.jetons}>
          <span className={classeGravite(controle.gravite)}>
            {LIBELLE_GRAVITE[controle.gravite]}
          </span>
          <span className={styles.jeton}>{LIBELLE_RESPONSABLE[controle.responsable]}</span>
        </div>
      </div>

      <p className={styles.obligation}>{controle.obligation}</p>

      <div className={styles.lignes}>
        <div className={styles.ligne}>
          <span className={styles.ligneEtiquette}>Ce qui se joue</span>
          <p className={styles.ligneTexte}>{controle.consequence}</p>
        </div>

        <div className={styles.ligne}>
          <span className={styles.ligneEtiquette}>Comment il se tranche</span>
          <p className={styles.ligneTexte}>
            {EXPLICATION_NATURE[controle.nature]}{' '}
            <span className={styles.ligneTexte}>
              Axes comparés : {controle.axes.join(', ').toLowerCase()}.
            </span>
          </p>
        </div>

        <div className={styles.ligne}>
          <span className={styles.ligneEtiquette}>Correction — le bail d’abord</span>
          <p className={styles.ligneTexte}>{controle.actionSource}</p>
        </div>

        <div className={styles.ligne}>
          <span className={styles.ligneEtiquette}>À défaut — côté assurance</span>
          <p className={styles.ligneTexte}>
            {repli ? (
              controle.actionCouverture
            ) : (
              /* Le §5.2 interdit la case vide : l'absence de repli est une
                 information, et le referentiel porte deja la phrase exacte. */
              <span className={styles.sansRepli}>{MENTION_SANS_REPLI}</span>
            )}
          </p>
        </div>

        <div className={styles.ligne}>
          <span className={styles.ligneEtiquette}>Rédaction de remplacement</span>
          <p className={styles.redaction}>« {controle.redactionProposee} »</p>
        </div>

        <div className={styles.ligne}>
          <span className={styles.ligneEtiquette}>Pièce qui clôt le point</span>
          <p className={styles.ligneTexte}>{controle.preuveCloture}</p>
        </div>

        {controle.baseJuridique !== undefined && (
          <div className={styles.ligne}>
            <span className={styles.ligneEtiquette}>Base juridique</span>
            <p className={styles.ligneTexte}>{controle.baseJuridique}</p>
          </div>
        )}
      </div>
    </article>
  )
}
