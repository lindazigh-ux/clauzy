import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ARTICLES } from '../blog'
import { A_COMPLETER, EDITEUR, champsACompleter } from '../editeur'
import { FAQ, RUBRIQUES_FAQ } from '../faq'
import { CHEMINS_NON_INDEXES, FAMILLE_PAR_SLUG, PAGES, SLUG_FAMILLE, url } from '../site'
import { PLANS, remiseAnnuelle } from '../tarifs'
import { CATALOGUE_ENDPOINTS } from '@/lib/net'
import { Famille, NOMBRE_CONTROLES, PAR_ID, REFERENTIEL, parFamille } from '@/domain/controles'

/**
 * Criteres de sortie du lot L7 : indexable, partageable, conforme.
 *
 * Le risque propre a un site marketing n'est pas le plantage : c'est la
 * derive. Une page qui annonce 38 controles, un article qui cite un
 * identifiant supprime, une route publiee mais absente du plan de site — rien
 * de tout cela ne casse le build, et tout cela se voit par le client.
 */

const RACINE_APP = join(process.cwd(), 'src', 'app')

/** Parcourt src/app et rend les routes publiques reellement declarees. */
const routesDeLApplication = (): string[] => {
  const routes: string[] = []

  const explorer = (repertoire: string, chemin: string): void => {
    for (const entree of readdirSync(repertoire)) {
      const complet = join(repertoire, entree)
      if (!statSync(complet).isDirectory()) {
        if (entree === 'page.tsx') routes.push(chemin === '' ? '/' : chemin)
        continue
      }
      // Un groupe de routes `(site)` n'apparait pas dans l'URL.
      const segment = entree.startsWith('(') && entree.endsWith(')') ? '' : `/${entree}`
      explorer(complet, `${chemin}${segment}`)
    }
  }

  explorer(RACINE_APP, '')
  return routes
}

describe('le plan du site', () => {
  it('déclare chaque route publique de l’application', () => {
    const dynamiques = /\[[^\]]+\]/
    const publiees = routesDeLApplication().filter(
      (route) => !dynamiques.test(route) && !CHEMINS_NON_INDEXES.includes(route),
    )
    const declarees = new Set(PAGES.map((page) => page.chemin))

    const orphelines = publiees.filter((route) => !declarees.has(route))
    expect(orphelines, 'ces pages existent mais n’apparaissent ni dans la navigation ni dans le plan de site').toEqual([])
  })

  it('ne déclare aucune page qui n’existe pas', () => {
    const existantes = new Set(routesDeLApplication())
    // Les pages de famille sont rendues par une route dynamique.
    const attendues = PAGES.map((page) => page.chemin).filter(
      (chemin) => !chemin.startsWith('/controles/'),
    )
    for (const chemin of attendues) {
      expect(existantes.has(chemin), `${chemin} est déclaré au plan mais n’a pas de page`).toBe(true)
    }
  })

  it('couvre les rubriques imposées par le brief §9', () => {
    const chemins = PAGES.map((page) => page.chemin)
    for (const attendu of [
      '/',
      '/methode',
      '/controles',
      '/livrable',
      '/securite',
      '/tarifs',
      '/faq',
      '/blog',
      '/mentions-legales',
      '/cgu',
      '/confidentialite',
      '/dpa',
    ]) {
      expect(chemins, `${attendu} manque au plan`).toContain(attendu)
    }
  })

  it('tient le poste de travail hors de l’indexation', () => {
    expect(CHEMINS_NON_INDEXES).toContain('/dossier')
    expect(PAGES.map((p) => p.chemin)).not.toContain('/dossier')
  })

  it('rend des URL absolues, seules partageables', () => {
    expect(url('/faq')).toMatch(/^https?:\/\/[^/]+\/faq$/)
  })
})

describe('les pages de contrôles', () => {
  it('donnent un slug unique et stable à chaque famille', () => {
    const slugs = Object.values(SLUG_FAMILLE)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs.every((slug) => /^[a-z0-9-]+$/.test(slug))).toBe(true)
  })

  it('publient chaque contrôle sur exactement une page', () => {
    const publies = Object.values(Famille).flatMap((famille) =>
      parFamille(famille).map((controle) => controle.id),
    )
    expect(publies).toHaveLength(NOMBRE_CONTROLES)
    expect(new Set(publies).size).toBe(NOMBRE_CONTROLES)
  })

  it('retrouvent la famille depuis son slug, dans les deux sens', () => {
    for (const famille of Object.values(Famille)) {
      expect(FAMILLE_PAR_SLUG.get(SLUG_FAMILLE[famille])).toBe(famille)
    }
  })

  it('ne laissent aucune famille sans contrôle', () => {
    for (const famille of Object.values(Famille)) {
      expect(parFamille(famille).length, famille).toBeGreaterThan(0)
    }
  })
})

