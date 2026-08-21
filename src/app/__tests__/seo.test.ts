import { describe, expect, it } from 'vitest'

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import robots from '../robots'
import sitemap from '../sitemap'
import { ARTICLES } from '@/contenu/blog'
import { CHEMINS_NON_INDEXES, PAGES, partage, url } from '@/contenu/site'

/**
 * Critere de sortie du lot L7 : indexable, partageable.
 *
 * Un plan de site incomplet ne se voit pas : la page existe, elle se charge,
 * elle n'est simplement jamais visitee. C'est le genre de defaut qu'on
 * decouvre six mois plus tard, dans une console de moteur de recherche.
 */

describe('robots.txt', () => {
  const regles = robots()

  it('autorise l’exploration du site', () => {
    const regle = Array.isArray(regles.rules) ? regles.rules[0] : regles.rules
    expect(regle?.allow).toBe('/')
  })

  it('exclut le poste de travail et les routes d’API', () => {
    const regle = Array.isArray(regles.rules) ? regles.rules[0] : regles.rules
    const interdits = regle?.disallow
    const liste = Array.isArray(interdits) ? interdits : [interdits]
    for (const chemin of CHEMINS_NON_INDEXES) expect(liste).toContain(chemin)
    expect(liste).toContain('/api/')
  })

  it('désigne le plan de site en absolu', () => {
    expect(regles.sitemap).toBe(url('/sitemap.xml'))
  })
})

describe('sitemap.xml', () => {
  const entrees = sitemap()

  it('publie chaque page du plan', () => {
    const adresses = new Set(entrees.map((entree) => entree.url))
    for (const page of PAGES) {
      expect(adresses.has(url(page.chemin)), `${page.chemin} manque au plan de site`).toBe(true)
    }
  })

  it('publie chaque article du carnet', () => {
    const adresses = new Set(entrees.map((entree) => entree.url))
    for (const entree of ARTICLES) {
      expect(adresses.has(url(`/blog/${entree.slug}`)), entree.slug).toBe(true)
    }
  })

  it('n’expose jamais le poste de travail', () => {
    for (const chemin of CHEMINS_NON_INDEXES) {
      expect(entrees.some((entree) => entree.url === url(chemin))).toBe(false)
    }
  })

  it('n’annonce aucune adresse deux fois', () => {
    const adresses = entrees.map((entree) => entree.url)
    expect(new Set(adresses).size).toBe(adresses.length)
  })

  it('donne à l’accueil la priorité maximale', () => {
    expect(entrees.find((entree) => entree.url === url('/'))?.priority).toBe(1)
  })

  it('n’écrit que des URL absolues', () => {
    for (const entree of entrees) {
      expect(entree.url.startsWith('http'), entree.url).toBe(true)
    }
  })

  it('date les articles de leur publication', () => {
    for (const article of ARTICLES) {
      const entree = entrees.find((e) => e.url === url(`/blog/${article.slug}`))
      expect(entree?.lastModified).toBe(article.publieLe)
    }
  })
})

describe('les métadonnées de partage', () => {
  const resultat = partage({
    titre: 'Un titre',
    description: 'Une description.',
    chemin: '/methode',
  })

  it('portent une canonique absolue', () => {
    expect(resultat.alternates.canonical).toBe(url('/methode'))
  })

  it('portent toujours une image, avec ses dimensions', () => {
    const image = resultat.openGraph.images[0]
    expect(image?.url).toBe(url('/opengraph-image'))
    expect(image?.width).toBe(1200)
    expect(image?.height).toBe(630)
    expect(resultat.twitter.images[0]).toBe(url('/opengraph-image'))
  })

  it('datent un article quand la date est connue', () => {
    const article = partage({
      titre: 'Un article',
      description: 'Un chapô.',
      chemin: '/blog/x',
      type: 'article',
      publieLe: '2026-07-03',
    })
    expect(article.openGraph.publishedTime).toBe('2026-07-03')
    expect(resultat.openGraph).not.toHaveProperty('publishedTime')
  })
})

describe('aucune page ne peut oublier son image de partage', () => {
  /**
   * Dans Next, une page qui redefinit `openGraph` REMPLACE l'objet du layout
   * au lieu de le completer : elle perd alors son image, sans rien signaler.
   * Le defaut ne se voit qu'une fois le lien colle dans une conversation.
   *
   * Ce test lit les sources plutot que d'executer Next : il verifie que chaque
   * page publique passe par `partage()`, et qu'aucune ne rebricole un
   * `openGraph` a la main.
   */
  const RACINE_SITE = join(process.cwd(), 'src', 'app', '(site)')

  const pages = (repertoire: string): string[] =>
    readdirSync(repertoire).flatMap((entree) => {
      const complet = join(repertoire, entree)
      if (statSync(complet).isDirectory()) return pages(complet)
      return entree === 'page.tsx' ? [complet] : []
    })

  const fichiers = pages(RACINE_SITE)

  it('trouve bien toutes les pages du site', () => {
    expect(fichiers.length).toBeGreaterThanOrEqual(12)
  })

  it.each(fichiers.map((f) => [f.slice(process.cwd().length + 1), f]))(
    '%s passe par partage()',
    (_nom, fichier) => {
      const source = readFileSync(fichier as string, 'utf8')
      expect(source).toContain('partage(')
      // Un openGraph ecrit a la main contournerait la garantie.
      expect(source).not.toMatch(/^\s*openGraph: \{/m)
    },
  )
})
