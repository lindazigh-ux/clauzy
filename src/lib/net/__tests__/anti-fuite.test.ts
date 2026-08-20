/**
 * Test anti-fuite documentaire — ecrit AVANT la couche reseau (brief §12, lot L0).
 *
 * Critere de sortie du lot L0 : "Le test echoue si on tente d'envoyer du texte."
 *
 * Ce fichier est le garde-fou du differenciateur commercial du produit (§2).
 * Il ne doit jamais etre assoupli pour faire passer une fonctionnalite : si une
 * fonctionnalite exige d'envoyer du contenu documentaire au serveur, c'est la
 * fonctionnalite qui doit etre repensee cote client, pas ce test.
 */
import { describe, expect, it, vi, afterEach } from 'vitest'

import {
  CATALOGUE_ENDPOINTS,
  CLES_INTERDITES,
  ErreurFuiteDocumentaire,
  appelApi,
  verifierChargeSortante,
  type NomEndpoint,
} from '../index'

const rejette = (nom: NomEndpoint, charge: Record<string, unknown>) =>
  expect(() => verifierChargeSortante(nom, charge)).toThrowError(ErreurFuiteDocumentaire)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('§2 — les cinq familles de champs nommees par le brief', () => {
  // "Un test automatise echoue si un champ de type text, clause, extrait,
  //  citation ou nomFichier apparait dans un payload sortant."
  const familles: Record<string, unknown> = {
    text: 'Le preneur souscrira une police multirisque.',
    texte: 'Le preneur souscrira une police multirisque.',
    clause: 'Article 12 — Assurances',
    extrait: '...renonciation reciproque a recours...',
    citation: 'Le bailleur renonce a tout recours contre le preneur.',
    nomFichier: 'bail-carrefour-lille.pdf',
  }

  for (const [cle, valeur] of Object.entries(familles)) {
    it(`refuse le champ « ${cle} »`, () => {
      rejette('dossierMeta.creer', { reference: 'D-2026-014', [cle]: valeur })
    })
  }
})

describe('detection en profondeur', () => {
  it('refuse un champ interdit imbrique dans un objet', () => {
    rejette('usage.evenement', {
      type: 'analyse_terminee',
      meta: { source: { texte: 'Article 12 — Assurances' } },
    })
  })

  it('refuse un champ interdit imbrique dans un tableau', () => {
    rejette('usage.evenement', {
      type: 'analyse_terminee',
      pieces: [{ nomFichier: 'conditions-particulieres.pdf' }],
    })
  })

  it('refuse toute imbrication, meme sans champ nomme interdit', () => {
    // Un objet imbrique est une porte ouverte : seules des metadonnees
    // scalaires ont le droit de quitter le navigateur (§2).
    rejette('dossierMeta.creer', { reference: 'D-2026-014', divers: { a: 'b' } })
  })

  it('refuse chaque cle de la liste noire, a n importe quelle profondeur', () => {
    expect(CLES_INTERDITES.length).toBeGreaterThan(20)
    for (const cle of CLES_INTERDITES) {
      rejette('usage.evenement', { type: 'ping', [cle]: 'x' })
    }
  })

  it('normalise les cles avant comparaison (accents, casse, separateurs)', () => {
    for (const cle of ['TEXTE', 'Nom_Fichier', 'nom-fichier', 'extraït', 'Clause ']) {
      rejette('dossierMeta.creer', { reference: 'D-1', [cle]: 'x' })
    }
  })
})

describe('allowlist de champs par endpoint', () => {
  it('refuse un champ non declare, meme anodin', () => {
    rejette('usage.evenement', { type: 'ping', couleurPreferee: 'violet' })
  })

  it('refuse un corps sur un endpoint qui n en accepte aucun', () => {
    rejette('session.courante', { reference: 'D-2026-014' })
  })

  it('chaque endpoint declare explicitement ses champs (aucun joker)', () => {
    for (const [nom, def] of Object.entries(CATALOGUE_ENDPOINTS)) {
      expect(def.champs, `${nom} doit declarer ses champs`).toBeTypeOf('object')
      for (const [champ, spec] of Object.entries(def.champs)) {
        expect(spec.type, `${nom}.${champ}`).toMatch(/^(chaine|nombre|booleen)$/)
        if (spec.type === 'chaine') {
          expect(spec.longueurMax, `${nom}.${champ} doit plafonner sa longueur`).toBeGreaterThan(0)
          expect(spec.longueurMax, `${nom}.${champ} plafond trop haut`).toBeLessThanOrEqual(512)
        }
      }
    }
  })
})

