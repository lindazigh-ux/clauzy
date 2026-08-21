import { describe, expect, it } from 'vitest'

import { NOMBRE_CONTROLES, Nature, Origine, REFERENTIEL, Statut } from '../controles'
import { BAUX, PIECES } from '../corpus/baux'

import { SEUIL_CONCLUSION } from './confiance'
import { analyser, type DocumentAnalyse } from './moteur'

const bail = (id: string): DocumentAnalyse => {
  const trouve = BAUX.find((b) => b.id === id)
  if (trouve === undefined) throw new Error(`Bail introuvable : ${id}`)
  return { id: trouve.id, role: 'OBLIGATION', texte: trouve.texte }
}

const piece = (id: string): DocumentAnalyse => {
  const trouve = PIECES.find((p) => p.id === id)
  if (trouve === undefined) throw new Error(`Pièce introuvable : ${id}`)
  return { id: trouve.id, role: 'COUVERTURE', texte: trouve.texte }
}

describe('aucun contrôle ne disparaît (brief §5.2)', () => {
  it.each(BAUX)('$libelle produit un résultat par contrôle', (b) => {
    const analyse = analyser([{ id: b.id, role: 'OBLIGATION', texte: b.texte }])
    expect(analyse.resultats).toHaveLength(NOMBRE_CONTROLES)
    expect(new Set(analyse.resultats.map((r) => r.controleId)).size).toBe(NOMBRE_CONTROLES)
  })

  it('produit un résultat par contrôle même sans aucun document', () => {
    expect(analyser([]).resultats).toHaveLength(NOMBRE_CONTROLES)
  })

  it('produit un résultat par contrôle sur un document vide ou illisible', () => {
    for (const texte of ['', '   ', 'binaire illisible']) {
      expect(analyser([{ id: 'x', role: 'OBLIGATION', texte }]).resultats).toHaveLength(
        NOMBRE_CONTROLES,
      )
    }
  })

  it('suit exactement l’ordre de lecture du référentiel', () => {
    const analyse = analyser([bail('bail-cc')])
    expect(analyse.resultats.map((r) => r.controleId)).toEqual(REFERENTIEL.map((c) => c.id))
  })

  it('attribue à chaque résultat un statut connu, une origine et un motif', () => {
    for (const resultat of analyser([bail('bail-log')]).resultats) {
      expect(Object.values(Statut)).toContain(resultat.statut)
      expect(resultat.origine).toBe(Origine.MOTEUR)
      expect(resultat.diagnostic.motif.length).toBeGreaterThan(20)
    }
  })
})

describe('la nature du contrôle commande le statut', () => {
  const sansPiece = analyser([bail('bail-cc')])
  const statutDe = (id: string) => sansPiece.resultats.find((r) => r.controleId === id)?.statut

  it('un TRANSFERT_BAIL se conclut sur le document source seul', () => {
    // IND-02 : perte d’exploitation déléguée au bailleur. Aucune police ne
    // corrige cette rédaction — le contrôle n’a pas besoin de pièce.
    expect(statutDe('IND-02')).toBe(Statut.ECART)
  })

  it('un FORMALISME se conclut sur le document source seul', () => {
    // FOR-01 : résiliation de plein droit faute d’attestation sous huit jours.
    expect(statutDe('FOR-01')).toBe(Statut.ECART)
  })

  it('un CROISEMENT sans pièce d’assurance ne conclut jamais', () => {
    for (const controle of REFERENTIEL.filter((c) => c.nature === Nature.CROISEMENT)) {
      const resultat = sansPiece.resultats.find((r) => r.controleId === controle.id)
      expect(resultat?.statut, controle.id).not.toBe(Statut.ECART)
      expect(resultat?.statut, controle.id).not.toBe(Statut.CONFORME)
    }
  })

  it('ne laisse jamais un TRANSFERT_BAIL ou un FORMALISME en NON_DETECTE faute de pièce', () => {
    for (const controle of REFERENTIEL) {
      const concerne =
        controle.nature === Nature.TRANSFERT_BAIL || controle.nature === Nature.FORMALISME
      if (!concerne) continue
      const resultat = sansPiece.resultats.find((r) => r.controleId === controle.id)
      if ((resultat?.diagnostic.confianceObligation ?? 0) < SEUIL_CONCLUSION) continue
      expect(resultat?.statut, controle.id).toBe(Statut.ECART)
    }
  })
})

describe('confrontation aux pièces d’assurance', () => {
  it('une pièce probante fait basculer un croisement vers CONFORME', () => {
    const analyse = analyser([bail('bail-cc'), piece('cp-complete')])
    const conformes = analyse.resultats.filter((r) => r.statut === Statut.CONFORME)
    expect(conformes.length).toBeGreaterThan(0)
    for (const conforme of conformes) {
      const controle = REFERENTIEL.find((c) => c.id === conforme.controleId)
      expect([Nature.CROISEMENT, Nature.DOUBLE], conforme.controleId).toContain(controle?.nature)
    }
  })

  it('déclare la fourniture d’une pièce, ce qui change la lecture du rapport', () => {
    expect(analyser([bail('bail-cc')]).pieceCouvertureFournie).toBe(false)
    expect(analyser([bail('bail-cc'), piece('cp-complete')]).pieceCouvertureFournie).toBe(true)
  })

  it('une pièce lacunaire ne soutient pas plus d’obligations qu’une pièce complète', () => {
    const complete = analyser([bail('bail-cc'), piece('cp-complete')])
    const lacunaire = analyser([bail('bail-cc'), piece('cp-lacunaire')])
    expect(lacunaire.synthese.conformes).toBeLessThanOrEqual(complete.synthese.conformes)
  })
})

