import { describe, expect, it } from 'vitest'

import { detecterIncoherences, type DocumentSource } from '../detection'
import { NOMBRE_REGLES, REGLES, REGLE_PAR_ID } from '../regles'

/**
 * La lecture transversale.
 *
 * Ces cas ont une particularité : le défaut n'est PAS dans la clause qu'on
 * lit. Chaque stipulation, prise seule, passerait sans remarque. C'est leur
 * coexistence qui pose problème — et c'est précisément ce qu'une relecture
 * linéaire, humaine ou machine, ne voit pas.
 *
 * Rédactions synthétiques (§5.4). Aucun document client, sous aucune forme.
 */

const bail = (texte: string): DocumentSource[] => [
  { id: 'bail', role: 'OBLIGATION', texte },
]

const avecPieces = (texteBail: string, texteCouverture: string): DocumentSource[] => [
  { id: 'bail', role: 'OBLIGATION', texte: texteBail },
  { id: 'police', role: 'COUVERTURE', texte: texteCouverture },
]

const ids = (documents: DocumentSource[]): string[] =>
  detecterIncoherences(documents).map((i) => i.regleId)

describe('COH-01 — renonciation et responsabilité du bailleur', () => {
  const CONTRADICTOIRE = `ARTICLE 12 — ASSURANCES
Le Preneur renonce à tout recours contre le Bailleur pour les dommages qu’il pourrait subir.

ARTICLE 16 — OBLIGATIONS DU BAILLEUR
Le Bailleur devra souscrire et maintenir une assurance couvrant sa responsabilité envers le Preneur.`

  it('signale les deux clauses ensemble', () => {
    expect(ids(bail(CONTRADICTOIRE))).toContain('COH-01')
  })

  it('nomme les deux articles', () => {
    const trouvee = detecterIncoherences(bail(CONTRADICTOIRE)).find((i) => i.regleId === 'COH-01')
    expect(trouvee?.premier.article).toBe('12')
    expect(trouvee?.second?.article).toBe('16')
    expect(trouvee?.resume).toBe('Incohérence potentielle entre l’article 12 et l’article 16.')
  })

  it('ne dit rien quand la renonciation existe seule', () => {
    // Prise isolément, la clause est parfaitement ordinaire.
    expect(
      ids(bail('ARTICLE 12 — Le Preneur renonce à tout recours contre le Bailleur.')),
    ).not.toContain('COH-01')
  })

  it('ne dit rien quand l’obligation du bailleur existe seule', () => {
    expect(
      ids(
        bail(
          'ARTICLE 16 — Le Bailleur devra souscrire une assurance couvrant sa responsabilité envers le Preneur.',
        ),
      ),
    ).not.toContain('COH-01')
  })

  it('explique et dit quoi faire', () => {
    const trouvee = detecterIncoherences(bail(CONTRADICTOIRE)).find((i) => i.regleId === 'COH-01')
    expect(trouvee?.explication).toMatch(/n’a alors plus d’objet/)
    expect(trouvee?.action).toMatch(/Aligner les deux périmètres/)
    expect(trouvee?.baseJuridique).toMatch(/L121-12/)
  })
})

describe('COH-02 — réciprocité annoncée, renonciation unilatérale', () => {
  it('repère la contradiction entre l’annonce et la stipulation', () => {
    const texte = `ARTICLE 13 — RENONCIATION
Les parties conviennent d’une renonciation réciproque à tous recours.

ARTICLE 18 — DISPOSITIONS DIVERSES
Le Preneur renonce à tout recours contre le Bailleur du chef des dommages aux biens.`
    expect(ids(bail(texte))).toContain('COH-02')
  })

  it('ne se déclenche pas quand la seconde clause fait renoncer les deux parties', () => {
    const texte = `ARTICLE 13 — RENONCIATION
Les parties conviennent d’une renonciation réciproque à tous recours.

ARTICLE 18 — Le Bailleur et le Preneur renoncent réciproquement à tous recours l’un contre l’autre.`
    expect(ids(bail(texte))).not.toContain('COH-02')
  })
})

