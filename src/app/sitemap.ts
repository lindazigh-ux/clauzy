import type { MetadataRoute } from 'next'

import { ARTICLES, ARTICLES_RECENTS } from '@/contenu/blog'
import { PAGES, url } from '@/contenu/site'

/**
 * sitemap.xml (brief §9).
 *
 * Genere depuis le plan de site et depuis les articles : une page publiee sans
 * etre declaree au plan serait absente d'ici, donc invisible des moteurs. Un
 * test verifie qu'aucune route de l'application n'echappe au plan.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const dernierArticle = ARTICLES_RECENTS[0]?.publieLe

  const pages = PAGES.map((page) => ({
    url: url(page.chemin),
    // Les pages du carnet portent la date de leur dernier article : c'est la
    // seule date honnete dont nous disposions pour une page d'index.
    lastModified: page.chemin === '/blog' ? dernierArticle : undefined,
    changeFrequency:
      page.rubrique === 'legal' ? ('yearly' as const) : ('monthly' as const),
    priority: page.priorite,
  }))

  const articles = ARTICLES.map((entree) => ({
    url: url(`/blog/${entree.slug}`),
    lastModified: entree.publieLe,
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }))

  return [...pages, ...articles]
}
