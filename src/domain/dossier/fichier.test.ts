import { describe, expect, it } from 'vitest'

import { NOMBRE_CONTROLES, Statut } from '../controles'
import { BAUX, PIECES } from '../corpus/baux'
import { analyser } from '../moteur/moteur'

import {
  ErreurFichierDossier,
  deserialiser,
  estChiffre,
  nomFichier,
  serialiser,
} from './fichier'
import {
  ajouterObservation,
  dossierVierge,
  ecarter,
  enregistrerAnalyse,
  majPerimetre,
  majReference,
  rattacher,
  reecrire,
  resultatsAffiches,
  synthetiser,
  type Dossier,
  type LigneRapport,
} from './index'

/**
 * Critere de sortie du lot L3 : une analyse survit a la fermeture de l'onglet.
 *
 * Ce qui compte n'est pas que le JSON fasse l'aller-retour, mais que le TRAVAIL
 * survive : les ajustements, les motifs, les rattachements et leurs offsets, le
 * perimetre. C'est la seule sauvegarde de deux heures de travail.
 */

const MOT_DE_PASSE = 'un mot de passe de cabinet, long et mémorisable'

const dossierTravaille = (): Dossier => {
  const bail = BAUX.find((b) => b.id === 'bail-cc')
  const cp = PIECES.find((p) => p.id === 'cp-lacunaire')
  if (bail === undefined || cp === undefined) throw new Error('Corpus incomplet')

  const analyse = analyser([
    { id: bail.id, role: 'OBLIGATION', texte: bail.texte },
    { id: cp.id, role: 'COUVERTURE', texte: cp.texte },
  ])

  let dossier = enregistrerAnalyse(majReference(dossierVierge(), 'D-2026-014'), analyse)
  dossier = ecarter(dossier, 'DOC-01', 'A. Praticienne', 'Assuré identique au preneur.')
  dossier = reecrire(dossier, 'IND-02', 'A. Praticienne', {
    analyse: 'La PE est captée par le bailleur : reprise en négociation.',
    redaction: 'L’indemnité de perte d’exploitation demeure acquise au Preneur.',
  })
  dossier = rattacher(dossier, 'RR-02', 'A. Praticienne', {
    documentId: bail.id,
    debut: 1200,
    fin: 1280,
    texte: 'Le Bailleur renonce à recours contre le Preneur, quelle qu’en soit la cause.',
    cote: 'OBLIGATION',
  })
  dossier = majPerimetre(dossier, {
    piecesManquantes: ['Conditions générales de la police'],
    hypotheses: ['Les surfaces sont celles de l’état des lieux.'],
    controlesSansObjet: ['ENV-01'],
  })
  return ajouterObservation(dossier, {
    titre: 'Caution solidaire du dirigeant',
    texte: 'La caution excède l’usage du secteur.',
    gravite: 2,
  })
}

describe('aller-retour sans mot de passe', () => {
  it('rend un dossier identique', async () => {
    const avant = dossierTravaille()
    const apres = await deserialiser(await serialiser(avant))
    expect(apres).toEqual(avant)
  })

  it('conserve le travail du praticien, pas seulement les données', async () => {
    const avant = dossierTravaille()
    const apres = await deserialiser(await serialiser(avant))

    const lignesApres = resultatsAffiches(apres)

    expect(lignesApres).toHaveLength(NOMBRE_CONTROLES)
    expect(synthetiser(apres).phrase).toBe(synthetiser(avant).phrase)
    expect(synthetiser(apres).mentionAjustement).toBe(synthetiser(avant).mentionAjustement)

    const trouver = (lignes: readonly LigneRapport[], id: string) =>
      lignes.find((l) => l.controle.id === id)

    // L’écartement et son motif.
    expect(trouver(lignesApres, 'DOC-01')?.ecarte).toBe(true)
    expect(trouver(lignesApres, 'DOC-01')?.motif).toBe('Assuré identique au preneur.')

    // La rédaction réécrite prime toujours sur celle du référentiel.
    expect(trouver(lignesApres, 'IND-02')?.redaction).toBe(
      'L’indemnité de perte d’exploitation demeure acquise au Preneur.',
    )

    // Le rattachement manuel, ses offsets, et l’état qu’il impose.
    expect(trouver(lignesApres, 'RR-02')?.statut).toBe(Statut.ECART)
    expect(trouver(lignesApres, 'RR-02')?.rattachements[0]).toMatchObject({
      debut: 1200,
      fin: 1280,
    })

    // Le périmètre.
    expect(apres.perimetre.piecesManquantes).toEqual(['Conditions générales de la police'])
    expect(trouver(lignesApres, 'ENV-01')?.sansObjet).toBe(true)
    expect(apres.observations).toHaveLength(1)
  })

  it('conserve les extraits du moteur, qui portent l’ancrage Word', async () => {
    const avant = dossierTravaille()
    const apres = await deserialiser(await serialiser(avant))
    const extraits = apres.analyse?.resultats.flatMap((r) => r.extraitsObligation) ?? []

    expect(extraits.length).toBeGreaterThan(0)
    for (const extrait of extraits) {
      expect(typeof extrait.debut).toBe('number')
      expect(extrait.fin).toBeGreaterThan(extrait.debut)
    }
  })
})