describe('COH-03 — immeuble assuré des deux côtés', () => {
  it('signale la double assurance', () => {
    const texte = `ARTICLE 12 — ASSURANCES DU PRENEUR
Le Preneur assurera l’immeuble, la structure et le clos et le couvert.

ARTICLE 17 — ASSURANCES DU BAILLEUR
Le Bailleur souscrit une police garantissant l’immeuble contre l’incendie.`
    const trouvee = detecterIncoherences(bail(texte)).find((i) => i.regleId === 'COH-03')
    expect(trouvee).toBeDefined()
    expect(trouvee?.baseJuridique).toMatch(/L121-4/)
    expect(trouvee?.explication).toMatch(/prime payée deux fois/)
  })

  it('ne dit rien quand seul le bailleur assure l’immeuble', () => {
    // La répartition saine : chacun assure ce qui lui appartient.
    const texte = `ARTICLE 17 — Le Bailleur souscrit une police garantissant l’immeuble contre l’incendie.
ARTICLE 12 — Le Preneur garantit sa responsabilité locative et ses aménagements.`
    expect(ids(bail(texte))).not.toContain('COH-03')
  })
})

describe('COH-04 — obligation absolue et renvoi aux polices', () => {
  it('signale les deux hiérarchies contradictoires', () => {
    const texte = `ARTICLE 20 — PRIMAUTÉ
Les présentes priment sur tout autre document, en ce compris les polices d’assurance.

ARTICLE 12 — ASSURANCES
Le Preneur maintient les garanties dans les limites et conditions des polices souscrites.`
    expect(ids(bail(texte))).toContain('COH-04')
  })
})

describe('COH-05 — renonciation sans engagement des assureurs', () => {
  const BAIL = `ARTICLE 13 — RENONCIATION À RECOURS
Le Bailleur et le Preneur renoncent réciproquement à tous recours et s’engagent à faire renoncer leurs assureurs.`

  it('signale la lacune quand la police est muette', () => {
    const police = `CONDITIONS PARTICULIÈRES
Responsabilité civile exploitation : 8 000 000 €.
Perte d’exploitation : 12 mois.`
    const trouvee = detecterIncoherences(avecPieces(BAIL, police)).find(
      (i) => i.regleId === 'COH-05',
    )
    expect(trouvee).toBeDefined()
    expect(trouvee?.nature).toBe('LACUNE')
    expect(trouvee?.second).toBeNull()
    expect(trouvee?.resume).toMatch(/contrepartie introuvable/)
  })

  it('se tait quand la police porte la renonciation', () => {
    const police = `CONDITIONS PARTICULIÈRES
Les assureurs renoncent à tout recours subrogatoire contre le bailleur et ses préposés.`
    expect(ids(avecPieces(BAIL, police))).not.toContain('COH-05')
  })

  it('ne conclut pas à une lacune sans pièce d’assurance', () => {
    // « Absent » n'est pas « non démontré » : sans police, on ne sait pas.
    expect(ids(bail(BAIL))).not.toContain('COH-05')
  })
})

describe('la règle de fond : deux stipulations différentes', () => {
  it('ne se déclenche jamais sur une seule phrase qui porte les deux moitiés', () => {
    // Une clause qui organise la renonciation ET l'obligation du bailleur dans
    // la même phrase les articule ; elle ne se contredit pas.
    const texte =
      'ARTICLE 12 — Le Preneur renonce à tout recours contre le Bailleur, ce dernier devant souscrire une assurance couvrant sa responsabilité envers le Preneur au-delà de cette renonciation.'
    const trouvees = detecterIncoherences(bail(texte)).filter((i) => i.regleId === 'COH-01')
    expect(trouvees).toEqual([])
  })

  it('ne signale chaque règle qu’une fois', () => {
    const texte = `ARTICLE 12 — Le Preneur renonce à tout recours contre le Bailleur.
ARTICLE 13 — Le Preneur renonce à tout recours contre le Bailleur, de nouveau.
ARTICLE 16 — Le Bailleur assurera sa responsabilité envers le Preneur.
ARTICLE 17 — Le Bailleur assurera sa responsabilité envers le Preneur, encore.`
    const trouvees = detecterIncoherences(bail(texte)).filter((i) => i.regleId === 'COH-01')
    expect(trouvees).toHaveLength(1)
  })
})

