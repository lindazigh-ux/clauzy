/**
 * La traduction du statut en couleur, écrite UNE fois.
 *
 * Le poste de travail, le rapport imprimé et la note Word ont chacun leur
 * table ; c'est inévitable, leurs supports diffèrent. Mais à l'intérieur de
 * l'atelier, trois écrans lisent le même badge, et trois tables auraient
 * divergé au premier ajout.
 */
import { LIBELLE_STATUT_AFFICHE, StatutAffiche } from '@/domain/garanties/axes'

import styles from '../atelier.module.css'

const SUFFIXE: Record<StatutAffiche, string> = {
  [StatutAffiche.CONFORME]: 'Conforme',
  [StatutAffiche.A_VERIFIER]: 'AVerifier',
  [StatutAffiche.A_NEGOCIER]: 'ANegocier',
  [StatutAffiche.CRITIQUE]: 'Critique',
  [StatutAffiche.INFORMATION]: 'Information',
}

/** `badge`, `carte`, `surlignage` — le préfixe dit où la couleur s'applique. */
export const classeDe = (prefixe: string, statut: StatutAffiche): string =>
  styles[`${prefixe}${SUFFIXE[statut]}`] ?? ''

export function Badge({ statut }: { readonly statut: StatutAffiche }) {
  return (
    <span className={`${styles.badge} ${classeDe('badge', statut)}`}>
      {LIBELLE_STATUT_AFFICHE[statut]}
    </span>
  )
}
