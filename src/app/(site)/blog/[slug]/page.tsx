import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArticleStructure, FilStructure } from '../../composants/DonneesStructurees'
import { ARTICLES, article, type Bloc } from '@/contenu/blog'
import { SLUG_FAMILLE, partage } from '@/contenu/site'
import { PAR_ID } from '@/domain/controles'

import styles from '../../site.module.css'
import propres from '../blog.module.css'

type Parametres = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return ARTICLES.map((entree) => ({ slug: entree.slug }))
}

export async function generateMetadata({ params }: Parametres): Promise<Metadata> {
  const { slug } = await params
  const entree = article(slug)
  if (entree === undefined) return {}

  return {
    title: entree.titre,
    description: entree.chapo,
    ...partage({
      titre: entree.titre,
      description: entree.chapo,
      chemin: `/blog/${slug}`,
      type: 'article',
      publieLe: entree.publieLe,
    }),
  }
}

const enFrancais = (iso: string): string =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Un bloc, une forme. Ajouter un type de bloc oblige a decider de son rendu. */
const Rendu = ({ bloc }: { bloc: Bloc }) => {
  switch (bloc.type) {
    case 'h2':
      return <h2>{bloc.texte}</h2>
    case 'p':
      return <p>{bloc.texte}</p>
    case 'clause':
      return (
        <figure className={propres.citation}>
          <blockquote className="clause">{bloc.texte}</blockquote>
          <figcaption className={propres.citationSource}>{bloc.source}</figcaption>
        </figure>
      )
    case 'liste':
      return (
        <ul className={propres.puces}>
          {bloc.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'encadre':
      return (
        <aside className={propres.encadreArticle}>
          <h3>{bloc.titre}</h3>
          <p>{bloc.texte}</p>
        </aside>
      )
  }
}

export default async function PageArticle({ params }: Parametres) {
  const { slug } = await params
  const entree = article(slug)
  if (entree === undefined) notFound()

  // Les controles cites sont resolus depuis le referentiel : un identifiant
  // qui n'existe plus ferait echouer le test, pas la page en production.
  const cites = entree.controles
    .map((id) => PAR_ID.get(id))
    .filter((controle): controle is NonNullable<typeof controle> => controle !== undefined)

  return (
    <main className="page">
      <ArticleStructure
        titre={entree.titre}
        chapo={entree.chapo}
        publieLe={entree.publieLe}
        chemin={`/blog/${slug}`}
      />
      <FilStructure
        etapes={[
          { nom: 'Accueil', chemin: '/' },
          { nom: 'Le carnet', chemin: '/blog' },
          { nom: entree.titre, chemin: `/blog/${slug}` },
        ]}
      />

      <p className={styles.fil}>
        <Link href="/blog">Le carnet</Link> · {enFrancais(entree.publieLe)} · {entree.minutes} min
      </p>

      <article className={propres.article}>
        <h1>{entree.titre}</h1>
        <p className={propres.chapoArticle}>{entree.chapo}</p>

        {entree.blocs.map((bloc, index) => (
          <Rendu key={`${bloc.type}-${index}`} bloc={bloc} />
        ))}
      </article>

      {cites.length > 0 && (
        <section className={styles.section}>
          <h2>Les contrôles concernés</h2>
          <p>
            Ces points ne sont pas des exemples choisis pour l’article : ce sont des contrôles du
            référentiel, appliqués tels quels à chaque dossier.
          </p>
          <div className={propres.controlesCites}>
            {cites.map((controle) => (
              <Link
                key={controle.id}
                href={`/controles/${SLUG_FAMILLE[controle.famille]}#${controle.id}`}
                className={propres.controleCite}
              >
                <span className={styles.reference}>{controle.id}</span>
                <span>{controle.titre}</span>
              </Link>
            ))}
          </div>

          <div className={styles.appels}>
            <Link href="/dossier" className={styles.boutonPrimaire}>
              Vérifier ce point sur un bail
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
