/**
 * Test d'architecture — « Une couche unique src/lib/net/ centralise tous les
 * appels reseau. Aucun fetch ailleurs. » (brief §2)
 *
 * Ce test lit le code source. Il attrape ce que le garde ne peut pas attraper :
 * un appel reseau qui contournerait entierement la couche src/lib/net.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

import { describe, expect, it } from 'vitest'

const RACINE = join(import.meta.dirname, '..', '..')
const SOURCE = join(RACINE, 'src')
const COUCHE_RESEAU = join('src', 'lib', 'net')

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs']

/** Primitives capables d'ouvrir une connexion sortante. */
const PRIMITIVES_RESEAU: readonly { readonly motif: RegExp; readonly nom: string }[] = [
  { motif: /(^|[^.\w])fetch\s*\(/, nom: 'fetch()' },
  { motif: /new\s+XMLHttpRequest\b/, nom: 'XMLHttpRequest' },
  { motif: /navigator\.sendBeacon\b/, nom: 'navigator.sendBeacon' },
  { motif: /new\s+WebSocket\b/, nom: 'WebSocket' },
  { motif: /new\s+EventSource\b/, nom: 'EventSource' },
  { motif: /\bimport\s*\(\s*['"]https?:/, nom: 'import() distant' },
  { motif: /\bnavigator\.serviceWorker\.register\b/, nom: 'service worker' },
]

const sansCommentaires = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const fichiersSource = (dossier: string): string[] => {
  const trouves: string[] = []
  for (const entree of readdirSync(dossier)) {
    if (entree === 'node_modules' || entree === '.next') continue
    const chemin = join(dossier, entree)
    if (statSync(chemin).isDirectory()) {
      trouves.push(...fichiersSource(chemin))
    } else if (EXTENSIONS.some((ext) => entree.endsWith(ext))) {
      trouves.push(chemin)
    }
  }
  return trouves
}

describe('aucun appel reseau hors de src/lib/net', () => {
  const fichiers = fichiersSource(SOURCE)

  it('trouve bien des fichiers a inspecter', () => {
    expect(fichiers.length).toBeGreaterThan(0)
  })

  it('ne laisse aucune primitive reseau en dehors de la couche dediee', () => {
    const infractions: string[] = []

    for (const fichier of fichiers) {
      const cheminRelatif = relative(RACINE, fichier)
      if (cheminRelatif.startsWith(COUCHE_RESEAU + sep)) continue

      const lignes = sansCommentaires(readFileSync(fichier, 'utf-8')).split('\n')
      lignes.forEach((ligne, index) => {
        for (const { motif, nom } of PRIMITIVES_RESEAU) {
          if (motif.test(ligne)) infractions.push(`${cheminRelatif}:${index + 1} — ${nom}`)
        }
      })
    }

    expect(
      infractions,
      'Tout appel reseau passe par appelApi() dans src/lib/net (brief §2).',
    ).toEqual([])
  })

  it('la couche reseau expose un unique appel sortant', () => {
    const source = sansCommentaires(readFileSync(join(SOURCE, 'lib', 'net', 'index.ts'), 'utf-8'))
    const appels = source.match(/(^|[^.\w])fetch\s*\(/g) ?? []
    expect(appels).toHaveLength(1)
  })
})
