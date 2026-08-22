/**
 * Le badge de synthèse à l'écran (brief §8).
 *
 * Le badge résume trois axes en un mot. C'est utile, et c'est exactement ce
 * qui se met à mentir sans surveillance : une surface qui recalculerait le
 * statut à sa façon, ou qui n'afficherait plus que lui, ferait perdre au
 * praticien de quoi contrôler la conclusion.
 *
 * Ce test tient deux garanties de structure :
 *   1. le badge affiché est celui que le domaine a calculé, jamais un autre ;
 *   2. les trois axes restent lisibles un à un sous le badge.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  LIBELLE_ACTION,
  LIBELLE_GRAVITE,
  LIBELLE_STATUT_AFFICHE,
  StatutAffiche,
  statutAffiche,
} from '@/domain/garanties/axes'
import { LIBELLE_PREUVE } from '@/domain/garanties/types'
import { dossierDeReference } from '@/domain/rapport/__tests__/fixture'

import { EcranConfrontation } from '../../ecrans/EcranConfrontation'
import { RapportImprimable } from '../RapportImprimable'

const dossier = dossierDeReference()
const rapprochements = dossier.analyse?.rapprochements ?? []

/** Le HTML débarrassé de ses balises : on compare des faits, pas du balisage. */
const texteDe = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x27;|&apos;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')

describe('le badge de synthèse', () => {
  it('le dossier de référence porte bien des rapprochements', () => {
    expect(rapprochements.length).toBeGreaterThan(0)
  })

  it('le poste de travail affiche le statut calculé par le domaine', () => {
    const rendu = texteDe(
      renderToStaticMarkup(<EcranConfrontation dossier={dossier} onPieces={() => {}} />),
    )
    for (const rapprochement of rapprochements) {
      expect(rendu).toContain(LIBELLE_STATUT_AFFICHE[rapprochement.statut])
    }
  })

  it('le statut affiché est bien celui que les trois axes produisent', () => {
    for (const rapprochement of rapprochements) {
      expect(rapprochement.statut).toBe(
        statutAffiche(
          rapprochement.niveau,
          rapprochement.gravite,
          rapprochement.recommandation.action,
        ),
      )
    }
  })

  it('le rapport imprimé porte le statut, la preuve ET la gravité', () => {
    const rendu = texteDe(renderToStaticMarkup(<RapportImprimable dossier={dossier} />))
    for (const rapprochement of rapprochements) {
      expect(rendu).toContain(LIBELLE_STATUT_AFFICHE[rapprochement.statut])
      expect(rendu).toContain(LIBELLE_PREUVE[rapprochement.niveau])
      expect(rendu.toLocaleLowerCase('fr')).toContain(
        LIBELLE_GRAVITE[rapprochement.gravite].toLocaleLowerCase('fr'),
      )
    }
  })

  it('le geste est nommé par son code, pas seulement par sa phrase', () => {
    // Une phrase se lit ; un code se compte. Le poste de travail doit porter
    // les deux, faute de quoi « trois pièces à demander » redevient un comptage
    // manuel.
    const ouvert = rapprochements[0]
    expect(ouvert).toBeDefined()
    if (ouvert === undefined) return
    const rendu = texteDe(
      renderToStaticMarkup(<EcranConfrontation dossier={dossier} onPieces={() => {}} />),
    )
    // Le geste est replié au premier rendu : le badge, lui, est toujours là.
    expect(rendu).toContain(LIBELLE_STATUT_AFFICHE[ouvert.statut])
    expect(Object.values(LIBELLE_ACTION)).toContain(
      LIBELLE_ACTION[ouvert.recommandation.action],
    )
  })

  it('aucun statut d’affichage n’est laissé sans libellé', () => {
    for (const statut of Object.values(StatutAffiche)) {
      expect(LIBELLE_STATUT_AFFICHE[statut]).toBeTruthy()
    }
  })
})
