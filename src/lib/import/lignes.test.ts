import { describe, expect, it } from 'vitest'

import { reconstituerTexte, type FragmentTexte } from './lignes'

/**
 * C'est la partie de l'import qui casse en silence : un PDF mal reconstitué ne
 * lève aucune erreur, il produit un pavé unique dans lequel la segmentation ne
 * reconnaît plus aucun titre d'article. Le moteur perd alors la pondération de
 * localisation, et le rapport devient inexploitable sans que rien ne l'annonce.
 */

const f = (texte: string, x: number, y: number, largeur = texte.length * 5): FragmentTexte => ({
  texte,
  x,
  y,
  largeur,
  hauteur: 10,
})

describe('reconstitution des lignes', () => {
  it('regroupe les fragments de même ordonnée, de gauche à droite', () => {
    const texte = reconstituerTexte([f('ASSURANCES', 120, 700), f('ARTICLE 12 —', 50, 700)])
    expect(texte).toBe('ARTICLE 12 — ASSURANCES')
  })

  it('tolère un léger décalage vertical à l’intérieur d’une ligne', () => {
    // Les exposants et les changements de police décalent la ligne de base.
    const texte = reconstituerTexte([f('mois', 50, 700), f('24', 30, 702)])
    expect(texte).toBe('24 mois')
  })

  it('ordonne les lignes de haut en bas', () => {
    const texte = reconstituerTexte([f('Deuxième ligne', 50, 680), f('Première ligne', 50, 700)])
    expect(texte).toBe('Première ligne\nDeuxième ligne')
  })

  it('n’insère pas d’espace entre deux fragments qui se touchent', () => {
    // Un même mot est fréquemment coupé en plusieurs fragments.
    const texte = reconstituerTexte([f('Assu', 50, 700, 20), f('rances', 70, 700, 30)])
    expect(texte).toBe('Assurances')
  })

  it('insère un espace quand les fragments sont séparés', () => {
    const texte = reconstituerTexte([f('Le', 50, 700, 10), f('Preneur', 90, 700, 35)])
    expect(texte).toBe('Le Preneur')
  })
})

describe('reconstitution des paragraphes', () => {
  it('sépare par une ligne vide quand l’interligne se creuse', () => {
    // C’est cette ligne vide que la segmentation utilise pour les alinéas.
    const texte = reconstituerTexte([
      f('ARTICLE 12 — ASSURANCES', 50, 700),
      f('Le Preneur souscrira une police.', 50, 686),
      f('Le Preneur justifiera annuellement.', 50, 672),
      f('ARTICLE 13 — TRAVAUX', 50, 620),
    ])
    expect(texte).toBe(
      'ARTICLE 12 — ASSURANCES\n' +
        'Le Preneur souscrira une police.\n' +
        'Le Preneur justifiera annuellement.\n\n' +
        'ARTICLE 13 — TRAVAUX',
    )
  })

  it('ne crée pas de paragraphe sur un interligne régulier', () => {
    const texte = reconstituerTexte([
      f('ligne un', 50, 700),
      f('ligne deux', 50, 686),
      f('ligne trois', 50, 672),
    ])
    expect(texte).toBe('ligne un\nligne deux\nligne trois')
  })
})

describe('robustesse', () => {
  it('rend une chaîne vide sur une page sans texte', () => {
    expect(reconstituerTexte([])).toBe('')
    expect(reconstituerTexte([f('', 0, 0)])).toBe('')
  })

  it('ignore les fragments vides sans casser la mise en page', () => {
    const texte = reconstituerTexte([f('Article 1', 50, 700), f('', 80, 700), f('Objet', 50, 686)])
    expect(texte).toBe('Article 1\nObjet')
  })

  it('survit à une hauteur de police absente', () => {
    const fragments: FragmentTexte[] = [
      { texte: 'Bail', x: 50, y: 700, largeur: 20, hauteur: 0 },
      { texte: 'commercial', x: 75, y: 700, largeur: 45, hauteur: 0 },
    ]
    expect(reconstituerTexte(fragments)).toBe('Bail commercial')
  })

  it('produit un texte dont la segmentation retrouve les articles', () => {
    // Le vrai critère : le résultat doit être segmentable.
    const texte = reconstituerTexte([
      f('ARTICLE 12 — ASSURANCES', 50, 700),
      f('Le Preneur souscrira une police multirisque.', 50, 686),
      f('ARTICLE 13 — TRAVAUX', 50, 640),
      f('Les travaux restent acquis au Bailleur.', 50, 626),
    ])
    expect(texte.split('\n').filter((l) => l.startsWith('ARTICLE'))).toHaveLength(2)
  })
})
