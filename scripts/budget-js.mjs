/**
 * Budget de performance (brief §3, §13, §14).
 *
 *   - moins de 300 Ko de JavaScript au premier chargement ;
 *   - aucun moteur de parsing dans le bundle initial.
 *
 * A executer apres `next build`, en integration continue : un depassement doit
 * bloquer, pas se decouvrir en production.
 *
 *   node scripts/budget-js.mjs [--budget 300]
 *
 * Le chunk marque `noModule` est exclu : c'est le repli pour navigateurs
 * anciens, qu'un navigateur moderne ne telecharge pas.
 */
import { gzipSync } from 'node:zlib'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const argBudget = process.argv.indexOf('--budget')
const BUDGET_KO = argBudget === -1 ? 300 : Number(process.argv[argBudget + 1])

const RACINE = process.cwd()
const PAGES = join(RACINE, '.next', 'server', 'app')
const NEXT = join(RACINE, '.next')

/**
 * Interdits dans le bundle initial (brief §13) — chargement dynamique obligatoire.
 *
 * On cherche des empreintes INTERNES aux bibliotheques, pas leur nom de paquet :
 * l'application manipule legitimement les chaines « pdf », « docx » et « msg »
 * — noms de format, attribut `accept`, libelles d'interface. Chercher le
 * surnom du paquet ferait echouer le budget sur du texte a nous, et surtout
 * habituerait a ignorer l'alerte.
 */
const MOTEURS_DE_PARSING = [
  { nom: 'pdfjs-dist', empreintes: ['PDFWorker', 'Invalid PDF structure', 'GlobalWorkerOptions'] },
  { nom: 'mammoth', empreintes: ['Could not find file in options', 'word/document.xml'] },
  { nom: '@kenjiuno/msgreader', empreintes: ['__substg1.0_', '__nameid_version1.0'] },
  { nom: 'jszip', empreintes: ['JSZip'] },
  { nom: 'docx', empreintes: ['word/_rels/document.xml.rels'] },
  { nom: 'pdf-lib', empreintes: ['PDFHexString'] },
]

const ko = (octets) => Math.round((octets / 1024) * 10) / 10

const scriptsDeLaPage = (html) => {
  const sources = []
  for (const balise of html.matchAll(/<script\b[^>]*\bsrc="(\/_next\/[^"]+\.js)"[^>]*>/g)) {
    if (/\bnoModule\b/i.test(balise[0])) continue
    sources.push(balise[1])
  }
  return [...new Set(sources)]
}

const pages = readdirSync(PAGES)
  .filter((f) => f.endsWith('.html') && !f.startsWith('_'))
  .map((f) => ({
    page: '/' + f.replace(/\.html$/, '').replace(/^index$/, ''),
    fichier: join(PAGES, f),
  }))

if (pages.length === 0) {
  console.error('Aucune page prerendue trouvee. Lancez `npm run build` d abord.')
  process.exit(1)
}

let echec = false

console.log(`Budget : ${BUDGET_KO} Ko transferes au premier chargement (brief §14).\n`)
console.log('etat          page                     transfere    brut   fichiers')

for (const { page, fichier } of pages) {
  const sources = scriptsDeLaPage(readFileSync(fichier, 'utf-8'))

  let brut = 0
  let transfere = 0
  const contenus = []

  for (const src of sources) {
    const chemin = join(NEXT, src.replace('/_next/', ''))
    let donnees
    try {
      donnees = readFileSync(chemin)
      brut += statSync(chemin).size
    } catch {
      console.error(`  introuvable : ${src}`)
      echec = true
      continue
    }
    transfere += gzipSync(donnees, { level: 9 }).length
    contenus.push({ src, texte: donnees.toString('utf-8') })
  }

  const depasse = ko(transfere) > BUDGET_KO
  if (depasse) echec = true

  console.log(
    `${(depasse ? 'DEPASSEMENT' : 'ok').padEnd(13)} ${page.padEnd(24)} ${String(ko(transfere)).padStart(7)} Ko ${String(ko(brut)).padStart(7)} Ko   ${sources.length}`,
  )

  for (const { src, texte } of contenus) {
    for (const moteur of MOTEURS_DE_PARSING) {
      const trouvee = moteur.empreintes.find((empreinte) => texte.includes(empreinte))
      if (trouvee !== undefined) {
        console.error(
          `  INTERDIT : « ${moteur.nom} » est present dans ${src}, charge des le premier rendu de ${page}.\n` +
            `             Empreinte reperee : « ${trouvee} ».\n` +
            `             Les moteurs de parsing se chargent en import dynamique (brief §3, §13).`,
        )
        echec = true
      }
    }
  }
}

console.log('')
if (echec) {
  console.error('Budget de performance non tenu.')
  process.exit(1)
}
console.log('Budget tenu.')
