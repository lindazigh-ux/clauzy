'use client'

import Link from 'next/link'

import styles from '../atelier.module.css'

/**
 * La navigation (brief §17-39).
 *
 * Six sections, dans l'ordre du travail : ce que je dois faire, ce que le bail
 * dit, ce qu'il en reste face aux polices, ce qui se contredit, ce que j'ai
 * reçu, ce que je livre. Les paramètres vivent en bas, hors du chemin.
 *
 * Les compteurs disent ce qui APPELLE une action, jamais l'inventaire : « 45
 * contrôles » ne se lit nulle part dans cette barre (§43).
 */
export const SECTIONS = [
  'SYNTHESE',
  'BAIL',
  'CONFRONTATION',
  'CONTRADICTIONS',
  'PIECES',
  'RAPPORT',
] as const

/**
 * La septieme section n'apparait qu'en mode expert.
 *
 * Elle porte la matrice des quarante-cinq controles, les identifiants et les
 * traces. Elle n'a pas sa place dans le chemin normal : « le moteur gere 45
 * controles ; le courtier ne doit jamais avoir l'impression d'en gerer 45 ».
 */
export const SECTION_EXPERTE = 'CONTROLES' as const

export type Section = (typeof SECTIONS)[number] | typeof SECTION_EXPERTE

export const LIBELLE_SECTION: Record<Section, string> = {
  SYNTHESE: 'Synthèse',
  BAIL: 'Bail',
  CONFRONTATION: 'Bail × Assurance',
  CONTRADICTIONS: 'Contradictions',
  PIECES: 'Pièces',
  RAPPORT: 'Rapport',
  CONTROLES: 'Contrôles',
}

export function Rail({
  active,
  compteurs,
  client,
  reference,
  expert,
  onSection,
  onExpert,
}: {
  readonly active: Section
  /** Ce qui appelle une action, par section. Absent = rien à signaler. */
  readonly compteurs: Partial<Record<Section, { readonly valeur: number; readonly alerte: boolean }>>
  readonly client: string
  readonly reference: string
  readonly expert: boolean
  readonly onSection: (section: Section) => void
  readonly onExpert: (actif: boolean) => void
}) {
  return (
    <nav className={styles.rail} aria-label="Sections du dossier">
      <Link href="/" className={styles.marque}>
        Clauzy
      </Link>

      <div className={styles.dossierEnTete}>
        {client.trim().length > 0 ? (
          <span className={styles.dossierNom}>{client}</span>
        ) : (
          <span className={styles.dossierNomVide}>Client non renseigné</span>
        )}
        <span className={styles.dossierReference}>{reference.trim() || '—'}</span>
      </div>

      <ul className={styles.sections}>
        {[...SECTIONS, ...(expert ? [SECTION_EXPERTE] : [])].map((section) => {
          const compteur = compteurs[section]
          return (
            <li key={section}>
              <button
                type="button"
                className={`${styles.onglet} ${active === section ? styles.ongletActif : ''}`}
                aria-current={active === section ? 'page' : undefined}
                onClick={() => onSection(section)}
              >
                {LIBELLE_SECTION[section]}
                {compteur !== undefined && compteur.valeur > 0 && (
                  <span
                    className={`${styles.compteur} ${compteur.alerte ? styles.compteurActif : ''}`}
                  >
                    {compteur.valeur}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className={styles.pied}>
        <label className={styles.bascule}>
          <input type="checkbox" checked={expert} onChange={(e) => onExpert(e.target.checked)} />
          Mode expert
        </label>
      </div>
    </nav>
  )
}
