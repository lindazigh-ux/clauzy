import { describe, expect, it } from 'vitest'

import { NOMBRE_CONTROLES, Origine, Statut } from '../controles'
import { BAUX, PIECES } from '../corpus/baux'
import { analyser } from '../moteur/moteur'

import {
  MotifRequis,
  ajouterObservation,
  dossierVierge,
  ecarter,
  enregistrerAnalyse,
  forcerGravite,
  forcerStatut,
  majPerimetre,
  preconisations,
  rattacher,
  reecrire,
  reprendre,
  resultatsAffiches,
  synthetiser,
  type Dossier,
} from './index'

const PRATICIENNE = 'A. Praticienne'

const analyseDeBase = () => {
  const bail = BAUX.find((b) => b.id === 'bail-cc')
  const cp = PIECES.find((p) => p.id === 'cp-lacunaire')
  if (bail === undefined || cp === undefined) throw new Error('Corpus incomplet')
  return analyser([
    { id: bail.id, role: 'OBLIGATION', texte: bail.texte },
    { id: cp.id, role: 'COUVERTURE', texte: cp.texte },
  ])
}

const dossierAnalyse = (): Dossier =>
  enregistrerAnalyse(dossierVierge('D-2026-014'), analyseDeBase())

const ligne = (dossier: Dossier, controleId: string) => {
  const trouvee = resultatsAffiches(dossier).find((l) => l.controle.id === controleId)
  if (trouvee === undefined) throw new Error(controleId)
  return trouvee
}

describe('le compte de 40 ne bouge jamais (brief §5.2)', () => {
  it('rend 40 lignes sur un dossier vierge, avant toute analyse', () => {
    const lignes = resultatsAffiches(dossierVierge())
    expect(lignes).toHaveLength(NOMBRE_CONTROLES)
    expect(lignes.every((l) => l.statut === Statut.NON_DETECTE)).toBe(true)
  })

  it('rend encore 40 lignes après un écartement', () => {
    const dossier = ecarter(dossierAnalyse(), 'DOC-01', PRATICIENNE, 'Assuré identique au preneur.')
    expect(resultatsAffiches(dossier)).toHaveLength(NOMBRE_CONTROLES)
    // Le contrôle écarté reste visible, marqué et motivé.
    expect(ligne(dossier, 'DOC-01').ecarte).toBe(true)
    expect(ligne(dossier, 'DOC-01').motif).toBe('Assuré identique au preneur.')
  })

  it('suit l’ordre de lecture du référentiel', () => {
    const ids = resultatsAffiches(dossierAnalyse()).map((l) => l.controle.id)
    expect(ids.slice(0, 3)).toEqual(['DOC-01', 'DOC-02', 'DOC-03'])
  })
})

describe('une analyse relancée n’efface pas le travail du praticien', () => {
  it('conserve les ajustements après une nouvelle passe du moteur', () => {
    // Le point le plus important du poste de travail : une analyse prend une à
    // deux heures. Importer une attestation en retard ne doit rien effacer.
    const avant = ecarter(dossierAnalyse(), 'DOC-02', PRATICIENNE, 'Adresse vérifiée sur pièce.')
    const apres = enregistrerAnalyse(avant, analyseDeBase())

    expect(ligne(apres, 'DOC-02').ecarte).toBe(true)
    expect(ligne(apres, 'DOC-02').motif).toBe('Adresse vérifiée sur pièce.')
  })
})

describe('éditer une ligne', () => {
  it('remplace la rédaction proposée sans toucher au référentiel', () => {
    const dossier = reecrire(dossierAnalyse(), 'IND-02', PRATICIENNE, {
      redaction: 'L’indemnité de perte d’exploitation demeure acquise au Preneur.',
    })
    expect(ligne(dossier, 'IND-02').redaction).toBe(
      'L’indemnité de perte d’exploitation demeure acquise au Preneur.',
    )
    // Le référentiel lui-même est intact.
    expect(ligne(dossier, 'IND-02').controle.redactionProposee).toContain('exclusivement acquis')
  })

  it('change la gravité retenue', () => {
    const dossier = forcerGravite(dossierAnalyse(), 'IND-02', PRATICIENNE, 1)
    expect(ligne(dossier, 'IND-02').gravite).toBe(1)
    expect(ligne(dossier, 'IND-02').controle.gravite).toBe(3)
  })
})

describe('motif obligatoire', () => {
  it('refuse d’écarter un contrôle sans motif', () => {
    expect(() => ecarter(dossierAnalyse(), 'DOC-01', PRATICIENNE, '   ')).toThrowError(MotifRequis)
  })

  it('refuse de forcer un statut sans motif', () => {
    expect(() =>
      forcerStatut(dossierAnalyse(), 'DOC-01', PRATICIENNE, Statut.CONFORME, ''),
    ).toThrowError(MotifRequis)
  })

  it('refuse un identifiant de contrôle inconnu', () => {
    expect(() => ecarter(dossierAnalyse(), 'ZZZ-99', PRATICIENNE, 'motif')).toThrowError(
      /Contrôle inconnu/,
    )
  })
})

