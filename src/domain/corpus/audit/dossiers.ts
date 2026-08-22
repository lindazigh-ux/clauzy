/**
 * Le Golden Dataset — l'index (brief §12 à §14).
 *
 * Le jeu d'essai est découpé par ce qu'il met à l'épreuve, pas par ordre
 * d'écriture : on ajoute un cas là où il manque de la variété, et le découpage
 * rend visible ce qui manque encore.
 *
 * La forme et la discipline sont dans `types.ts` ; les variétés à couvrir dans
 * `varietes.ts` ; les cas dans `cas/`. Rien d'autre ici que l'assemblage, pour
 * qu'aucun fichier de cas n'ait besoin d'en connaître un autre.
 */
import { COUVERTURE } from './cas/couverture'
import { CONTRADICTIONS } from './cas/contradictions'
import { FONDAMENTAUX } from './cas/fondamentaux'
import { PIECES } from './cas/pieces'
import { REDACTION } from './cas/redaction'
import { VOCABULAIRE } from './cas/vocabulaire'
import type { DossierAudit } from './types'

export type {
  AttenduGarantie,
  CorrectionAttendu,
  DossierAudit,
  NiveauAttendu,
} from './types'
export { NIVEAUX } from './types'
export { LIBELLE_VARIETE, Variete } from './varietes'

export const DOSSIERS_AUDIT: readonly DossierAudit[] = [
  ...FONDAMENTAUX,
  ...REDACTION,
  ...VOCABULAIRE,
  ...COUVERTURE,
  ...PIECES,
  ...CONTRADICTIONS,
]
