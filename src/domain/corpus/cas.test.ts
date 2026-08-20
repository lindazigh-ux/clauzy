import { describe, expect, it } from 'vitest'

import { REFERENTIEL, Statut } from '../controles'
import { SEUIL_CONCLUSION, SEUIL_SIGNAL } from '../moteur/confiance'
import { analyser } from '../moteur/moteur'

import { CAS, LACUNES_CONNUES, documentDuCas, type ClauseTest } from './cas'

/**
 * Non-regression du moteur, controle par controle (brief §5.4, §14).
 *
 * Si un motif du referentiel est reecrit et cesse de reconnaitre une redaction
 * courante, c'est ici que cela se voit — avant le client, pas devant lui.
 */

const analyserClause = (clause: ClauseTest, controleId: string) => {
  const analyse = analyser([{ id: 'bail-test', role: 'OBLIGATION', texte: documentDuCas(clause) }])
  const resultat = analyse.resultats.find((r) => r.controleId === controleId)
  if (resultat === undefined) throw new Error(`Aucun résultat pour ${controleId}`)
  return resultat
}

describe('corpus — couverture', () => {
  it('couvre les 40 contrôles du référentiel, sans doublon', () => {
    const ids = CAS.map((cas) => cas.controleId)
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual(REFERENTIEL.map((c) => c.id).sort())
  })

  it('oppose au cas positif un cas négatif sur le même sujet', () => {
    for (const cas of CAS) {
      expect(cas.positif.texte.length, cas.controleId).toBeGreaterThan(60)
      expect(cas.negatif.texte.length, cas.controleId).toBeGreaterThan(60)
      expect(cas.negatif.texte, cas.controleId).not.toBe(cas.positif.texte)
    }
  })
})

describe.each(CAS)('$controleId', (cas) => {
  it('le cas positif est reconnu avec certitude', () => {
    const resultat = analyserClause(cas.positif, cas.controleId)
    expect(
      resultat.diagnostic.confianceObligation,
      `${cas.controleId} : ${resultat.diagnostic.motif}`,
    ).toBeGreaterThanOrEqual(SEUIL_CONCLUSION)
    expect(resultat.statut).not.toBe(Statut.ABSENT_DU_BAIL)
  })

  it('le cas négatif ne déclenche rien', () => {
    const resultat = analyserClause(cas.negatif, cas.controleId)
    expect(
      resultat.diagnostic.confianceObligation,
      `${cas.controleId} : la rédaction saine a été prise pour un écart`,
    ).toBeLessThan(SEUIL_SIGNAL)
    expect(resultat.statut).toBe(Statut.ABSENT_DU_BAIL)
  })
})

describe('lacunes de rappel connues', () => {
  it('sont toutes rattachées à un contrôle existant', () => {
    for (const lacune of LACUNES_CONNUES) {
      expect(REFERENTIEL.some((c) => c.id === lacune.controleId), lacune.controleId).toBe(true)
    }
  })

  it.each(LACUNES_CONNUES)(
    '$controleId — « $redaction » n’est toujours pas reconnue',
    (lacune) => {
      const controle = REFERENTIEL.find((c) => c.id === lacune.controleId)
      const reconnue = controle?.detecteursObligation.some((d) => d.pattern.test(lacune.redaction))
      expect(
        reconnue,
        `La lacune « ${lacune.motif} » semble comblée. C’est une bonne nouvelle : ` +
          `retirez cette entrée de LACUNES_CONNUES et ajoutez la rédaction au corpus.`,
      ).toBe(false)
    },
  )
})
