import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'

import { NOMBRE_CONTROLES } from '@/domain/controles'
import { RapportImprimable } from '@/app/dossier/composants/RapportImprimable'
import { exporterWord } from '@/lib/export/word'
import { lireZip } from '@/lib/export/zip-lecture'

import { dossierDeReference } from './fixture'
import { faitsDuRapport } from '../faits'

/**
 * PARITÉ DES LIVRABLES.
 *
 * La note Word et le rapport client sortent de deux moteurs sans rapport :
 * l'un écrit du OOXML, l'autre du HTML pour l'impression. Rien n'empêchait
 * l'un d'annoncer « 45 contrôles » pendant que l'autre en disait 40, ni l'un
 * d'omettre des pièces manquantes que l'autre listait. Le défaut ne se
 * découvrait qu'entre les mains du client.
 *
 * Ce test met les deux livrables côte à côte, produits du MÊME dossier, et
 * exige qu'ils portent les mêmes faits métier. La mise en forme reste libre ;
 * les faits, non.
 */

/** Le texte lisible d'un rendu React, balises retirées. */
const texteDuRapport = (markup: string): string =>
  markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&#39;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;| | /g, ' ')
    .replace(/\s+/g, ' ')

/** Le texte d'un .docx, balises OOXML retirées. */
const texteDuWord = (xml: string): string =>
  xml
    .replace(/<w:tab\b[^>]*\/>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, '’')
    .replace(/ | /g, ' ')
    .replace(/\s+/g, ' ')

/**
 * La casse est de la mise en forme, pas un fait : la note Word compose les
 * niveaux de preuve en capitales, le rapport client en bas de casse. Les deux
 * disent la même chose, et le test ne doit pas confondre style et contenu.
 */
const normaliser = (texte: string): string =>
  texte.replace(/ | /g, ' ').replace(/\s+/g, ' ').trim().toLocaleLowerCase('fr')

describe('la note Word et le rapport client disent la même chose', () => {
  const dossier = dossierDeReference()
  const faits = faitsDuRapport(dossier)

  let rapportTexte = ''
  let wordTexte = ''

  // Les deux livrables sont produits UNE fois, avant tout : des `it` qui se
  // passent un état mutable se cassent dès qu'on en isole un.
  beforeAll(async () => {
    rapportTexte = texteDuRapport(renderToStaticMarkup(<RapportImprimable dossier={dossier} />))
    const word = await exporterWord(dossier)
    const archive = lireZip(Buffer.from(await word.donnees.arrayBuffer()))
    wordTexte = texteDuWord(archive.get('word/document.xml')?.toString('utf8') ?? '')
  })

  it('les deux livrables se produisent', () => {
    expect(rapportTexte.length).toBeGreaterThan(2000)
    expect(wordTexte.length).toBeGreaterThan(2000)
  })

  it('le jeu de faits n’est pas vide', () => {
    expect(faits.length).toBeGreaterThan(60)
  })

  it('chaque fait figure dans le rapport client', () => {
    const manquants = faits.filter((f) => !normaliser(rapportTexte).includes(normaliser(f.texte)))
    expect(
      manquants.map((f) => `${f.rubrique} : ${f.texte.slice(0, 80)}`),
      'faits absents du rapport client',
    ).toEqual([])
  })

  it('chaque fait figure dans la note Word', () => {
    const manquants = faits.filter((f) => !normaliser(wordTexte).includes(normaliser(f.texte)))
    expect(
      manquants.map((f) => `${f.rubrique} : ${f.texte.slice(0, 80)}`),
      'faits absents de la note Word',
    ).toEqual([])
  })

  it('aucun des deux n’annonce un nombre de contrôles périmé', () => {
    for (const [nom, texte] of [
      ['rapport client', rapportTexte],
      ['note Word', wordTexte],
    ] as const) {
      // Le référentiel a compté 40 contrôles ; il en compte davantage. Un
      // livrable qui annonce encore 40 en aura menti sur ce qu'il a appliqué.
      //
      // Le motif ratisse large à dessein : la divergence trouvée disait
      // « les 40 ont été appliqués », que « 40 contrôles » ne voyait pas.
      expect(texte, `${nom} : nombre de contrôles recopié`).not.toMatch(
        /\b40\s+(?:contrôles?|résultats?|ont|lignes?)\b/i,
      )
      expect(texte, `${nom} : compte du référentiel`).toContain(String(NOMBRE_CONTROLES))
    }
  })
})
