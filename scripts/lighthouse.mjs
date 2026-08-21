/**
 * Mesure Lighthouse du site marketing (brief §14).
 *
 *   npm run build && npm run start &
 *   node scripts/lighthouse.mjs [--base http://127.0.0.1:3000] [--seuil 90]
 *
 * Le critere d'acceptation porte sur la PERFORMANCE du site marketing. On
 * mesure aussi l'accessibilite et les bonnes pratiques : elles ne sont pas
 * chiffrees par le brief, mais un site de conformite qui echoue sur le
 * contraste ou sur les intitules de liens se disqualifie tout seul.
 *
 * Le poste de travail n'est pas mesure : ce n'est pas une page de contenu, et
 * son budget est deja tenu par scripts/budget-js.mjs.
 */
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'

const arg = (nom, defaut) => {
  const index = process.argv.indexOf(`--${nom}`)
  return index === -1 ? defaut : process.argv[index + 1]
}

const BASE = arg('base', 'http://127.0.0.1:3000')
const SEUIL = Number(arg('seuil', '90'))

/** Un echantillon representatif : accueil, contenu SEO, article, formulaire. */
const CHEMINS = ['/', '/controles/sinistre-majeur', '/blog/une-attestation-ne-prouve-pas-une-couverture', '/tarifs']

const chrome = await launch({
  chromePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
})

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const resultats = []

try {
  for (const chemin of CHEMINS) {
    const { lhr } = await lighthouse(
      BASE + chemin,
      { port: chrome.port, output: 'json', logLevel: 'error' },
      { extends: 'lighthouse:default', settings: { onlyCategories: CATEGORIES, formFactor: 'desktop',
        screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
        throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } },
    )
    resultats.push({
      chemin,
      scores: Object.fromEntries(
        CATEGORIES.map((c) => [c, Math.round((lhr.categories[c]?.score ?? 0) * 100)]),
      ),
      // Les diagnostics qui expliquent une note basse, quand il y en a.
      echecs: Object.values(lhr.audits)
        .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative')
        .map((a) => a.title),
    })
  }
} finally {
  await chrome.kill()
}

const entete = ['page', ...CATEGORIES]
console.log(entete.map((c, i) => (i === 0 ? c.padEnd(58) : c.padEnd(15))).join(''))

let auMoinsUnEchec = false
for (const resultat of resultats) {
  const cases = CATEGORIES.map((c) => {
    const note = resultat.scores[c]
    if (c === 'performance' && note < SEUIL) auMoinsUnEchec = true
    return `${note}`.padEnd(15)
  })
  console.log(resultat.chemin.padEnd(58) + cases.join(''))
}

for (const resultat of resultats) {
  if (resultat.echecs.length === 0) continue
  console.log(`\n${resultat.chemin} — audits en deçà de 90 :`)
  for (const titre of [...new Set(resultat.echecs)]) console.log(`  · ${titre}`)
}

if (auMoinsUnEchec) {
  console.error(`\nPerformance sous le seuil de ${SEUIL} (brief §14).`)
  process.exit(1)
}
console.log(`\nPerformance ≥ ${SEUIL} sur toutes les pages mesurées.`)
