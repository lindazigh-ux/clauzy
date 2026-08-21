import { describe, expect, it } from 'vitest'

import { passages } from '@/domain/moteur/ancrage'

import { NOMENCLATURE } from '../nomenclature'
import { reconnaitre, reconnaitreDans } from '../reconnaissance'

/**
 * Tests de non-régression sur les faux rapprochements.
 *
 * Ils naissent d'un défaut trouvé en relisant un livrable : la garantie
 * « Mobilier, matériel et marchandises » était rattachée à une clause de
 * RENONCIATION À RECOURS. Le motif `/mobilier/i` reconnaissait le mot à
 * l'intérieur de « ensemble immo-BILIER ».
 *
 * Une seule association de ce genre suffit à faire perdre confiance : le
 * courtier qui la voit se met à tout revérifier, et l'outil ne lui fait plus
 * gagner une minute. Ces tests valent donc plus que n'importe quelle
 * fonctionnalité nouvelle.
 */

const reconnues = (texte: string, cote: 'OBLIGATION' | 'COUVERTURE' = 'OBLIGATION'): string[] => [
  ...new Set(reconnaitre(texte, cote).map((r) => r.garantieId)),
]

describe('aucun motif ne reconnaît un mot à l’intérieur d’un autre', () => {
  it('« ensemble immobilier » n’est pas du mobilier', () => {
    // Le défaut d'origine, dans sa rédaction exacte.
    const clause =
      'Le Preneur renonce également à recours contre les occupants, les prestataires et les autres locataires de l’ensemble immobilier.'
    const trouvees = reconnues(clause)
    expect(trouvees, 'une clause de renonciation n’est pas une garantie de contenu').not.toContain(
      'MOBILIER_MATERIEL_MARCHANDISES',
    )
    expect(trouvees).toContain('RENONCIATION_RECOURS')
  })

  it('« biens immobiliers » n’est pas du mobilier non plus', () => {
    expect(reconnues('Les biens immobiliers demeurent la propriété du Bailleur.')).not.toContain(
      'MOBILIER_MATERIEL_MARCHANDISES',
    )
  })

  it('reconnaît le vrai mobilier', () => {
    expect(
      reconnues('Le Preneur assure son mobilier, son matériel et ses marchandises.'),
    ).toContain('MOBILIER_MATERIEL_MARCHANDISES')
  })

  /**
   * Le piège général : un mot français qui en contient un autre. La liste
   * grandit chaque fois qu'un faux rapprochement est trouvé.
   */
  const PIEGES: readonly { readonly texte: string; readonly interdite: string }[] = [
    { texte: 'l’ensemble immobilier', interdite: 'MOBILIER_MATERIEL_MARCHANDISES' },
    { texte: 'les biens immobiliers du Bailleur', interdite: 'MOBILIER_MATERIEL_MARCHANDISES' },
    { texte: 'la société immobilière propriétaire', interdite: 'MOBILIER_MATERIEL_MARCHANDISES' },
    { texte: 'le contenu du présent bail', interdite: 'MOBILIER_MATERIEL_MARCHANDISES' },
  ]

  it.each(PIEGES.map((p) => [p.texte, p]))('« %s »', (_texte, piege) => {
    for (const cote of ['OBLIGATION', 'COUVERTURE'] as const) {
      expect(
        reconnues(`Le Preneur s’engage au titre de ${piege.texte}.`, cote),
        `${cote} : ${piege.texte}`,
      ).not.toContain(piege.interdite)
    }
  })
})

describe('un intitulé d’article n’est jamais une exigence', () => {
  it('ne rattache rien au titre « ARTICLE 13 — RENONCIATION À RECOURS »', () => {
    // Le titre porte les mots de la garantie, mais ne stipule rien. Le citer
    // comme exigence donne un rapport que personne ne peut exploiter.
    const bail = `ARTICLE 13 — RENONCIATION À RECOURS
Le Preneur renonce à tout recours contre le Bailleur et contre les assureurs de ce dernier.`
    // On passe par le chemin RÉEL du produit : `passages` retranche les
    // en-têtes, `reconnaitre` sur du texte brut ne le peut pas — il ne connaît
    // pas les articles.
    const trouvees = passages([{ id: 'bail', role: 'OBLIGATION', texte: bail }])
      .flatMap((p) => reconnaitreDans(p, 'OBLIGATION'))
      .filter((r) => r.garantieId === 'RENONCIATION_RECOURS')
    expect(trouvees.length).toBeGreaterThan(0)
    for (const trouvee of trouvees) {
      expect(trouvee.stipulation.texte).not.toMatch(/^ARTICLE\s+\d/)
    }
  })
})

describe('« par sinistre » n’est pas une garantie', () => {
  it('ne prend pas une unité de mesure pour un capital assuré', () => {
    // Chaque ligne d'un tableau de garanties porte « par sinistre » : en faire
    // un marqueur de capitaux rattachait n'importe quelle ligne à n'importe
    // quelle exigence de montant.
    const ligne = 'Responsabilité civile exploitation : 8 000 000 € par sinistre.'
    expect(reconnues(ligne, 'COUVERTURE')).not.toContain('CAPITAUX_ASSURES')
    expect(reconnues(ligne, 'COUVERTURE')).toContain('RC_EXPLOITATION')
  })

  it('reconnaît un capital quand il est nommé', () => {
    expect(reconnues('Capitaux assurés : 2 400 000 €.', 'COUVERTURE')).toContain('CAPITAUX_ASSURES')
  })
})

describe('la nomenclature elle-même', () => {
  it('borne tous ses motifs d’un seul mot', () => {
    // Un motif réduit à un mot nu reconnaît ce mot n'importe où, y compris à
    // l'intérieur d'un autre. C'est ainsi que « immobilier » est devenu du
    // mobilier.
    const nu = /(?:^|\|)\(?\??:?\s*[a-zà-ÿ]{4,}\)?(?:\?)?(?:\||$)/
    const fautifs: string[] = []
    for (const garantie of NOMENCLATURE) {
      for (const motif of [...garantie.motifsObligation, ...garantie.motifsCouverture]) {
        const source = motif.pattern.source
        // Un motif d'un seul mot, sans borne : le cas dangereux.
        if (!source.includes('\\b') && !source.includes(' ') && nu.test(source)) {
          fautifs.push(`${garantie.id} : ${source}`)
        }
      }
    }
    expect(fautifs, 'ajouter \\b autour des mots isolés').toEqual([])
  })
})
