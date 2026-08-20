import { describe, expect, it } from 'vitest'

import { BAUX, PIECES } from '@/domain/corpus/baux'
import {
  dossierVierge,
  ecarter,
  enregistrerAnalyse,
  majPerimetre,
  rattacher,
  resultatsAffiches,
  type Dossier,
} from '@/domain/dossier'
import { analyser } from '@/domain/moteur/moteur'

import { planifierAnnotations, passageAncre, texteDuPlan } from './annotations'

/**
 * Le critere §14 : « un rapport exporté en Word conserve chaque commentaire
 * ancré au passage original ».
 *
 * Ces tests le verifient caractere par caractere, sans ouvrir Word. Un ancrage
 * decale ne leve aucune erreur : il se voit le jour ou un commentaire atterrit
 * trois articles plus loin, devant le client.
 */

const BAIL = BAUX.find((b) => b.id === 'bail-cc')
const CP = PIECES.find((p) => p.id === 'cp-lacunaire')
if (BAIL === undefined || CP === undefined) throw new Error('Corpus incomplet')

const AUTEUR = 'A. Praticienne'

const dossierAnalyse = (): Dossier =>
  enregistrerAnalyse(
    dossierVierge('D-2026-014'),
    analyser([
      { id: BAIL.id, role: 'OBLIGATION', texte: BAIL.texte },
      { id: CP.id, role: 'COUVERTURE', texte: CP.texte },
    ]),
  )

const plan = (dossier: Dossier) =>
  planifierAnnotations(dossier, resultatsAffiches(dossier), BAIL.id, BAIL.texte, AUTEUR)

describe('le texte n’est jamais altéré', () => {
  it('se reconstitue à l’identique depuis le plan', () => {
    expect(texteDuPlan(plan(dossierAnalyse()))).toBe(BAIL.texte)
  })

  it('se reconstitue même sans aucune annotation', () => {
    const vierge = planifierAnnotations(dossierVierge(), [], BAIL.id, BAIL.texte, AUTEUR)
    expect(texteDuPlan(vierge)).toBe(BAIL.texte)
    expect(vierge.annotations).toHaveLength(0)
  })

  it('se reconstitue sur un texte d’une seule ligne', () => {
    const texte = 'Le Preneur renonce à tout recours contre le Bailleur.'
    const p = planifierAnnotations(dossierVierge(), [], 'x', texte, AUTEUR)
    expect(texteDuPlan(p)).toBe(texte)
  })
})

