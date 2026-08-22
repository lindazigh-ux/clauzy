import { describe, expect, it } from 'vitest'

import { analyser, type DocumentAnalyse } from '../../moteur/moteur'
import { LIBELLE_PREUVE } from '../../garanties/types'
import { DOSSIERS_AUDIT } from './dossiers'
import type { DossierAudit } from './types'
import { Variete } from './varietes'

/**
 * LE GOLDEN DATASET (brief §12 à §14).
 *
 * Chaque cas porte son résultat attendu, écrit avant que le moteur ne tourne.
 * Ce test ne mesure donc pas la capacité du moteur à se confirmer lui-même : il
 * mesure l'écart entre ce qu'un courtier lit et ce que l'outil conclut.
 *
 * Quand un cas échoue, c'est le moteur qu'on corrige — jamais l'attendu, sauf à
 * démontrer que l'attendu était faux, et à l'écrire dans `historique`.
 *
 * Quand l'attendu est juste mais hors de portée du moteur, il reste écrit tel
 * quel et porte une `limiteConnue`. Le test s'inverse alors : il vérifie que la
 * limite TIENT toujours. Le jour où le moteur y arrive, le cas échoue en
 * demandant qu'on promeuve l'attendu — une lacune ne se périme pas en silence.
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

    it('ne produit jamais deux fois la même garantie', () => {
      const ids = analyse.rapprochements.map((r) => r.garantieId)
      expect(ids.length, 'doublon au rapprochement').toBe(new Set(ids).size)
    })

    for (const attendu of cas.garanties) {
      if (attendu.limiteConnue !== undefined) {
        it(`${attendu.garantieId} → ${LIBELLE_PREUVE[attendu.niveau]} — LIMITE CONNUE`, () => {
          const obtenu = trouvees.get(attendu.garantieId)?.niveau
          expect(
            obtenu,
            `La limite est levée : le moteur atteint désormais l’attendu.\n` +
              `Promouvoir l’attendu en retirant sa limiteConnue.\n${attendu.limiteConnue}`,
          ).not.toBe(attendu.niveau)
        })
        continue
      }

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
          expect(texte).not.toMatch(/^ARTICLE\s+\d+\s*[—-]\s*[A-ZÉÈÀÂÎÔÛÄËÏÖÜ\s’']+$/)
        })
      }

      if (attendu.actionContient !== undefined) {
        it(`${attendu.garantieId} — la recommandation correspond à la nature du problème`, () => {
          expect(trouvees.get(attendu.garantieId)?.recommandation.phrase ?? '').toContain(
            attendu.actionContient,
          )
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

    for (const limite of cas.limitesControles ?? []) {
      it(`${limite.controleId} — LIMITE CONNUE : écart attendu, « à vérifier » obtenu`, () => {
        const resultat = analyse.resultats.find((r) => r.controleId === limite.controleId)
        expect(
          resultat?.statut,
          `La limite est levée sur ${limite.controleId} : promouvoir l’attendu.\n${limite.pourquoi}`,
        ).not.toBe('ECART')
        // Une limite n'autorise pas le silence : le contrôle doit au minimum
        // ressortir « à vérifier », jamais « conforme ».
        expect(resultat?.statut, 'une limite ne doit jamais devenir une conformité').not.toBe(
          'CONFORME',
        )
      })
    }

    it('signale exactement les incohérences attendues', () => {
      expect([...analyse.incoherences.map((i) => i.regleId)].sort()).toEqual(
        [...cas.incoherences].sort(),
      )
    })
  },
)

describe('le Golden Dataset lui-même', () => {
  it('compte cinquante dossiers, tous distincts', () => {
    expect(DOSSIERS_AUDIT).toHaveLength(50)
    expect(new Set(DOSSIERS_AUDIT.map((c) => c.id)).size).toBe(50)
    expect(new Set(DOSSIERS_AUDIT.map((c) => c.bail)).size).toBe(50)
  })

  it('dit pour chaque cas ce qu’il met à l’épreuve', () => {
    for (const cas of DOSSIERS_AUDIT) {
      expect(cas.enjeu.length, cas.id).toBeGreaterThan(40)
    }
  })

  it('couvre les cinq niveaux de preuve', () => {
    const niveaux = new Set(DOSSIERS_AUDIT.flatMap((c) => c.garanties.map((g) => g.niveau)))
    for (const attendu of [
      'ETABLIE',
      'JUSTIFICATION_INSUFFISANTE',
      'PROBABLE',
      'NON_DEMONTREE',
      'ECART_CONFIRME',
    ]) {
      expect(niveaux, `aucun cas ne teste ${attendu}`).toContain(attendu)
    }
  })

  it('couvre chacune des variétés que le brief énumère', () => {
    const couvertes = new Set(DOSSIERS_AUDIT.flatMap((c) => c.varietes))
    const manquantes = Object.values(Variete).filter((v) => !couvertes.has(v))
    expect(manquantes, 'variétés du §13 sans aucun dossier').toEqual([])
  })

  it('date le gel de chaque attendu', () => {
    for (const cas of DOSSIERS_AUDIT) {
      expect(cas.figeLe, cas.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('justifie chaque correction d’attendu', () => {
    for (const cas of DOSSIERS_AUDIT) {
      for (const correction of cas.historique ?? []) {
        expect(correction.le, cas.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(correction.quoi.length, `${cas.id} — « quoi » trop court`).toBeGreaterThan(20)
        expect(correction.pourquoi.length, `${cas.id} — « pourquoi » trop court`).toBeGreaterThan(40)
      }
    }
  })

  it('justifie chaque limite connue', () => {
    for (const cas of DOSSIERS_AUDIT) {
      for (const garantie of cas.garanties) {
        if (garantie.limiteConnue === undefined) continue
        expect(
          garantie.limiteConnue.length,
          `${cas.id} — une limite doit dire ce que le moteur ne sait pas encore faire`,
        ).toBeGreaterThan(80)
      }
      for (const limite of cas.limitesControles ?? []) {
        expect(limite.pourquoi.length, `${cas.id} — ${limite.controleId}`).toBeGreaterThan(80)
      }
    }
  })
})
