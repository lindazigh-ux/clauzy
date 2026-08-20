import { LIBELLE_STATUT, Statut, type Gravite } from '@/domain/controles'

import styles from '../dossier.module.css'

/**
 * Rendu des quatre etats (brief §5.2).
 *
 * NON_DETECTE porte une bordure pleine plutot qu'un aplat pale : il doit etre
 * visuellement saillant, pas discret. C'est une ligne de checklist a verifier,
 * pas un aveu — et c'est un argument de vente, pas une lacune a masquer.
 */
const CLASSES: Record<Statut, string> = {
  [Statut.ECART]: styles.etiquetteEcart ?? '',
  [Statut.CONFORME]: styles.etiquetteConforme ?? '',
  [Statut.ABSENT_DU_BAIL]: styles.etiquetteAbsent ?? '',
  [Statut.NON_DETECTE]: styles.etiquetteNonDetecte ?? '',
}

export function Etiquette({
  statut,
  gravite,
  ecarte = false,
}: {
  statut: Statut
  gravite: Gravite
  ecarte?: boolean
}) {
  // Un controle ecarte ne compte plus : afficher son ancien etat laisserait
  // croire qu'il pese encore sur le rapport. On dit ce qu'il est devenu.
  if (ecarte) {
    return (
      <span className={`${styles.etiquette} ${styles.etiquetteAbsent ?? ''}`}>
        Écarté par le praticien
      </span>
    )
  }

  // Rouge pour un ecart critique, ambre en deca (brief §5.2).
  const classe =
    statut === Statut.ECART && gravite < 3
      ? (styles.etiquetteEcartMineur ?? '')
      : CLASSES[statut]

  return <span className={`${styles.etiquette} ${classe}`}>{LIBELLE_STATUT[statut]}</span>
}

export const LIBELLE_GRAVITE: Record<Gravite, string> = {
  3: 'Critique',
  2: 'À négocier',
  1: 'Point de vigilance',
}
