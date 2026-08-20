import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { analyser } from '@/domain/moteur/moteur'
import { segmenter } from '@/domain/moteur/segmentation'

import {
  ErreurLecture,
  TAILLE_MAX_OCTETS,
  detecterFormat,
  documentsAnalysables,
  lireDocument,
} from './index'

/**
 * Ces tests lisent de VRAIS fichiers, produits par
 * `src/lib/import/__fixtures__/generer.mjs`. Un objet simulé ne prouverait que
 * la forme de mes propres mocks ; un vrai PDF prouve l'intégration de pdfjs.
 *
 * Les fixtures sont fabriquées de toutes pièces — jamais un document client,
 * même anonymisé (brief §5.4, §13).
 */

const fixture = (nom: string): ArrayBuffer => {
  const buffer = readFileSync(join(import.meta.dirname, '__fixtures__', nom))
  const copie = new ArrayBuffer(buffer.byteLength)
  new Uint8Array(copie).set(buffer)
  return copie
}

const octets = (valeurs: number[]): ArrayBuffer => new Uint8Array(valeurs).buffer

describe('détection du format', () => {
  it('se fie au contenu, pas à l’extension', () => {
    // Un « .docx » qui est en réalité un PDF doit se lire quand même.
    expect(detecterFormat('bail.docx', fixture('bail-minimal.pdf'))).toBe('pdf')
    expect(detecterFormat('police.txt', fixture('bail-minimal.docx'))).toBe('docx')
  })

  it('reconnaît le conteneur OLE d’un courriel Outlook', () => {
    expect(detecterFormat('mail.msg', octets([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))).toBe(
      'msg',
    )
  })

  it('retombe sur l’extension quand la signature est muette', () => {
    expect(detecterFormat('note.txt', octets([0x41, 0x42, 0x43]))).toBe('texte')
    expect(detecterFormat('bail.pdf', octets([0x41, 0x42, 0x43]))).toBe('pdf')
  })
})

describe('lecture d’un PDF', () => {
  it('extrait le texte et reconstitue les lignes', async () => {
    const document = await lireDocument('bail-minimal.pdf', fixture('bail-minimal.pdf'))

    expect(document.format).toBe('pdf')
    expect(document.pages).toBe(1)
    expect(document.avertissements).toEqual([])
    expect(document.texte).toContain('ARTICLE 12 - ASSURANCES DU PRENEUR')
    expect(document.texte).toContain('Toute franchise demeure a la charge du preneur.')
  })

  it('produit un texte que la segmentation sait découper', async () => {
    // C’est le vrai critère : un PDF mal reconstitué ne lève aucune erreur,
    // il produit un pavé dans lequel plus aucun article n’est reconnu.
    const document = await lireDocument('bail-minimal.pdf', fixture('bail-minimal.pdf'))
    const segments = segmenter(document.id, document.texte)

    expect(segments.some((s) => s.numero === '12')).toBe(true)
  })

  it('alimente le moteur, qui rend ses 40 résultats', async () => {
    const document = await lireDocument('bail-minimal.pdf', fixture('bail-minimal.pdf'))
    const analyse = analyser(documentsAnalysables([document]))

    expect(analyse.resultats).toHaveLength(40)
    // La franchise à la charge du preneur est l’écart que ce bail contient.
    expect(analyse.resultats.find((r) => r.controleId === 'DAB-05')?.statut).toBe('ECART')
  })
})

describe('lecture d’un document Word', () => {
  it('extrait le texte en conservant les paragraphes', async () => {
    const document = await lireDocument('bail-minimal.docx', fixture('bail-minimal.docx'))

    expect(document.format).toBe('docx')
    expect(document.texte).toContain('ARTICLE 12 - ASSURANCES DU PRENEUR')
    expect(document.texte.split('\n').filter((l) => l.trim().length > 0)).toHaveLength(3)
  })

  it('produit un texte segmentable', async () => {
    const document = await lireDocument('bail-minimal.docx', fixture('bail-minimal.docx'))
    expect(segmenter(document.id, document.texte).some((s) => s.numero === '12')).toBe(true)
  })
})

describe('lecture d’un fichier texte', () => {
  it('normalise les fins de ligne Windows', async () => {
    const contenu = new TextEncoder().encode('ARTICLE 12 — ASSURANCES\r\nLe Preneur assure.\r\n')
    const document = await lireDocument('bail.txt', contenu.buffer as ArrayBuffer)

    expect(document.format).toBe('texte')
    expect(document.texte).not.toContain('\r')
    expect(document.texte).toContain('ARTICLE 12 — ASSURANCES\nLe Preneur assure.')
  })

  it('signale un fichier sans texte exploitable', async () => {
    const document = await lireDocument('vide.txt', new TextEncoder().encode('   ').buffer as ArrayBuffer)
    expect(document.avertissements).toHaveLength(1)
  })
})

describe('erreurs de lecture', () => {
  it('dit quoi faire, jamais « une erreur est survenue »', async () => {
    await expect(lireDocument('vide.pdf', new ArrayBuffer(0))).rejects.toThrowError(ErreurLecture)

    try {
      await lireDocument('vide.pdf', new ArrayBuffer(0))
    } catch (erreur) {
      expect((erreur as ErreurLecture).message).toMatch(/Vérifiez le fichier/)
      expect((erreur as ErreurLecture).message).not.toMatch(/une erreur est survenue/i)
    }
  })

  it('refuse un fichier trop lourd en expliquant la suite', async () => {
    const enorme = new ArrayBuffer(TAILLE_MAX_OCTETS + 1)
    await expect(lireDocument('scan.pdf', enorme)).rejects.toThrowError(/couche texte/)
  })

  it('rend un PDF illisible actionnable', async () => {
    const faux = new TextEncoder().encode('%PDF-1.4\nceci n’est pas un PDF')
    await expect(lireDocument('casse.pdf', faux.buffer as ArrayBuffer)).rejects.toThrowError(
      /Réenregistrez-le|collez son texte/,
    )
  })
})

describe('aplatissement pour le moteur', () => {
  it('ne transmet ni le nom du fichier, ni les documents vides', async () => {
    const document = await lireDocument('bail-minimal.pdf', fixture('bail-minimal.pdf'))
    const vide = await lireDocument('vide.txt', new TextEncoder().encode('  ').buffer as ArrayBuffer)

    const analysables = documentsAnalysables([document, vide])

    expect(analysables).toHaveLength(1)
    // Le moteur n’a pas besoin du nom du fichier : ce qui n’existe pas ne peut
    // pas fuir (brief §2).
    expect(Object.keys(analysables[0] ?? {}).sort()).toEqual(['id', 'role', 'texte'])
  })
})
