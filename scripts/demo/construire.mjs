/**
 * Construit la demonstration autonome : un seul fichier HTML, executable hors
 * ligne, sans serveur.
 *
 *   node scripts/demo/construire.mjs
 *
 * Elle embarque le produit reel — les 40 controles, le moteur, le corpus, le
 * poste de travail, les deux exports ET les trois lecteurs de documents (PDF,
 * Word, Outlook). Un seul ecart subsiste avec l'application, annonce a l'ecran :
 * l'analyse tourne sur le fil principal, faute de Web Worker dans un bundle
 * d'un seul fichier.
 *
 * Deux ajustements sont necessaires pour que les lecteurs tiennent dans un
 * fichier unique, et aucun ne touche au code du produit :
 *
 *   - `buffer` : iconv-lite (via msgreader) et jszip reclament le module Node.
 *     L'application le recoit de Next, qui polyfille `buffer` pour le
 *     navigateur ; ici on pointe vers exactement le meme polyfill.
 *   - le worker de pdfjs : hors bundler, pdfjs va chercher son worker par une
 *     URL relative, ce qu'un fichier unique ne peut pas offrir. On le compile a
 *     part, on l'embarque en texte, et le shim l'installe en blob: au premier
 *     usage. C'est ce que fait un bundler, fait a la main.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const ICI = dirname(fileURLToPath(import.meta.url))
const RACINE = join(ICI, '..', '..')
const SORTIE = process.argv[2] ?? join(RACINE, 'demo', 'clauzy-demo.html')

/** Reglages communs aux deux passes : la meme cible, les memes compromis. */
const COMMUN = {
  bundle: true,
  // Espaces et syntaxe compresses, mais NOMS CONSERVES : la page reste
  // inspectable, ce qui sied a un produit vendu sur la transparence — et les
  // noms de classes des CSS Modules restent lisibles.
  minifyWhitespace: true,
  minifySyntax: true,
  minifyIdentifiers: false,
  format: 'iife',
  target: ['es2022'],
  write: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'warning',
}

/**
 * Passe 1 — le worker de pdfjs, compile pour vivre dans un blob:.
 *
 * Il ne partage rien avec le bundle principal : c'est un programme separe, qui
 * tourne dans son propre fil. On le garde tel quel, en texte.
 */
const worker = await build({
  ...COMMUN,
  entryPoints: [join(RACINE, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs')],
  outfile: join(RACINE, 'demo', 'pdf.worker.js'),
})
const sourceWorker = worker.outputFiles[0]?.text ?? ''

/**
 * Le shim pdfjs a besoin du code du worker sous forme de chaine. On le lui
 * passe par un module virtuel plutot que par un fichier ecrit sur le disque :
 * rien a nettoyer, rien a versionner.
 */
const workerEmbarque = {
  name: 'worker-pdf-embarque',
  setup(chantier) {
    chantier.onResolve({ filter: /^virtuel:pdf-worker$/ }, (args) => ({
      path: args.path,
      namespace: 'virtuel',
    }))
    chantier.onLoad({ filter: /^virtuel:pdf-worker$/, namespace: 'virtuel' }, () => ({
      contents: `export const SOURCE_WORKER = ${JSON.stringify(sourceWorker)}`,
      loader: 'js',
    }))
  },
}

/** Passe 2 — l'application. */
const resultat = await build({
  ...COMMUN,
  entryPoints: [join(ICI, 'entree.tsx')],
  metafile: true,
  jsx: 'automatic',
  // `local-css` reproduit le comportement des CSS Modules de Next : les classes
  // sont localisees, et le CSS ressort dans un fichier a part que l'on inline.
  loader: { '.module.css': 'local-css', '.css': 'css' },
  outdir: join(RACINE, 'demo'),
  define: {
    ...COMMUN.define,
    // Le polyfill `buffer` de Next est compile pour webpack, qui fournit
    // `__dirname` aux bundles navigateur. esbuild ne le fait pas : on reprend
    // la meme valeur que webpack, faute de quoi la lecture d'un .msg echoue
    // sur « __dirname is not defined ».
    __dirname: '"/"',
  },
  alias: {
    'next/link': join(ICI, 'shim-link.tsx'),
    '@/lib/analyse/client': join(ICI, 'shim-analyse.ts'),
    'pdfjs-dist/legacy/build/pdf.mjs': join(ICI, 'shim-pdfjs.ts'),
    // Le meme polyfill que celui que Next injecte dans le bundle navigateur.
    buffer: join(RACINE, 'node_modules', 'next', 'dist', 'compiled', 'buffer', 'index.js'),
  },
  plugins: [workerEmbarque],
})

const fichiers = new Map(resultat.outputFiles.map((f) => [f.path.split('.').pop(), f.text]))
const js = fichiers.get('js') ?? ''
const css = fichiers.get('css') ?? ''

const gabarit = readFileSync(join(ICI, 'gabarit.html'), 'utf8')
const html = gabarit
  .replace('/*STYLES*/', () => css)
  .replace('/*SCRIPT*/', () => js)

mkdirSync(dirname(SORTIE), { recursive: true })
writeFileSync(SORTIE, html)

const ko = (n) => `${Math.round((n / 1024) * 10) / 10} Ko`
console.log(`Démonstration écrite : ${SORTIE}`)
console.log(`  JavaScript ${ko(js.length)} · CSS ${ko(css.length)} · total ${ko(html.length)}`)
console.log(`  dont le worker pdfjs, embarqué en texte : ${ko(sourceWorker.length)}`)
