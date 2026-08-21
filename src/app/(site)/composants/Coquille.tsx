'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAVIGATION, PAGES_LEGALES } from '@/contenu/site'
import { MENTION_LIMITE } from '@/domain/dossier/types'

import styles from '../site.module.css'

/**
 * En-tete et pied du site marketing (brief §9).
 *
 * Composant client pour une seule raison : marquer la rubrique courante dans
 * la navigation. Le reste des pages du site est rendu sur le serveur — c'est
 * la condition de l'indexation.
 */

const Sceau = () => (
  <svg className={styles.sceau} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2 3.5 5.6v6.1c0 5.3 3.6 9.4 8.5 10.3 4.9-.9 8.5-5 8.5-10.3V5.6L12 2Z"
      fill="var(--accent)"
    />
    <path
      d="m8 12 2.9 2.9L16.4 9.4"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export function Entete() {
  const chemin = usePathname()

  return (
    <header className={styles.entete}>
      <div className={styles.enteteContenu}>
        <Link href="/" className={styles.marque}>
          <Sceau />
          Clauzy
        </Link>
        <nav className={styles.navigation} aria-label="Navigation principale">
          {NAVIGATION.map((page) => {
            // Une page de famille garde la rubrique « Contrôles » allumée.
            const actif =
              chemin === page.chemin ||
              (page.chemin !== '/' && chemin.startsWith(`${page.chemin}/`))
            return (
              <Link
                key={page.chemin}
                href={page.chemin}
                className={`${styles.lienNav} ${actif ? styles.lienNavActif : ''}`}
                aria-current={actif ? 'page' : undefined}
              >
                {page.nav}
              </Link>
            )
          })}
          <Link href="/dossier" className={styles.boutonPrimaire}>
            Essayer
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function Pied() {
  return (
    <footer className={styles.pied}>
      <div className={styles.piedContenu}>
        <div className={styles.piedColonne}>
          <h2>Produit</h2>
          <ul>
            <li>
              <Link href="/methode">La méthode</Link>
            </li>
            <li>
              <Link href="/controles">Les 40 contrôles</Link>
            </li>
            <li>
              <Link href="/livrable">Le livrable</Link>
            </li>
            <li>
              <Link href="/tarifs">Tarifs</Link>
            </li>
          </ul>
        </div>
        <div className={styles.piedColonne}>
          <h2>Preuve</h2>
          <ul>
            <li>
              <Link href="/securite">Sécurité technique</Link>
            </li>
            <li>
              <Link href="/faq">Questions fréquentes</Link>
            </li>
            <li>
              <Link href="/blog">Le carnet</Link>
            </li>
            <li>
              <Link href="/demo">Réserver une démonstration</Link>
            </li>
          </ul>
        </div>
        <div className={styles.piedColonne}>
          <h2>Légal</h2>
          <ul>
            {PAGES_LEGALES.map((page) => (
              <li key={page.chemin}>
                <Link href={page.chemin}>{page.titre}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.piedColonne}>
          <h2>Commencer</h2>
          <ul>
            <li>
              <Link href="/dossier">Ouvrir le poste de travail</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.piedMention}>
        {/* La mention du §7 n'est pas negociable : elle vaut sur le site comme
            sur le livrable. */}
        <p>{MENTION_LIMITE}</p>
        <p>Clauzy — {new Date().getFullYear()}. Vos documents ne quittent pas votre navigateur.</p>
      </div>
    </footer>
  )
}
