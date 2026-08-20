/**
 * Lecture d'un PDF (brief §3).
 *
 * pdfjs est charge en import DYNAMIQUE : il ne doit jamais apparaitre dans le
 * bundle initial (§13), et `scripts/budget-js.mjs` echoue si c'est le cas.
 *
 * Aucune URL distante n'est configuree — ni `standardFontDataUrl`, ni
 * `useWorkerFetch`. C'est delibere : lire un document ne doit dependre d'aucun
 * service tiers (§14), et la CSP interdirait de toute facon la connexion (§2).
 *
 * La version 6 est exigee : les versions 5.x portent une faille permettant
 * l'execution de code arbitraire a l'ouverture d'un PDF hostile. Sur un produit
 * qui ouvre les documents du client dans son navigateur, c'est redhibitoire.
 *
 * Le build « legacy » est utilise a dessein : il embarque ses propres polyfills
 * et fonctionne aussi bien dans un Worker que dans un navigateur ancien. Charge
 * a la demande, son poids ne coute rien au premier rendu.
 */
import { reconstituerTexte, type FragmentTexte } from './lignes'

type ElementTexte = {
  readonly str?: unknown
  readonly width?: unknown
  readonly height?: unknown
  readonly transform?: unknown
}

const nombre = (valeur: unknown, defaut = 0): number =>
  typeof valeur === 'number' && Number.isFinite(valeur) ? valeur : defaut

const enFragment = (element: ElementTexte): FragmentTexte | null => {
  if (typeof element.str !== 'string' || element.str.length === 0) return null
  const transform = Array.isArray(element.transform) ? element.transform : []
  return {
    texte: element.str,
    x: nombre(transform[4]),
    y: nombre(transform[5]),
    largeur: nombre(element.width),
    hauteur: nombre(element.height, 10),
  }
}

export type LecturePdf = {
  readonly texte: string
  readonly pages: number
  readonly avertissements: readonly string[]
}

export async function lirePdf(donnees: ArrayBuffer): Promise<LecturePdf> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const tache = pdfjs.getDocument({
    data: new Uint8Array(donnees),
    // Un PDF hostile ne doit rien aller chercher sur le reseau.
    useWorkerFetch: false,
  })
  const document = await tache.promise

  const avertissements: string[] = []
  const pages: string[] = []

  for (let numero = 1; numero <= document.numPages; numero += 1) {
    const page = await document.getPage(numero)
    const contenu = await page.getTextContent()
    const fragments = (contenu.items as ElementTexte[])
      .map(enFragment)
      .filter((fragment): fragment is FragmentTexte => fragment !== null)

    const texte = reconstituerTexte(fragments)
    if (texte.trim().length === 0) {
      avertissements.push(
        `Page ${numero} : aucun texte n’a pu être extrait. S’il s’agit d’un scan, ` +
          `fournissez une version avec couche texte, ou rattachez les clauses à la main.`,
      )
    }
    pages.push(texte)
  }

  await tache.destroy()

  return {
    // Une page ne coupe pas une stipulation : on separe par un saut de
    // paragraphe, que la segmentation lit comme une frontiere d'alinea.
    texte: pages.join('\n\n'),
    pages: document.numPages,
    avertissements,
  }
}
