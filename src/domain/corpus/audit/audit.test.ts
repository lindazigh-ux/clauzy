import { describe, expect, it } from 'vitest'

import { analyser, type DocumentAnalyse } from '../../moteur/moteur'
import { LIBELLE_PREUVE } from '../../garanties/types'
import { DOSSIERS_AUDIT, type DossierAudit } from './dossiers'

/**
 * L'AUDIT DES DIX DOSSIERS.
 *
 * Chaque cas porte son résultat attendu, écrit avant que le moteur ne tourne.
 * Ce test ne mesure donc pas la capacité du moteur à se confirmer lui-même : il
 * mesure l'écart entre ce qu'un courtier lit et ce que l'outil conclut.
 *
 * Quand un cas échoue, c'est le moteur qu'on corrige — jamais l'attendu, sauf
 * à démontrer que l'attendu était faux, et à l'écrire.
 */

const documents = (cas: DossierAudit): DocumentAnalyse[] => [
  { id: 'bail', role: 'OBLIGATION', texte: cas.bail },
  ...(cas.contrat === null ? [] : [{ id: 'cp', role: 'COUVERTURE' as const, texte: cas.contrat }]),
  ...(cas.attestation === null
    ? []
    : [{ id: 'att', role: 'ATTESTATION' as const, texte: cas.attestation }]),
]

describe.each(DOSSIERS_AUDIT.map((cas) => [`${cas.id} — ${cas.intitule}`, cas]))(
  '%s',
  (_intitule, cas) => {
    const analyse = analyser(documents(cas))
    const trouvees = new Map(analyse.rapprochements.map((r) => [r.garantieId, r]))

    it('rend un résultat par contrôle, quoi qu’il arrive', () => {
      expect(analyse.resultats.length).toBe(new Set(analyse.resultats.map((r) => r.controleId)).size)
      expect(analyse.resultats.length).toBeGreaterThanOrEqual(40)
    })

    for (const attendu of cas.garanties) {
      it(`${attendu.garantieId} → ${LIBELLE_PREUVE[attendu.niveau]}`, () => {
        const trouvee = trouvees.get(attendu.garantieId)
        expect(trouvee, `${cas.enjeu}\ngarantie non reconnue : ${attendu.garantieId}`).toBeDefined()
        expect(
          trouvee?.niveau,
          `${cas.enjeu}\nattendu ${attendu.niveau}, obtenu ${trouvee?.niveau}`,
        ).toBe(attendu.niveau)
      })

      if (attendu.extraitContient !== undefined) {
        it(`${attendu.garantieId} — l’extrait cité est la bonne stipulation`, () => {
          const texte = trouvees.get(attendu.garantieId)?.exigence?.stipulation.texte ?? ''
          expect(texte, 'extrait cité').toContain(attendu.extraitContient)
          // Un intitulé d'article n'est jamais une stipulation.
          expect(texte).not.toMatch(/^ARTICLE\s+\d/)
        })
      }

      if (attendu.actionContient !== undefined) {
        it(`${attendu.garantieId} — la recommandation correspond à la nature du problème`, () => {
          expect(trouvees.get(attendu.garantieId)?.action ?? '').toContain(attendu.actionContient)
        })
      }
    }

    if (cas.interdites.length > 0) {
      it('ne reconnaît aucune garantie qui n’a rien à faire ici', () => {
        const fautives = cas.interdites.filter((id) => trouvees.has(id))
        expect(fautives, `${cas.enjeu}\nreconnues à tort`).toEqual([])
      })
    }

    it('conclut à l’écart sur exactement les contrôles attendus', () => {
      const trouves = analyse.resultats
        .filter((r) => r.statut === 'ECART')
        .map((r) => r.controleId)
        .sort()
      expect(trouves, cas.enjeu).toEqual([...cas.ecarts].sort())
    })

    it('signale exactement les incohérences attendues', () => {
      expect([...analyse.incoherences.map((i) => i.regleId)].sort()).toEqual(
        [...cas.incoherences].sort(),
      )
    })
  },
)

describe('le banc d’essai lui-même', () => {
  it('compte dix dossiers, tous distincts', () => {
    expect(DOSSIERS_AUDIT).toHaveLength(10)
    expect(new Set(DOSSIERS_AUDIT.map((c) => c.id)).size).toBe(10)
    expect(new Set(DOSSIERS_AUDIT.map((c) => c.bail)).size).toBe(10)
  })

  it('dit pour chaque cas ce qu’il met à l’épreuve', () => {
    for (const cas of DOSSIERS_AUDIT) {
      expect(cas.enjeu.length, cas.id).toBeGreaterThan(40)
    }
  })

  it('couvre les cinq niveaux de preuve', () => {
    const niveaux = new Set(DOSSIERS_AUDIT.flatMap((c) => c.garanties.map((g) => g.niveau)))
    for (const attendu of ['ETABLIE', 'JUSTIFICATION_INSUFFISANTE', 'PROBABLE', 'NON_DEMONTREE', 'ECART_CONFIRME']) {
      expect(niveaux, `aucun cas ne teste ${attendu}`).toContain(attendu)
    }
  })
})
