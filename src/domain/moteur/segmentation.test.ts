import { describe, expect, it } from 'vitest'

import { repere, segmentContenant, segmenter } from './segmentation'

/**
 * Le test le plus important de ce fichier est celui des offsets.
 *
 * Un offset faux ne se voit pas a l'ecran : il se voit le jour ou un commentaire
 * Word s'ancre trois paragraphes plus loin, devant le client (brief §7).
 */

const BAIL = `BAIL COMMERCIAL

Entre les soussignes, ci-apres denommes le Bailleur et le Preneur.

ARTICLE 11 - DESTINATION DES LIEUX
Les locaux sont destines a l'exploitation d'un commerce de detail.

ARTICLE 12 — ASSURANCES
Le Preneur souscrira une police multirisque couvrant ses biens propres.

Le Preneur justifiera annuellement de la souscription par attestation.

12.3 Renonciation a recours
Le Bailleur renonce a tout recours contre le Preneur.

ARTICLE 13 : TRAVAUX
Les travaux d'amelioration restent acquis au Bailleur en fin de bail.`

describe('segmentation — offsets', () => {
  const segments = segmenter('bail-1', BAIL)

  it('chaque segment se retrouve a l identique dans le document d origine', () => {
    for (const segment of segments) {
      expect(BAIL.slice(segment.debut, segment.fin)).toBe(segment.texte)
    }
  })

  it('chaque alinea se retrouve a l identique dans le document d origine', () => {
    for (const segment of segments) {
      for (const alinea of segment.alineas) {
        expect(BAIL.slice(alinea.debut, alinea.fin)).toBe(alinea.texte)
      }
    }
  })

  it('les segments couvrent le document sans trou ni chevauchement', () => {
    const tries = [...segments].sort((a, b) => a.debut - b.debut)
    let curseur = 0
    for (const segment of tries) {
      expect(segment.debut).toBeGreaterThanOrEqual(curseur)
      // Seul de l'espace peut separer deux segments.
      expect(BAIL.slice(curseur, segment.debut).trim()).toBe('')
      curseur = segment.fin
    }
    expect(BAIL.slice(curseur).trim()).toBe('')
  })
})

describe('segmentation — reconnaissance des titres', () => {
  const segments = segmenter('bail-1', BAIL)

  it('isole le preambule avant le premier article', () => {
    expect(segments[0]?.numero).toBeNull()
    expect(segments[0]?.texte).toContain('BAIL COMMERCIAL')
  })

  it('reconnait les separateurs rencontres en pratique', () => {
    const numeros = segments.map((s) => s.numero)
    expect(numeros).toEqual([null, '11', '12', '12.3', '13'])
  })

  it('conserve les intitules', () => {
    const titres = segments.map((s) => s.titre)
    expect(titres).toEqual([
      null,
      'DESTINATION DES LIEUX',
      'ASSURANCES',
      'Renonciation a recours',
      'TRAVAUX',
    ])
  })

  it('produit un repere lisible', () => {
    expect(repere(segments[2]!)).toBe('Article 12 — ASSURANCES')
    expect(repere(segments[0]!)).toBe('Preambule')
  })
})

describe('segmentation — prudence', () => {
  it('ne prend pas une enumeration interne pour un article', () => {
    const texte = `ARTICLE 12 — ASSURANCES
Le Preneur souscrit les garanties suivantes :
1. incendie et evenements assimiles ;
2. degats des eaux ;
3. bris de glaces.`
    const segments = segmenter('bail-2', texte)
    expect(segments).toHaveLength(1)
    expect(segments[0]?.numero).toBe('12')
  })

  it('ne prend pas une phrase commencant par un numero pour un titre', () => {
    const texte = `1. Le present bail est consenti pour une duree de neuf annees entieres.`
    const segments = segmenter('bail-3', texte)
    expect(segments).toHaveLength(1)
    expect(segments[0]?.numero).toBeNull()
  })

  it('rend un segment unique sur un bail sans aucun titre reconnaissable', () => {
    const texte = `Le preneur assurera ses biens propres contre l incendie.
Il renoncera a tout recours contre le bailleur et ses assureurs.`
    const segments = segmenter('bail-4', texte)
    expect(segments).toHaveLength(1)
    expect(segments[0]?.texte).toBe(texte)
  })

  it('ne perd jamais le texte, quel que soit le decoupage', () => {
    for (const texte of [BAIL, '', '   \n  \n', 'Une seule ligne.']) {
      const segments = segmenter('x', texte)
      const reconstitue = segments.map((s) => s.texte).join('')
      expect(texte.replace(/\s/g, '')).toContain(reconstitue.replace(/\s/g, ''))
    }
  })
})

describe('segmentation — remontee d un extrait a son article', () => {
  const segments = segmenter('bail-1', BAIL)

  it('retrouve l article qui contient un offset', () => {
    const offset = BAIL.indexOf('renonce a tout recours')
    expect(segmentContenant(segments, offset)?.numero).toBe('12.3')
  })

  it('renvoie undefined hors du document', () => {
    expect(segmentContenant(segments, BAIL.length + 10)).toBeUndefined()
  })
})