describe('le bail minimaliste', () => {
  it('ressort majoritairement sans objet, sans jamais masquer un contrôle', () => {
    const analyse = analyser([bail('bail-min')])
    expect(analyse.resultats).toHaveLength(NOMBRE_CONTROLES)
    expect(analyse.synthese.sansObjet).toBeGreaterThan(NOMBRE_CONTROLES / 2)
  })
})

describe('synthèse', () => {
  it('additionne exactement les quatre états', () => {
    const { synthese } = analyser([bail('bail-log'), piece('cp-complete')])
    expect(synthese.ecarts + synthese.conformes + synthese.sansObjet + synthese.aVerifier).toBe(
      NOMBRE_CONTROLES,
    )
  })

  it('formule la phrase de tête du rapport', () => {
    const { synthese } = analyser([bail('bail-cc'), piece('cp-complete')])
    expect(synthese.phrase).toMatch(
      /^\d+ contrôles appliqués . \d+ écarts?, \d+ conformes?, \d+ sans objet, \d+ à vérifier manuellement\.$/,
    )
  })
})

describe('extraits et ancrage', () => {
  it('chaque extrait se retrouve à l’identique dans son document', () => {
    // C’est la condition de l’ancrage natif des commentaires Word (brief §7).
    const documents = [bail('bail-cc'), piece('cp-complete')]
    const parId = new Map(documents.map((d) => [d.id, d.texte]))

    for (const resultat of analyser(documents).resultats) {
      for (const extrait of [...resultat.extraitsObligation, ...resultat.extraitsCouverture]) {
        const source = parId.get(extrait.documentId)
        expect(source, extrait.documentId).toBeDefined()
        expect(source?.slice(extrait.debut, extrait.fin)).toBe(extrait.texte)
      }
    }
  })

  it('n’attribue jamais d’extrait de couverture à un contrôle sans pièce', () => {
    for (const resultat of analyser([bail('bail-cc')]).resultats) {
      expect(resultat.extraitsCouverture).toHaveLength(0)
    }
  })
})

describe('écart chiffré', () => {
  const resultatDe = (idPiece: string, controleId: string) => {
    const analyse = analyser([bail('bail-cc'), piece(idPiece)])
    const resultat = analyse.resultats.find((r) => r.controleId === controleId)
    if (resultat === undefined) throw new Error(controleId)
    return resultat
  }

  it('refuse la conformité quand la pièce couvre le sujet en deçà de ce qui est exigé', () => {
    // C’est l’exemple du brief §7 : « RC plafonnée 3 M€ contre 8 M€ exigés ».
    // Sans cette comparaison, le contrôle ressortirait CONFORME au seul motif
    // que la police mentionne la garantie — un faux positif de conformité.
    const rc = resultatDe('cp-lacunaire', 'RC-02')
    expect(rc.statut).toBe(Statut.ECART)
    // L’espace fine insécable est celle de la typographie française : c’est ce
    // que produit toLocaleString('fr-FR'), et c’est ce qui doit figurer au rapport.
    expect(rc.resumeEcart).toBe('8\u202f000\u202f000 € exigés · 3\u202f000\u202f000 € soutenus')

    const capitaux = resultatDe('cp-lacunaire', 'DAB-04')
    expect(capitaux.statut).toBe(Statut.ECART)
    expect(capitaux.resumeEcart).toBe('2\u202f400\u202f000 € exigés · 900\u202f000 € soutenus')
  })

  it('conclut à la conformité quand la pièce est au niveau exigé', () => {
    expect(resultatDe('cp-complete', 'RC-02').statut).toBe(Statut.CONFORME)
    expect(resultatDe('cp-complete', 'DAB-04').statut).toBe(Statut.CONFORME)
  })

  it('ne chiffre un écart que sur un contrôle en écart, et dans la forme attendue', () => {
    const analyse = analyser([bail('bail-log'), piece('cp-lacunaire')])
    for (const resultat of analyse.resultats.filter((r) => r.resumeEcart !== undefined)) {
      expect(resultat.resumeEcart).toMatch(/ exigés . .+ soutenus$/)
      expect(resultat.statut).toBe(Statut.ECART)
    }
  })
})

describe('performance', () => {
  it('analyse un bail long et sa police en moins de 500 ms', () => {
    expect(analyser([bail('bail-atyp'), piece('cp-complete')]).dureeMs).toBeLessThan(500)
  })
})
