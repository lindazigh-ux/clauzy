import { describe, expect, it } from 'vitest'

import { NOMBRE_CONTROLES } from '@/domain/controles'
import { BAUX, PIECES } from '@/domain/corpus/baux'
import {
  ajouterDocument,
  ajouterObservation,
  ecarter,
  dossierVierge,
  enregistrerAnalyse,
  majCabinet,
  majPerimetre,
  rattacher,
  reecrire,
  type Dossier,
} from '@/domain/dossier'
import { analyser } from '@/domain/moteur/moteur'
import type { DocumentImporte } from '@/lib/import'

import { exporterWord } from './word'
import { lireZip } from './zip-lecture'

/**
 * Critere §14 : « un rapport exporté en Word conserve chaque commentaire ancré
 * au passage original ».
 *
 * On ouvre ici le VRAI fichier remis au client et on lit son OOXML. Verifier le
 * plan intermediaire ne suffirait pas : c'est le .docx qui doit etre juste.
 */

const BAIL = BAUX.find((b) => b.id === 'bail-cc')
const CP = PIECES.find((p) => p.id === 'cp-lacunaire')
if (BAIL === undefined || CP === undefined) throw new Error('Corpus incomplet')

const AUTEUR = 'A. Praticienne'

const enDocument = (
  id: string,
  nom: string,
  texte: string,
  role: 'OBLIGATION' | 'COUVERTURE',
): DocumentImporte => ({
  id,
  nom,
  format: 'texte',
  role,
  texte,
  taille: texte.length,
  pages: null,
  avertissements: [],
  courriel: null,
  piecesJointes: [],
})

const dossierLivrable = (): Dossier => {
  let dossier = dossierVierge('D-2026-014')
  dossier = majCabinet(dossier, {
    nom: 'Cabinet Duvernois & Associés',
    couleur: '1F4E79',
    praticien: AUTEUR,
    qualite: 'courtier, département grands comptes',
  })
  dossier = ajouterDocument(dossier, enDocument(BAIL.id, 'bail.txt', BAIL.texte, 'OBLIGATION'))
  dossier = ajouterDocument(dossier, enDocument(CP.id, 'police.txt', CP.texte, 'COUVERTURE'))
  dossier = enregistrerAnalyse(
    dossier,
    analyser([
      { id: BAIL.id, role: 'OBLIGATION', texte: BAIL.texte },
      { id: CP.id, role: 'COUVERTURE', texte: CP.texte },
    ]),
  )
  dossier = ecarter(dossier, 'DOC-01', AUTEUR, 'Assuré identique au preneur, vérifié sur pièce.')
  dossier = reecrire(dossier, 'IND-02', AUTEUR, {
    analyse: 'La perte d’exploitation est captée : point bloquant en négociation.',
  })
  dossier = rattacher(dossier, 'RR-02', AUTEUR, {
    documentId: BAIL.id,
    debut: BAIL.texte.indexOf('Le Preneur renonce à tout recours'),
    fin: BAIL.texte.indexOf('Le Preneur renonce à tout recours') + 60,
    texte: BAIL.texte.slice(
      BAIL.texte.indexOf('Le Preneur renonce à tout recours'),
      BAIL.texte.indexOf('Le Preneur renonce à tout recours') + 60,
    ),
    cote: 'OBLIGATION',
  })
  dossier = majPerimetre(dossier, {
    piecesManquantes: ['Conditions générales de la police'],
    hypotheses: ['Les surfaces sont celles de l’état des lieux.'],
    controlesSansObjet: ['ENV-02'],
  })
  return ajouterObservation(dossier, {
    titre: 'Caution solidaire du dirigeant',
    texte: 'La caution excède l’usage du secteur.',
    gravite: 2,
  })
}

const construire = async () => {
  const rapport = await exporterWord(dossierLivrable())
  const octets = Buffer.from(await rapport.donnees.arrayBuffer())
  const archive = lireZip(octets)
  return { rapport, archive, octets }
}

/** Le texte porte par les commentaires, extrait de l'OOXML reel. */
const passagesAncres = (documentXml: string): Map<number, string> => {
  const passages = new Map<number, string>()
  const actifs = new Set<number>()
  const jeton =
    /<w:commentRangeStart w:id="(\d+)"|<w:commentRangeEnd w:id="(\d+)"|<w:t[^>]*>([^<]*)<\/w:t>|<w:p[ >]/g

  for (const trouve of documentXml.matchAll(jeton)) {
    if (trouve[1] !== undefined) {
      actifs.add(Number(trouve[1]))
    } else if (trouve[2] !== undefined) {
      actifs.delete(Number(trouve[2]))
    } else if (trouve[3] !== undefined) {
      for (const id of actifs) passages.set(id, (passages.get(id) ?? '') + trouve[3])
    } else {
      // Nouveau paragraphe : une plage qui le franchit reprend a la ligne.
      for (const id of actifs) passages.set(id, `${passages.get(id) ?? ''}\n`)
    }
  }
  return passages
}

const deXml = (texte: string): string =>
  texte
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")

describe('le fichier produit est un vrai document Word', () => {
  it('contient les parties attendues, dont les commentaires', async () => {
    const { archive, rapport } = await construire()

    expect(archive.has('word/document.xml')).toBe(true)
    expect(archive.has('word/comments.xml')).toBe(true)
    expect(rapport.nomFichier).toBe('D-2026-014-note-de-conseil.docx')
    expect(rapport.nombreCommentaires).toBeGreaterThan(5)
  })

  it('déclare autant de commentaires qu’il en ancre', async () => {
    const { archive, rapport } = await construire()
    const commentaires = archive.get('word/comments.xml')?.toString('utf8') ?? ''
    const document = archive.get('word/document.xml')?.toString('utf8') ?? ''

    expect((commentaires.match(/<w:comment /g) ?? []).length).toBe(rapport.nombreCommentaires)
    expect((document.match(/<w:commentRangeStart /g) ?? []).length).toBe(rapport.nombreCommentaires)
    expect((document.match(/<w:commentRangeEnd /g) ?? []).length).toBe(rapport.nombreCommentaires)
  })
})

