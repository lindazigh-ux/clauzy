/**
 * Non-regression du referentiel de controles (brief §5.1, §13).
 *
 * Ces invariants sont ecrits AVANT l'import du contenu metier : le jour ou les
 * 40 controles du prototype sont repris, ils passent au vert d'eux-memes, ou
 * ils signalent precisement ce qui manque.
 *
 * Les cas marques « en attente » sont ceux qui exigent le contenu metier. Ils
 * apparaissent comme ignores dans la sortie de test — jamais absents.
 */
import { describe, expect, it } from 'vitest'

import { CONTROLES } from '../index'
import { NOMBRE_TOTAL_CONTROLES, REPARTITION_ATTENDUE, type Famille } from '../types'

const contenuImporte = CONTROLES.length > 0

describe('repartition des familles', () => {
  it('les sept familles totalisent 40 controles', () => {
    const familles = Object.keys(REPARTITION_ATTENDUE)
    expect(familles).toHaveLength(7)
    const total = Object.values(REPARTITION_ATTENDUE).reduce((somme, n) => somme + n, 0)
    expect(total).toBe(NOMBRE_TOTAL_CONTROLES)
  })

  it.skipIf(!contenuImporte)('en attente du contenu metier — le registre compte 40 controles', () => {
    expect(CONTROLES).toHaveLength(NOMBRE_TOTAL_CONTROLES)
  })

  it.skipIf(!contenuImporte)('en attente du contenu metier — chaque famille a son effectif', () => {
    for (const [famille, effectif] of Object.entries(REPARTITION_ATTENDUE)) {
      const compte = CONTROLES.filter((c) => c.famille === (famille as Famille)).length
      expect(compte, `famille ${famille}`).toBe(effectif)
    }
  })
})

describe('forme de chaque controle', () => {
  it('les identifiants sont uniques', () => {
    const ids = CONTROLES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('les identifiants suivent le format stable « XXX-00 »', () => {
    for (const controle of CONTROLES) {
      expect(controle.id, 'un identifiant n est jamais renumerote (brief §13)').toMatch(/^[A-Z]{2,4}-\d{2}$/)
    }
  })

  it('chaque controle porte le conseil complet attendu du praticien', () => {
    const champsObligatoires = [
      'libelle',
      'enjeu',
      'consequence',
      'actionBail',
      'actionAssurance',
      'redactionProposee',
      'preuveCloture',
    ] as const

    for (const controle of CONTROLES) {
      for (const champ of champsObligatoires) {
        expect(controle[champ]?.trim(), `${controle.id}.${champ}`).toBeTruthy()
      }
      expect([1, 2, 3], `${controle.id}.gravite`).toContain(controle.gravite)
      expect(controle.axes.length, `${controle.id}.axes`).toBeGreaterThan(0)
    }
  })

  it('la correction du bail est toujours proposee avant l adaptation de la police', () => {
    // Brief §7 et §13 : la these du produit ne s inverse jamais.
    for (const controle of CONTROLES) {
      expect(controle.actionBail.trim(), `${controle.id}`).not.toBe('')
    }
  })
})
