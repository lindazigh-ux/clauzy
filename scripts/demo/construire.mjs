/**
 * Construit la demonstration autonome : un seul fichier HTML, executable hors
 * ligne, sans serveur.
 *
 *   node scripts/demo/construire.mjs
 *
 * Elle embarque le produit reel — les 40 controles, le moteur, le corpus, le
 * poste de travail et les deux exports. Deux ecarts avec l'application, tous
 * deux annonces a l'ecran :
 *   - l'analyse tourne sur le fil principal, faute de Web Worker dans un
 *     bundle d'un seul fichier ;
 *   - les moteurs de lecture PDF/Word/Outlook sont exclus, faute de quoi le
 *     fichier passerait plusieurs megaoctets. L'import de texte fonctionne, et
 *     le jeu d'exemple ne demande aucun import.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const ICI = dirname(fileURLToPath(import.meta.url))
const RACINE = join(ICI, '..', '..')
const SORTIE = process.argv[2] ?? join(RACINE, 'demo', 'clauzy-demo.html')

/** Les lecteurs binaires sont remplaces par un message qui dit quoi faire. */
const lecteursAbsents = {
  name: 'lecteurs-absents',
  setup(chantier) {
    chantier.onResolve({ filter: /^(pdfjs-dist|mammoth|@kenjiuno\/msgreader)/ }, (args) => ({
      path: args.path,
      namespace: 'absent',
    }))
    chantier.onLoad({ filter: /.*/, namespace: 'absent' }, () => ({
      contents: `
        const refus = () => {
          throw new Error(
            'Cette démonstration ne lit que le texte brut. Pour importer un PDF, un document ' +
            'Word ou un courriel Outlook, lancez l’application complète.',
          )
        }
        export const getDocument = refus
        export const extractRawText = refus
        export default refus
      `,
      loader: 'js',
    }))
  },
}

const resultat = await build({
  entryPoints: [join(ICI, 'entree.tsx')],
  bundle: true,
  // Espaces et syntaxe compresses, mais NOMS CONSERVES : la page reste
  // inspectable, ce qui sied a un produit vendu sur la transparence — et les
  // noms de classes des CSS Modules restent lisibles.
  minifyWhitespace: true,
  minifySyntax: true,
  minifyIdentifiers: false,
  format: 'iife',
  target: ['es2022'],
  jsx: 'automatic',
  write: false,
  metafile: true,
  // `local-css` reproduit le comportement des CSS Modules de Next : les classes
  // sont localisees, et le CSS ressort dans un fichier a part que l'on inline.
  loader: { '.module.css': 'local-css', '.css': 'css' },
  outdir: join(RACINE, 'demo'),
  alias: {
    'next/link': join(ICI, 'shim-link.tsx'),
    '@/lib/analyse/client': join(ICI, 'shim-analyse.ts'),
  },
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [lecteursAbsents],
  logLevel: 'warning',
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
