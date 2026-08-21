import type { Metadata } from 'next'
import Link from 'next/link'

import { FormulaireDemo } from './FormulaireDemo'
import { partage } from '@/contenu/site'
import { NOMBRE_CONTROLES } from '@/domain/controles'

import styles from '../site.module.css'

export const metadata: Metadata = {
  title: 'Réserver une démonstration',
  description:
    'Trente minutes, sur un bail synthétique ou sur le vôtre — dans ce cas, l’écran est le vôtre et rien ne nous parvient. Pour les équipes, les référentiels sur mesure et les revues de sécurité.',
  ...partage({
    titre: 'Réserver une démonstration — Clauzy',
    description:
      'Trente minutes, sur un bail synthétique ou sur le vôtre — dans ce cas, l’écran est le vôtre et rien ne nous parvient.',
    chemin: '/demo',
  }),
}

export default function Demo() {
  return (
    <main className="page">
      <span className={styles.surtitre}>Comptes équipe</span>
      <h1>Réserver une démonstration</h1>
      <p className={styles.chapo}>
        Trente minutes, en visioconférence. Nous parcourons un dossier complet, de l’import au
        livrable, et nous répondons aux questions d’architecture que vos équipes sécurité poseront
        de toute façon.
      </p>

      <div className={styles.encadre}>
        <h2>Vous pouvez la faire sur votre propre bail</h2>
        <p>
          Dans ce cas, c’est votre écran qui est partagé et votre navigateur qui analyse : le
          document ne nous parvient à aucun moment, et nous n’y avons pas accès après coup. C’est
          la démonstration la plus convaincante que nous puissions faire de l’architecture.
        </p>
      </div>

      <FormulaireDemo />

      <section className={styles.section}>
        <h2>Ou commencez sans nous</h2>
        <p>
          Le dossier d’exemple applique les {NOMBRE_CONTROLES} contrôles et produit un livrable
          complet en deux minutes, sans compte et sans qu’aucune pièce client ne soit importée.
          Beaucoup n’ont pas besoin d’autre chose.
        </p>
        <div className={styles.appels}>
          <Link href="/dossier" className={styles.boutonSecondaire}>
            Ouvrir le poste de travail
          </Link>
        </div>
      </section>
    </main>
  )
}
