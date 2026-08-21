import type { MetadataRoute } from 'next'

import { CHEMINS_NON_INDEXES, ORIGINE, url } from '@/contenu/site'

/**
 * robots.txt (brief §9).
 *
 * Le poste de travail est exclu de l'indexation : c'est un outil, pas une page
 * de contenu, et rien n'y est lisible sans dossier ouvert. Les routes d'API le
 * sont aussi — elles ne repondent qu'a des POST.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...CHEMINS_NON_INDEXES, '/api/'],
      },
    ],
    sitemap: url('/sitemap.xml'),
    host: ORIGINE,
  }
}
