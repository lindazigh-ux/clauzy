import { describe, expect, it } from 'vitest'

import { NOMBRE_CONTROLES } from '@/domain/controles'
import { BAUX } from '@/domain/corpus/baux'

import { lancerAnalyse, lireFichier, workerDisponible } from './client'

/**
 * Sous Vitest en environnement node, `Worker` n'existe pas : c'est le chemin de
 * repli qui est exerce ici. Le comportement dans un vrai navigateur est couvert
 * par les tests de bout en bout (Playwright), qui verifient en plus que
 * l'interface reste repondante pendant l'analyse.
 */
describe('client d’analyse', () => {
  it('signale explicitement le chemin emprunté', async () => {
    const bail = BAUX[0]
    if (bail === undefined) throw new Error('Corpus vide')

    const { analyse, dansUnWorker } = await lancerAnalyse([
      { id: bail.id, role: 'OBLIGATION', texte: bail.texte },
    ])

    expect(dansUnWorker).toBe(workerDisponible())
    expect(analyse.resultats).toHaveLength(NOMBRE_CONTROLES)
  })

  it('rend un résultat par contrôle quel que soit le chemin', async () => {
    const { analyse } = await lancerAnalyse([])
    expect(analyse.resultats).toHaveLength(NOMBRE_CONTROLES)
    expect(analyse.synthese.total).toBe(NOMBRE_CONTROLES)
  })

  it('lit un fichier par le même chemin que l’analyse', async () => {
    const contenu = new TextEncoder().encode(
      'ARTICLE 12 — ASSURANCES\nToute franchise demeure à la charge du preneur.',
    )
    const { document, dansUnWorker } = await lireFichier(
      'bail.txt',
      contenu.buffer as ArrayBuffer,
      'OBLIGATION',
    )

    expect(dansUnWorker).toBe(workerDisponible())
    expect(document.format).toBe('texte')
    expect(document.role).toBe('OBLIGATION')
    expect(document.texte).toContain('ARTICLE 12')
  })
})