describe('chaque commentaire est ancré au passage original (brief §14)', () => {
  it('encadre exactement le texte relevé, pour toutes les annotations', () => {
    const p = plan(dossierAnalyse())
    expect(p.annotations.length).toBeGreaterThan(5)

    for (const annotation of p.annotations) {
      // Ce qui se trouve entre les marqueurs doit être le passage d’origine…
      expect(passageAncre(p, annotation.id), annotation.controleId).toBe(annotation.texteAncre)
      // …et ce passage doit être ce que porte réellement le document.
      expect(BAIL.texte.slice(annotation.debut, annotation.fin)).toBe(annotation.texteAncre)
    }
  })

  it('ouvre et ferme chaque plage une fois exactement', () => {
    const p = plan(dossierAnalyse())
    const compter = (type: 'debut' | 'fin' | 'renvoi') =>
      p.paragraphes.flatMap((par) => par.elements).filter((e) => e.type === type).length

    expect(compter('debut')).toBe(p.annotations.length)
    expect(compter('fin')).toBe(p.annotations.length)
    expect(compter('renvoi')).toBe(p.annotations.length)
  })

  it('donne à chaque annotation un identifiant unique', () => {
    const ids = plan(dossierAnalyse()).annotations.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('plages qui se chevauchent', () => {
  it('les rend toutes correctement, sans perdre de texte', () => {
    // Deux contrôles peuvent relever des passages qui se recouvrent : le flux
    // doit rester lisible et chaque plage rester exacte.
    const texte = 'ARTICLE 12 — ASSURANCES\nLe Preneur assure ses biens et renonce à tout recours.'
    const lignes = resultatsAffiches(dossierVierge())
    const bidon = { ...dossierVierge() }

    let dossier: Dossier = bidon
    dossier = rattacher(dossier, 'DAB-02', AUTEUR, {
      documentId: 'x',
      debut: 24,
      fin: 52,
      texte: texte.slice(24, 52),
      cote: 'OBLIGATION',
    })
    dossier = rattacher(dossier, 'RR-01', AUTEUR, {
      documentId: 'x',
      debut: 40,
      fin: 76,
      texte: texte.slice(40, 76),
      cote: 'OBLIGATION',
    })

    const p = planifierAnnotations(dossier, resultatsAffiches(dossier), 'x', texte, AUTEUR)

    expect(lignes).toHaveLength(40)
    expect(texteDuPlan(p)).toBe(texte)
    expect(p.annotations).toHaveLength(2)
    for (const annotation of p.annotations) {
      expect(passageAncre(p, annotation.id)).toBe(annotation.texteAncre)
    }
  })
})

describe('plages qui franchissent un paragraphe', () => {
  it('restent exactes de part et d’autre du saut de ligne', () => {
    const texte = 'ARTICLE 12 — ASSURANCES\nLe Preneur assure.\nIl renonce à recours.'
    let dossier = dossierVierge()
    dossier = rattacher(dossier, 'RR-01', AUTEUR, {
      documentId: 'x',
      debut: 24,
      fin: 60,
      texte: texte.slice(24, 60),
      cote: 'OBLIGATION',
    })

    const p = planifierAnnotations(dossier, resultatsAffiches(dossier), 'x', texte, AUTEUR)
    expect(texteDuPlan(p)).toBe(texte)
    expect(passageAncre(p, 0)).toBe(texte.slice(24, 60))
    expect(passageAncre(p, 0)).toContain('\n')
  })
})

describe('ce qui est annoté, et ce qui ne l’est pas', () => {
  it('n’annote pas un contrôle déclaré sans objet', () => {
    const dossier = majPerimetre(dossierAnalyse(), { controlesSansObjet: ['DAB-05'] })
    expect(plan(dossier).annotations.some((a) => a.controleId === 'DAB-05')).toBe(false)
  })

  it('annote un contrôle écarté, en portant son motif', () => {
    // Le lecteur doit voir que le point a été examiné puis écarté, et pourquoi.
    const dossier = ecarter(dossierAnalyse(), 'DAB-05', AUTEUR, 'Franchise négociée à 500 €.')
    const annotation = plan(dossier).annotations.find((a) => a.controleId === 'DAB-05')

    expect(annotation).toBeDefined()
    expect(annotation?.corps.join(' ')).toContain('Écarté par le praticien')
    expect(annotation?.corps.join(' ')).toContain('Franchise négociée à 500 €.')
  })

  it('signale un passage rattaché à la main', () => {
    const dossier = rattacher(dossierAnalyse(), 'RR-02', AUTEUR, {
      documentId: BAIL.id,
      debut: 100,
      fin: 160,
      texte: BAIL.texte.slice(100, 160),
      cote: 'OBLIGATION',
    })
    const annotation = plan(dossier).annotations.find((a) => a.manuelle)

    expect(annotation?.controleId).toBe('RR-02')
    expect(annotation?.corps.join(' ')).toContain('rattaché à la main')
  })

  it('porte le conseil complet, pas seulement le constat', () => {
    const annotation = plan(dossierAnalyse()).annotations.find((a) => a.controleId === 'IND-02')
    const corps = annotation?.corps.join('\n') ?? ''

    expect(corps).toContain('Ce que risque le preneur')
    expect(corps).toContain('Correction du bail, en priorité')
    expect(corps).toContain('Repli assurance')
    expect(corps).toContain('Rédaction proposée')
    expect(corps).toContain('Preuve de clôture')
  })

  it('dit explicitement quand aucun repli assurance n’existe', () => {
    // 19 contrôles n’en ont pas : le rapport doit le dire plutôt que de laisser
    // une ligne vide, qui serait lue comme un oubli.
    const annotation = plan(dossierAnalyse()).annotations.find((a) => a.controleId === 'IND-02')
    expect(annotation?.corps.join(' ')).toContain('exclusivement contractuelle')
  })

  it('reporte l’écart chiffré dans le commentaire', () => {
    const annotation = plan(dossierAnalyse()).annotations.find((a) => a.controleId === 'RC-02')
    expect(annotation?.corps.join(' ')).toMatch(/Écart chiffré : .+ exigés/)
  })
})

describe('robustesse', () => {
  it('ignore une plage hors du texte plutôt que d’ancrer au hasard', () => {
    // Cas réel : un dossier rouvert après qu’une pièce a été remplacée.
    const dossier = rattacher(dossierVierge(), 'RR-01', AUTEUR, {
      documentId: 'x',
      debut: 5_000_000,
      fin: 5_000_100,
      texte: 'passage disparu',
      cote: 'OBLIGATION',
    })
    const p = planifierAnnotations(dossier, resultatsAffiches(dossier), 'x', 'Texte court.', AUTEUR)

    expect(p.annotations).toHaveLength(0)
    expect(texteDuPlan(p)).toBe('Texte court.')
  })
})