describe('rattachement manuel (brief §6)', () => {
  const passage = (cote: 'OBLIGATION' | 'COUVERTURE') => ({
    documentId: 'bail-cc',
    debut: 120,
    fin: 180,
    texte: 'Le Preneur renonce à tout recours contre les autres locataires.',
    cote,
  })

  it('fait passer un contrôle non détecté en écart', () => {
    const vierge = dossierVierge()
    expect(ligne(vierge, 'RR-03').statut).toBe(Statut.NON_DETECTE)

    const dossier = rattacher(vierge, 'RR-03', PRATICIENNE, passage('OBLIGATION'))

    expect(ligne(dossier, 'RR-03').statut).toBe(Statut.ECART)
    expect(ligne(dossier, 'RR-03').origine).toBe(Origine.RATTACHEMENT_MANUEL)
    // Un humain a lu : la confiance n’a plus lieu d’être relative.
    expect(ligne(dossier, 'RR-03').confiance).toBe(100)
  })

  it('porte le contrôle à conforme quand une pièce est aussi rattachée', () => {
    const dossier = rattacher(
      rattacher(dossierVierge(), 'RR-03', PRATICIENNE, passage('OBLIGATION')),
      'RR-03',
      PRATICIENNE,
      passage('COUVERTURE'),
    )
    expect(ligne(dossier, 'RR-03').statut).toBe(Statut.CONFORME)
  })

  it('conserve les offsets, qui portent l’ancrage Word', () => {
    const dossier = rattacher(dossierVierge(), 'RR-03', PRATICIENNE, passage('OBLIGATION'))
    expect(ligne(dossier, 'RR-03').rattachements[0]).toMatchObject({ debut: 120, fin: 180 })
  })

  it('refuse un passage vide', () => {
    expect(() =>
      rattacher(dossierVierge(), 'RR-03', PRATICIENNE, { ...passage('OBLIGATION'), texte: '  ' }),
    ).toThrowError(MotifRequis)
  })

  it('laisse le praticien primer sur le rattachement', () => {
    const dossier = forcerStatut(
      rattacher(dossierVierge(), 'RR-03', PRATICIENNE, passage('OBLIGATION')),
      'RR-03',
      PRATICIENNE,
      Statut.ABSENT_DU_BAIL,
      'Clause supprimée par avenant du 3 mars.',
    )
    expect(ligne(dossier, 'RR-03').statut).toBe(Statut.ABSENT_DU_BAIL)
  })
})

describe('périmètre', () => {
  it('un contrôle déclaré sans objet sort du décompte sans disparaître', () => {
    const dossier = majPerimetre(dossierAnalyse(), { controlesSansObjet: ['ENV-01', 'ENV-02'] })

    expect(ligne(dossier, 'ENV-01').sansObjet).toBe(true)
    expect(ligne(dossier, 'ENV-01').statut).toBe(Statut.ABSENT_DU_BAIL)
    expect(resultatsAffiches(dossier)).toHaveLength(NOMBRE_CONTROLES)
  })

  it('retient les pièces reçues et manquantes', () => {
    const dossier = majPerimetre(dossierVierge(), {
      piecesRecues: ['Bail du 12 janvier 2024'],
      piecesManquantes: ['Conditions générales de la police'],
      hypotheses: ['Les surfaces déclarées sont celles de l’état des lieux.'],
    })
    expect(dossier.perimetre.piecesManquantes).toHaveLength(1)
    expect(dossier.perimetre.hypotheses).toHaveLength(1)
  })
})

describe('observations libres', () => {
  it('vivent hors des 40 contrôles', () => {
    const dossier = ajouterObservation(dossierAnalyse(), {
      titre: 'Clause de garantie solidaire',
      texte: 'La caution solidaire du dirigeant excède l’usage du secteur.',
      gravite: 2,
    })
    expect(dossier.observations).toHaveLength(1)
    expect(resultatsAffiches(dossier)).toHaveLength(NOMBRE_CONTROLES)
  })
})

describe('synthèse', () => {
  it('additionne exactement les états retenus', () => {
    const { ecarts, conformes, sansObjet, aVerifier, ecartes, total } = synthetiser(dossierAnalyse())
    expect(ecarts + conformes + sansObjet + aVerifier + ecartes).toBe(total)
  })

  it('signale l’intervention du praticien, comme l’impose le §6', () => {
    const vierge = synthetiser(dossierAnalyse())
    expect(vierge.mentionAjustement).toBeNull()

    const ajuste = synthetiser(ecarter(dossierAnalyse(), 'DOC-01', PRATICIENNE, 'Vérifié.'))
    expect(ajuste.mentionAjustement).toBe('Analyse ajustée par le praticien sur 1 contrôle.')
    expect(ajuste.phrase).toContain('1 écarté par le praticien')
  })

  it('reprendre un contrôle écarté le remet au décompte', () => {
    const ecarte = ecarter(dossierAnalyse(), 'DOC-01', PRATICIENNE, 'Vérifié.')
    const repris = reprendre(ecarte, 'DOC-01', PRATICIENNE)
    expect(synthetiser(repris).ecartes).toBe(0)
  })
})

describe('préconisations hiérarchisées par enjeu chiffré (brief §7)', () => {
  it('remonte les écarts chiffrés avant les autres', () => {
    const liste = preconisations(dossierAnalyse())
    const premierSansChiffre = liste.findIndex((l) => l.resumeEcart === null)
    const dernierAvecChiffre = liste.map((l) => l.resumeEcart !== null).lastIndexOf(true)

    expect(liste.length).toBeGreaterThan(0)
    if (premierSansChiffre !== -1 && dernierAvecChiffre !== -1) {
      expect(dernierAvecChiffre).toBeLessThan(premierSansChiffre)
    }
  })

  it('n’y fait figurer ni les écartés ni les conformes', () => {
    const dossier = ecarter(dossierAnalyse(), 'DAB-05', PRATICIENNE, 'Franchise négociée.')
    const liste = preconisations(dossier)
    expect(liste.every((l) => l.statut === Statut.ECART && !l.ecarte)).toBe(true)
    expect(liste.some((l) => l.controle.id === 'DAB-05')).toBe(false)
  })
})
