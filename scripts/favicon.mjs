/**
 * Fabrique `src/app/favicon.ico` a partir de `src/app/icon.svg`.
 *
 *   node scripts/favicon.mjs
 *
 * Pourquoi les deux : Next sert `icon.svg` aux navigateurs modernes, et c'est
 * la meilleure image possible. Mais un agregateur, un lecteur de flux ou un
 * navigateur ancien demande encore `/favicon.ico` a la racine, et repart avec
 * un 404 — le §9 demande un favicon, pas un favicon moderne.
 *
 * Le .ico est un conteneur : on y range trois PNG (16, 32 et 48 px), ce que
 * tout systeme depuis Windows Vista sait lire. Aucun encodeur exotique n'est
 * necessaire — sharp, deja present via Next, rend les PNG, et l'entete ICO
 * tient en une trentaine d'octets.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const ICI = dirname(fileURLToPath(import.meta.url))
const RACINE = join(ICI, '..')
const SOURCE = join(RACINE, 'src', 'app', 'icon.svg')
const SORTIE = join(RACINE, 'src', 'app', 'favicon.ico')

const TAILLES = [16, 32, 48]

const svg = readFileSync(SOURCE)
const images = await Promise.all(
  TAILLES.map((taille) => sharp(svg).resize(taille, taille).png({ compressionLevel: 9 }).toBuffer()),
)

const entete = Buffer.alloc(6)
entete.writeUInt16LE(0, 0) // reserve
entete.writeUInt16LE(1, 2) // 1 = icone
entete.writeUInt16LE(images.length, 4)

let decalage = 6 + images.length * 16
const repertoire = images.map((png, index) => {
  const entree = Buffer.alloc(16)
  // 0 signifie 256 : nos tailles restent en deca, mais la regle vaut d'etre dite.
  entree.writeUInt8(TAILLES[index] === 256 ? 0 : TAILLES[index], 0)
  entree.writeUInt8(TAILLES[index] === 256 ? 0 : TAILLES[index], 1)
  entree.writeUInt8(0, 2) // palette : aucune
  entree.writeUInt8(0, 3) // reserve
  entree.writeUInt16LE(1, 4) // plans
  entree.writeUInt16LE(32, 6) // bits par pixel
  entree.writeUInt32LE(png.length, 8)
  entree.writeUInt32LE(decalage, 12)
  decalage += png.length
  return entree
})

writeFileSync(SORTIE, Buffer.concat([entete, ...repertoire, ...images]))
console.log(`favicon.ico écrit : ${SORTIE} (${TAILLES.join(', ')} px)`)