describe('le référentiel de cohérence', () => {
  it('donne un identifiant unique et stable à chaque règle', () => {
    const identifiants = REGLES.map((r) => r.id)
    expect(new Set(identifiants).size).toBe(NOMBRE_REGLES)
    expect(identifiants.every((id) => /^COH-\d{2}$/.test(id))).toBe(true)
  })

  it('donne à chaque règle une explication et une action', () => {
    for (const regle of REGLES) {
      expect(regle.explication.length, regle.id).toBeGreaterThan(120)
      expect(regle.action.length, regle.id).toBeGreaterThan(60)
      expect(REGLE_PAR_ID.get(regle.id)).toBe(regle)
    }
  })

  it('n’affirme jamais : le résumé reste au conditionnel', () => {
    const texte = `ARTICLE 12 — Le Preneur renonce à tout recours contre le Bailleur.
ARTICLE 16 — Le Bailleur devra assurer sa responsabilité envers le Preneur.`
    for (const trouvee of detecterIncoherences(bail(texte))) {
      expect(trouvee.resume).toMatch(/potentielle|à vérifier/i)
    }
  })

  it('ne dit rien sur un bail sain', () => {
    const sain = `ARTICLE 12 — ASSURANCES DU PRENEUR
Le Preneur garantit sa responsabilité locative ainsi que le recours des voisins et des tiers.

ARTICLE 17 — ASSURANCES DU BAILLEUR
Le Bailleur conserve l’assurance de l’immeuble, de la structure et du clos et du couvert.`
    expect(detecterIncoherences(bail(sain))).toEqual([])
  })
})

describe('ce qui est cité doit être une stipulation', () => {
  it('ne cite jamais l’intitulé d’un article', () => {
    // « ARTICLE 13 — RENONCIATION À RECOURS » contient les mots que cherchent
    // les règles, mais ne stipule rien. Le citer donnerait un rapport que
    // personne ne peut exploiter : le lecteur ne saurait pas quel texte on lui
    // reproche.
    const texte = `ARTICLE 13 — RENONCIATION À RECOURS
Le Preneur renonce à tout recours contre le Bailleur et contre les assureurs de ce dernier.`
    const police = 'CONDITIONS PARTICULIÈRES\nResponsabilité civile exploitation : 8 000 000 €.'
    const trouvee = detecterIncoherences(avecPieces(texte, police)).find(
      (i) => i.regleId === 'COH-05',
    )
    expect(trouvee).toBeDefined()
    expect(trouvee?.premier.texte).toMatch(/^Le Preneur renonce/)
    expect(trouvee?.premier.texte).not.toMatch(/ARTICLE 13/)
    // L'ancrage reste correct : la citation vient bien de l'article 13.
    expect(trouvee?.premier.article).toBe('13')
  })

  it('cite un texte assez long pour être compris hors contexte', () => {
    const texte = `ARTICLE 12 — ASSURANCES
Le Preneur renonce à tout recours contre le Bailleur pour les dommages qu’il pourrait subir.

ARTICLE 16 — OBLIGATIONS DU BAILLEUR
Le Bailleur devra souscrire une assurance couvrant sa responsabilité envers le Preneur.`
    for (const trouvee of detecterIncoherences(bail(texte))) {
      expect(trouvee.premier.texte.length, trouvee.regleId).toBeGreaterThan(30)
      if (trouvee.second !== null) {
        expect(trouvee.second.texte.length, trouvee.regleId).toBeGreaterThan(30)
      }
    }
  })
})
