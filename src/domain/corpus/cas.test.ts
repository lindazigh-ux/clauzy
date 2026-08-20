import { describe, expect, it } from 'vitest'

import { REFERENTIEL, Statut } from '../controles'
import { SEUIL_CONCLUSION, SEUIL_SIGNAL } from '../moteur/confiance'
import { analyser } from '../moteur/moteur'

import { CAS, LACUNES_CONNUES, VARIANTES_COUVERTES, documentDuCas, type ClauseTest } from './cas'

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

describe('rédactions de rattrapage', () => {
  const articleDe = (controleId: string) => {
    const cas = CAS.find((c) => c.controleId === controleId)
    if (cas === undefined) throw new Error(`Aucun cas pour ${controleId}`)
    return cas.positif.article
  }

  it('sont toutes rattachées à un contrôle existant', () => {
    for (const variante of VARIANTES_COUVERTES) {
      expect(REFERENTIEL.some((c) => c.id === variante.controleId), variante.controleId).toBe(true)
    }
  })

  it.each(VARIANTES_COUVERTES)('$controleId — « $redaction » est reconnue', (variante) => {
    const resultat = analyserClause(
      { article: articleDe(variante.controleId), texte: variante.redaction },
      variante.controleId,
    )
    expect(
      resultat.diagnostic.confianceObligation,
      `${variante.controleId} : ${variante.motif}. Le motif a-t-il été resserré ?`,
    ).toBeGreaterThanOrEqual(SEUIL_CONCLUSION)
  })
})

describe('lacunes de rappel encore ouvertes', () => {
  it('ne sont toujours pas reconnues — sinon, il faut les déplacer', () => {
    for (const lacune of LACUNES_CONNUES) {
      const controle = REFERENTIEL.find((c) => c.id === lacune.controleId)
      expect(controle, lacune.controleId).toBeDefined()
      const reconnue = controle?.detecteursObligation.some((d) => d.pattern.test(lacune.redaction))
      expect(
        reconnue,
        `La lacune « ${lacune.motif} » semble comblée. C’est une bonne nouvelle : ` +
          `déplacez cette entrée vers VARIANTES_COUVERTES.`,
      ).toBe(false)
    }
  })
})
