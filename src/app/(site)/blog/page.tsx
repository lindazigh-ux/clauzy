import type { Metadata } from 'next'
import Link from 'next/link'

import { ARTICLES_RECENTS } from '@/contenu/blog'
import { partage } from '@/contenu/site'

import styles from '../site.module.css'
import propres from './blog.module.css'

export const metadata: Metadata = {
  title: 'Le carnet',
  description:
    'Les écarts que nous voyons le plus souvent entre un bail commercial et la police qui devrait le soutenir, expliqués sur des rédactions synthétiques.',
  ...partage({
    titre: 'Le carnet — Clauzy',
    description:
      'Les écarts que nous voyons le plus souvent entre un bail commercial et sa police d’assurance.',
    chemin: '/blog',
  }),
}

const enFrancais = (iso: string): string =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export default function IndexBlog() {
  return (
    <main className="page">
      <span className={styles.surtitre}>Le carnet</span>
      <h1>Les écarts que nous voyons le plus souvent</h1>
      <p className={styles.chapo}>
        Chaque note part d’un défaut réel de rapprochement entre un bail et sa police, et le suit
        jusqu’à la correction. Les clauses citées sont des rédactions synthétiques, représentatives
        de ce qui circule — jamais l’extrait d’un document client, même anonymisé.
      </p>

      <div className={propres.liste}>
        {ARTICLES_RECENTS.map((entree) => (
          <Link key={entree.slug} href={`/blog/${entree.slug}`} className={propres.entree}>
            <div className={propres.meta}>
              <time dateTime={entree.publieLe}>{enFrancais(entree.publieLe)}</time>
              <span>{entree.minutes} min</span>
              <span className={propres.metaControle}>{entree.controles.join(' · ')}</span>
            </div>
            <h2 className={propres.entreeTitre}>{entree.titre}</h2>
            <p className={propres.entreeChapo}>{entree.chapo}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