describe('aller-retour avec mot de passe', () => {
  it('chiffre le contenu et le rend au bon mot de passe', async () => {
    const avant = dossierTravaille()
    const fichier = await serialiser(avant, MOT_DE_PASSE)

    expect(estChiffre(fichier)).toBe(true)
    // Rien du dossier ne doit rester lisible dans le fichier.
    expect(fichier).not.toContain('D-2026-014')
    expect(fichier).not.toContain('Assuré identique au preneur')
    expect(fichier).not.toContain('ARTICLE 12')

    expect(await deserialiser(fichier, MOT_DE_PASSE)).toEqual(avant)
  })

  it('signale un dossier protégé plutôt que d’échouer obscurément', async () => {
    const fichier = await serialiser(dossierTravaille(), MOT_DE_PASSE)
    await expect(deserialiser(fichier)).rejects.toThrowError(/protégé par un mot de passe/)
  })

  it('ne prétend pas distinguer un mauvais mot de passe d’un fichier altéré', async () => {
    const fichier = await serialiser(dossierTravaille(), MOT_DE_PASSE)
    await expect(deserialiser(fichier, 'mauvais')).rejects.toThrowError(
      /mot de passe est incorrect, ou le fichier a été altéré/,
    )
  })

  it('produit un sel et un vecteur différents à chaque enregistrement', async () => {
    const dossier = dossierTravaille()
    const un = JSON.parse(await serialiser(dossier, MOT_DE_PASSE)) as { kdf: { sel: string } }
    const deux = JSON.parse(await serialiser(dossier, MOT_DE_PASSE)) as { kdf: { sel: string } }
    expect(un.kdf.sel).not.toBe(deux.kdf.sel)
  })
})

describe('fichiers abîmés', () => {
  it('détecte un dossier tronqué ou retouché', async () => {
    const fichier = await serialiser(dossierTravaille())
    const altere = fichier.replace('D-2026-014', 'D-2026-999')

    await expect(deserialiser(altere)).rejects.toThrowError(ErreurFichierDossier)
    await expect(deserialiser(altere)).rejects.toThrowError(/modifié ou tronqué/)
  })

  it('dit quoi faire devant un fichier illisible', async () => {
    await expect(deserialiser('{ ceci n’est pas du JSON')).rejects.toThrowError(/tronqué/)
  })

  it('refuse un JSON qui n’est pas un dossier Clauzy', async () => {
    await expect(deserialiser('{"format":"autre"}')).rejects.toThrowError(/pas un dossier Clauzy/)
  })

  it('refuse une enveloppe Clauzy sans dossier exploitable', async () => {
    const bidon = JSON.stringify({
      format: 'clauzy',
      version: 1,
      chiffre: false,
      empreinte: 'x',
      dossier: { reference: 'X' },
    })
    await expect(deserialiser(bidon)).rejects.toThrowError(ErreurFichierDossier)
  })

  it('refuse un format plus récent en disant comment le lire', async () => {
    const dossier = dossierTravaille()
    const futur = JSON.parse(await serialiser(dossier)) as Record<string, unknown>
    futur.version = 99
    await expect(deserialiser(JSON.stringify(futur))).rejects.toThrowError(
      /Mettez l’application à jour/,
    )
  })
})

describe('nom de fichier proposé', () => {
  it('reprend la référence et la date', () => {
    const dossier = majReference(dossierVierge(), 'D-2026-014')
    expect(nomFichier(dossier, new Date('2026-08-20T10:00:00Z'))).toBe('D-2026-014-2026-08-20.clauzy')
  })

  it('reste utilisable sans référence saisie', () => {
    expect(nomFichier(dossierVierge(), new Date('2026-08-20T10:00:00Z'))).toBe(
      'dossier-2026-08-20.clauzy',
    )
  })

  it('neutralise ce qui casserait un nom de fichier', () => {
    const dossier = majReference(dossierVierge(), 'Bail / Carrefour : lot 12')
    expect(nomFichier(dossier, new Date('2026-08-20T10:00:00Z'))).toBe(
      'Bail-Carrefour-lot-12-2026-08-20.clauzy',
    )
  })
})
