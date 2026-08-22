'use client'

import type { ReactNode } from 'react'

import styles from '../atelier.module.css'

/**
 * Un formulaire qui ne s'ouvre que si on le demande (brief §39).
 *
 * « À retirer de l'expérience principale : les formulaires toujours ouverts. »
 * Quatre panneaux de saisie empilés sous un écran de lecture ne servent qu'à
 * une chose : faire croire qu'il reste du travail. Ils sont là, ils sont à un
 * clic, ils ne sont plus au premier plan.
 *
 * `<details>` plutôt qu'un état React : l'ouverture survit au re-rendu, le
 * clavier fonctionne sans qu'on l'écrive, et la recherche du navigateur trouve
 * le contenu replié.
 */
export function Repliable({
  titre,
  note,
  ouvertParDefaut = false,
  children,
}: {
  readonly titre: string
  /** Ce qu'on y trouve, en une ligne — pour décider sans ouvrir. */
  readonly note?: string
  readonly ouvertParDefaut?: boolean
  readonly children: ReactNode
}) {
  return (
    <details className={styles.repliable} open={ouvertParDefaut}>
      <summary className={styles.repliableTete}>
        <span className={styles.repliableTitre}>{titre}</span>
        {note !== undefined && <span className={styles.repliableNote}>{note}</span>}
      </summary>
      <div className={styles.repliableCorps}>{children}</div>
    </details>
  )
}