describe('heuristiques de contenu documentaire', () => {
  it('refuse une chaine plus longue que le plafond du champ', () => {
    rejette('dossierMeta.creer', { reference: 'a'.repeat(400) })
  })

  it('refuse une chaine multi-lignes (signature d un extrait de document)', () => {
    rejette('dossierMeta.creer', { reference: 'Article 12\nAssurances' })
  })

  it('refuse un type de valeur non prevu par la specification du champ', () => {
    rejette('usage.evenement', { type: 42 })
    rejette('usage.evenement', { type: 'ping', gravite: 'trois' })
  })

  it('refuse une valeur hors de l enumeration declaree', () => {
    rejette('usage.evenement', { type: 'ping', gravite: 9 })
  })
})

describe('cas reels que le produit doit rendre impossibles', () => {
  it('refuse un dossier complet', () => {
    rejette('dossierMeta.creer', {
      reference: 'D-2026-014',
      client: { raisonSociale: 'Enseigne SA', adresse: '1 rue X', activite: 'commerce' },
      documents: [{ id: '1', nom: 'bail.pdf', type: 'BAIL', texte: 'Article 1...' }],
    })
  })

  it('refuse un resultat de controle avec son extrait de bail', () => {
    rejette('usage.evenement', {
      type: 'controle_declenche',
      controleId: 'IND-02',
      gravite: 3,
      extrait: 'Les pertes d exploitation sont garanties douze mois.',
    })
  })

  it('refuse le contenu d un mail Outlook importe', () => {
    rejette('usage.evenement', { type: 'attestation_importee', corps: 'Bonjour, veuillez trouver...' })
  })
})

describe('charges legitimes (§2 — ce qui peut transiter)', () => {
  it('accepte une metadonnee de dossier saisie manuellement', () => {
    expect(() =>
      verifierChargeSortante('dossierMeta.creer', { reference: 'D-2026-014', statut: 'EN_COURS' }),
    ).not.toThrow()
  })

  it('accepte une statistique strictement anonyme', () => {
    expect(() =>
      verifierChargeSortante('usage.evenement', {
        type: 'controle_declenche',
        controleId: 'IND-02',
        gravite: 3,
        dureeMs: 1840,
      }),
    ).not.toThrow()
  })

  it('accepte une identification utilisateur', () => {
    expect(() =>
      verifierChargeSortante('auth.connexion', {
        email: 'praticienne@cabinet.fr',
        motDePasse: 'un-mot-de-passe-long-et-solide',
      }),
    ).not.toThrow()
  })
})

describe('appelApi — le garde s execute avant le reseau', () => {
  it('ne declenche aucun fetch quand la charge est refusee', async () => {
    const espion = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))

    await expect(
      appelApi('dossierMeta.creer', { reference: 'D-1', texte: 'Article 12' } as never),
    ).rejects.toThrowError(ErreurFuiteDocumentaire)

    expect(espion).not.toHaveBeenCalled()
  })

  it('refuse un endpoint inconnu', async () => {
    const espion = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    await expect(appelApi('exfiltration.discrete' as NomEndpoint)).rejects.toThrow()
    expect(espion).not.toHaveBeenCalled()
  })

  it('n appelle que des chemins relatifs de la meme origine', async () => {
    for (const def of Object.values(CATALOGUE_ENDPOINTS)) {
      expect(def.chemin.startsWith('/api/'), `${def.chemin} doit etre relatif`).toBe(true)
      expect(def.chemin).not.toMatch(/^https?:/)
    }
  })
})