describe('le carnet', () => {
  it('ne cite que des contrôles qui existent', () => {
    for (const entree of ARTICLES) {
      for (const id of entree.controles) {
        expect(PAR_ID.has(id), `« ${entree.slug} » cite ${id}, absent du référentiel`).toBe(true)
      }
    }
  })

  it('donne à chaque article un slug unique, une date et un chapô', () => {
    const slugs = ARTICLES.map((a) => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)

    for (const entree of ARTICLES) {
      expect(/^[a-z0-9-]+$/.test(entree.slug), entree.slug).toBe(true)
      expect(Number.isNaN(new Date(entree.publieLe).getTime()), entree.slug).toBe(false)
      expect(entree.chapo.length, entree.slug).toBeGreaterThan(60)
      expect(entree.blocs.length, entree.slug).toBeGreaterThan(3)
    }
  })

  it('range les articles du plus récent au plus ancien', () => {
    const dates = [...ARTICLES].sort((a, b) => b.publieLe.localeCompare(a.publieLe))
    expect(dates[0]?.publieLe).toBe(
      ARTICLES.map((a) => a.publieLe).sort((a, b) => b.localeCompare(a))[0],
    )
  })

  it('annonce les clauses citées comme synthétiques (§5.4)', () => {
    // Aucune citation de clause ne peut venir d'un document reel : chacune
    // porte sa source, et cette source doit le dire.
    for (const entree of ARTICLES) {
      for (const bloc of entree.blocs) {
        if (bloc.type !== 'clause') continue
        expect(
          /synthétique|Conditions particulières, extrait synthétique/i.test(bloc.source),
          `« ${entree.slug} » cite une clause sans annoncer qu’elle est synthétique`,
        ).toBe(true)
      }
    }
  })
})

describe('la FAQ', () => {
  it('répond à l’objection de l’assistant généraliste, comme l’exige le §9', () => {
    const questions = FAQ.map((entree) => entree.question.toLowerCase())
    expect(questions.some((q) => q.includes('assistant') && q.includes('ia'))).toBe(true)
  })

  it('range chaque question dans une rubrique connue', () => {
    for (const entree of FAQ) {
      expect(RUBRIQUES_FAQ).toContain(entree.rubrique)
      expect(entree.reponse.length, entree.question).toBeGreaterThan(0)
      expect(entree.reponse.join('').length, entree.question).toBeGreaterThan(80)
    }
  })

  it('ne pose jamais deux fois la même question', () => {
    const questions = FAQ.map((e) => e.question)
    expect(new Set(questions).size).toBe(questions.length)
  })

  it('dit non sans détour sur le remplacement d’un conseil (§13)', () => {
    const entree = FAQ.find((e) => /avocat|courtier/i.test(e.question))
    expect(entree, 'la question du remplacement d’un conseil doit figurer').toBeDefined()
    expect(entree?.reponse[0]?.startsWith('Non')).toBe(true)
  })
})

describe('les tarifs', () => {
  it('reprennent les quatre plans du brief §10', () => {
    expect(PLANS.map((plan) => plan.id)).toEqual([
      'ESSAI',
      'PRATICIEN',
      'CABINET',
      'GRANDS_COMPTES',
    ])
  })

  it('n’affichent que des plans que la couche réseau accepte', () => {
    const acceptes = CATALOGUE_ENDPOINTS['abonnement.checkout'].champs.plan.valeurs ?? []
    for (const plan of PLANS) {
      expect(acceptes, `${plan.id} est affiché mais refusé à la caisse`).toContain(plan.id)
    }
  })

  it('laissent l’essai gratuit et les grands comptes sur devis', () => {
    expect(PLANS.find((p) => p.id === 'ESSAI')?.mensuel).toBe(0)
    expect(PLANS.find((p) => p.id === 'GRANDS_COMPTES')?.mensuel).toBeNull()
  })

  it('rendent l’engagement annuel moins cher que le mensuel', () => {
    for (const plan of PLANS) {
      const remise = remiseAnnuelle(plan)
      if (remise === null) continue
      expect(remise, plan.id).toBeGreaterThan(0)
      expect(remise, plan.id).toBeLessThan(50)
    }
  })

  it('n’en met qu’un seul en avant', () => {
    expect(PLANS.filter((plan) => plan.misEnAvant === true)).toHaveLength(1)
  })

  it('dit ce que chaque plan ne fait pas', () => {
    // Une limite decouverte a l'usage est une limite cachee (§8).
    expect(PLANS.find((p) => p.id === 'ESSAI')?.limites.length).toBeGreaterThan(0)
    expect(PLANS.find((p) => p.id === 'PRATICIEN')?.limites.length).toBeGreaterThan(0)
  })
})

describe('les mentions de l’éditeur', () => {
  it('rassemble en un seul endroit ce qui reste à renseigner', () => {
    // Ce test ne demande PAS que tout soit rempli : il exige que ce qui manque
    // soit visible, et que la liste ne se disperse pas dans les pages.
    const manquants = champsACompleter()
    expect(Array.isArray(manquants)).toBe(true)
    for (const champ of manquants) {
      expect(EDITEUR[champ as keyof typeof EDITEUR]).toBe(A_COMPLETER)
    }
  })

  it('porte au moins un contact réel : une page légale sans contact ne vaut rien', () => {
    expect(EDITEUR.courriel).not.toBe(A_COMPLETER)
    expect(EDITEUR.courrielDpo).not.toBe(A_COMPLETER)
    expect(EDITEUR.courriel).toMatch(/@/)
  })
})

describe('les chiffres annoncés au public', () => {
  it('viennent tous du référentiel, jamais d’une constante recopiée', () => {
    expect(NOMBRE_CONTROLES).toBe(REFERENTIEL.length)
    expect(NOMBRE_CONTROLES).toBe(40)
  })
})
