/**
 * Ce que la refonte doit tenir (brief §17 à §43).
 *
 * Une refonte se juge à l'œil, et l'œil ne revient pas six mois plus tard. Ces
 * tests fixent les trois promesses qu'un ajout ultérieur romprait sans qu'on
 * s'en aperçoive : ne pas remettre l'outil devant le dossier, ne pas laisser
 * deux comptes diverger sur le même écran, et ne pas surligner à côté de la
 * clause.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { REFERENTIEL } from '@/domain/controles'
import { StatutAffiche } from '@/domain/garanties/axes'
import { NiveauPreuve } from '@/domain/garanties/types'
import { recit } from '@/domain/dossier'
import { dossierDeReference } from '@/domain/rapport/__tests__/fixture'

import { EcranBail } from '../EcranBail'
import { EcranConfrontation } from '../EcranConfrontation'
import { EcranSynthese, aTraiter } from '../EcranSynthese'

const dossier = dossierDeReference()
const rapprochements = dossier.analyse?.rapprochements ?? []
const rien = () => {}

const texteDe = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x27;|&apos;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')

const synthese = () =>
  texteDe(
    renderToStaticMarkup(
      <EcranSynthese
        dossier={dossier}
        analyseEnCours={false}
        onAnalyser={rien}
        onPieces={rien}
        onTout={rien}
      />,
    ),
  )

describe('l’expérience principale ne montre pas l’outil', () => {
  it('n’annonce nulle part le nombre de contrôles', () => {
    // « Clauzy a 45 contrôles, voici les 45 » est exactement l'impression que
    // le §43 interdit. Le compte reste dans le rapport et en mode expert.
    expect(synthese()).not.toMatch(/contrôles appliqués/i)
  })

  it('ne fait apparaître aucun identifiant de contrôle', () => {
    const rendu = synthese()
    const fuites = REFERENTIEL.map((c) => c.id).filter((id) => rendu.includes(id))
    expect(fuites, 'un identifiant de contrôle décrit l’outil, pas le dossier').toEqual([])
  })

  it('ne montre que les cinq premiers points, et dit combien restent', () => {
    const rendu = synthese()
    const points = aTraiter(dossier)
    const montres = points.slice(0, 5)
    const caches = points.slice(5)
    for (const point of montres) expect(rendu).toContain(point.libelle)
    for (const point of caches) expect(rendu).not.toContain(point.libelle)
    if (caches.length > 0) expect(rendu).toContain(`${caches.length} autre`)
  })
})

describe('le récit et les indicateurs comptent la même chose', () => {
  it('le nombre annoncé est celui des points qui appellent une action', () => {
    const points = aTraiter(dossier)
    const phrases = recit(dossier).phrases.join(' ')
    expect(points.length).toBeGreaterThan(0)
    expect(phrases).toContain(`${points.length} point`)
  })

  it('les quatre indicateurs partitionnent les obligations', () => {
    const points = aTraiter(dossier)
    const couvertes = rapprochements.filter((r) => r.niveau === NiveauPreuve.ETABLIE).length
    const critiques = points.filter((r) => r.statut === StatutAffiche.CRITIQUE).length
    const aNegocier = points.filter((r) => r.statut === StatutAffiche.A_NEGOCIER).length
    const aVerifier = points.filter((r) => r.statut === StatutAffiche.A_VERIFIER).length
    const information = points.filter((r) => r.statut === StatutAffiche.INFORMATION).length
    // Rien ne doit tomber entre deux cases : un point invisible est pire qu'un
    // point mal rangé.
    expect(critiques + aNegocier + aVerifier + information + couvertes).toBe(
      rapprochements.length,
    )
  })
})

describe('le bail surligne la clause, pas autre chose', () => {
  it('chaque passage surligné est le texte exact de la stipulation', () => {
    const bail = dossier.documents.find((d) => d.role === 'OBLIGATION')
    expect(bail).toBeDefined()
    if (bail === undefined) return

    const html = renderToStaticMarkup(
      <EcranBail dossier={dossier} expert={false} onPieces={rien} />,
    )
    const rendu = texteDe(html)

    const ancrees = rapprochements.filter(
      (r) => r.exigence?.stipulation.documentId === bail.id,
    )
    expect(ancrees.length, 'aucune stipulation ancrée au bail').toBeGreaterThan(0)

    for (const rapprochement of ancrees) {
      const stipulation = rapprochement.exigence?.stipulation
      if (stipulation === undefined) continue
      // Le surlignage vient des offsets : ce que la page affiche à cet endroit
      // doit être, au caractère près, ce que le moteur a cité.
      expect(bail.texte.slice(stipulation.debut, stipulation.fin)).toBe(stipulation.texte)
      expect(rendu).toContain(texteDe(stipulation.texte).trim())
    }
  })

  it('ne surligne jamais deux clauses qui se chevauchent', () => {
    const bail = dossier.documents.find((d) => d.role === 'OBLIGATION')
    if (bail === undefined) return
    const html = renderToStaticMarkup(
      <EcranBail dossier={dossier} expert={false} onPieces={rien} />,
    )
    // Un `span` imbriqué dans un autre produirait un balisage illisible.
    expect(html).not.toMatch(/role="button"[^>]*>[^<]*<span[^>]*role="button"/)
  })
})

describe('la confrontation montre la chaîne entière', () => {
  it('porte les trois maillons pour chaque obligation', () => {
    const rendu = texteDe(
      renderToStaticMarkup(<EcranConfrontation dossier={dossier} onPieces={rien} />),
    )
    expect(rendu).toContain('Ce que le bail exige')
    expect(rendu).toContain('Ce que le contrat porte')
    expect(rendu).toContain('Sur l’attestation')
  })

  it('affiche l’écart chiffré quand il existe', () => {
    const rendu = texteDe(
      renderToStaticMarkup(<EcranConfrontation dossier={dossier} onPieces={rien} />),
    )
    for (const rapprochement of rapprochements) {
      if (rapprochement.chiffrage === null) continue
      expect(rendu).toContain(texteDe(rapprochement.chiffrage))
    }
  })
})