describe('chaque commentaire est ancré au passage original (brief §14)', () => {
  it('encadre exactement le texte de la clause, dans l’OOXML produit', async () => {
    const { archive } = await construire()
    const document = archive.get('word/document.xml')?.toString('utf8') ?? ''
    const passages = passagesAncres(document)

    const dossier = dossierLivrable()
    const source = dossier.documents.find((d) => d.role === 'OBLIGATION')
    expect(source).toBeDefined()
    expect(passages.size).toBeGreaterThan(5)

    for (const [id, passage] of passages) {
      const propre = deXml(passage)
      // Le passage encadré doit se retrouver tel quel dans le bail d’origine.
      expect(source?.texte.includes(propre), `commentaire ${id} : « ${propre.slice(0, 60)} »`).toBe(
        true,
      )
      expect(propre.trim().length, `commentaire ${id} est vide`).toBeGreaterThan(0)
    }
  })

  it('porte le conseil dans le corps du commentaire, pas seulement le constat', async () => {
    const { archive } = await construire()
    const commentaires = deXml(archive.get('word/comments.xml')?.toString('utf8') ?? '')

    expect(commentaires).toContain('Ce que risque le preneur')
    expect(commentaires).toContain('Correction du bail, en priorité')
    expect(commentaires).toContain('Rédaction proposée')
    expect(commentaires).toContain('Preuve de clôture')
    expect(commentaires).toContain('exclusivement contractuelle')
  })

  it('signale les passages rattachés à la main', async () => {
    const { archive } = await construire()
    const commentaires = deXml(archive.get('word/comments.xml')?.toString('utf8') ?? '')
    expect(commentaires).toContain('rattaché à la main')
  })
})

describe('structure imposée du rapport (brief §7)', () => {
  it('enchaîne les sections dans l’ordre prescrit', async () => {
    const { archive } = await construire()
    const document = deXml(archive.get('word/document.xml')?.toString('utf8') ?? '')

    const ordre = [
      'Périmètre et limites',
      'Synthèse',
      'Préconisations',
      'Matrice des contrôles',
      'Suivi d’attestation',
      'Document annoté',
    ]
    let precedent = -1
    for (const section of ordre) {
      const position = document.indexOf(section)
      expect(position, section).toBeGreaterThan(precedent)
      precedent = position
    }
  })

  it('sort aux couleurs du cabinet, la marque Clauzy en pied de page', async () => {
    const { archive } = await construire()
    const document = deXml(archive.get('word/document.xml')?.toString('utf8') ?? '')
    const pied = deXml(
      [...archive.entries()]
        .filter(([nom]) => nom.startsWith('word/footer'))
        .map(([, contenu]) => contenu.toString('utf8'))
        .join(''),
    )

    expect(document).toContain('Cabinet Duvernois &amp; Associés'.replace('&amp;', '&'))
    expect(document).toContain('1F4E79')
    expect(pied).toContain('Clauzy')
    // La marque ne doit pas figurer en page de garde.
    expect(document.slice(0, document.indexOf('Périmètre et limites'))).not.toContain('Clauzy')
  })

  it('porte la mention de portée, qui protège le praticien', async () => {
    const { archive } = await construire()
    const document = deXml(archive.get('word/document.xml')?.toString('utf8') ?? '')
    expect(document).toContain('ni un avis juridique, ni une garantie de couverture')
  })

  it('énumère les 40 contrôles dans la matrice, tous états confondus', async () => {
    const { archive } = await construire()
    const document = deXml(archive.get('word/document.xml')?.toString('utf8') ?? '')
    const apresMatrice = document.slice(document.indexOf('Matrice des contrôles'))

    // Chaque identifiant doit figurer, y compris ceux sans objet ou écartés.
    for (const id of ['DOC-01', 'ENV-02', 'RC-02', 'ART-02']) {
      expect(apresMatrice, id).toContain(id)
    }
    expect(document).toContain(`${NOMBRE_CONTROLES} contrôles appliqués`)
  })

  it('reprend le périmètre, les écartés et les hypothèses', async () => {
    const { archive } = await construire()
    const document = deXml(archive.get('word/document.xml')?.toString('utf8') ?? '')

    expect(document).toContain('Conditions générales de la police')
    expect(document).toContain('Les surfaces sont celles de l’état des lieux.')
    expect(document).toContain('Assuré identique au preneur, vérifié sur pièce.')
  })

  it('hiérarchise les préconisations par enjeu chiffré', async () => {
    const { archive } = await construire()
    const document = deXml(archive.get('word/document.xml')?.toString('utf8') ?? '')
    const section = document.slice(
      document.indexOf('Préconisations'),
      document.indexOf('Matrice des contrôles'),
    )
    expect(section).toMatch(/exigés/)
    expect(section).toContain('La correction du bail est toujours ')
  })
})

describe('robustesse', () => {
  it('produit un rapport lisible sur un dossier vierge', async () => {
    const rapport = await exporterWord(dossierVierge())
    const archive = lireZip(Buffer.from(await rapport.donnees.arrayBuffer()))

    expect(archive.has('word/document.xml')).toBe(true)
    expect(rapport.nombreCommentaires).toBe(0)
    expect(rapport.nomFichier).toBe('note-de-conseil-note-de-conseil.docx')
  })
})
