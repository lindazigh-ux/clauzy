/**
 * Genere les fixtures binaires de la couche d'import.
 *
 *   node src/lib/import/__fixtures__/generer.mjs
 *
 * Les fichiers produits sont versionnes : un test qui lit un vrai PDF et un
 * vrai .docx prouve l'integration des moteurs, la ou un objet simule ne
 * prouverait que la forme de mes propres mocks.
 *
 * INTERDICTION ABSOLUE de partir d'un document client reel, meme anonymise
 * (brief §5.4, §13). Tout est fabrique ici, a partir de rien.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ICI = dirname(fileURLToPath(import.meta.url))

const LIGNES = [
  'ARTICLE 12 - ASSURANCES DU PRENEUR',
  'Le Preneur souscrira une police multirisque professionnelle.',
  'Toute franchise demeure a la charge du preneur.',
]

// --------------------------------------------------------------------------
// PDF minimal, sans compression : pdfjs le lit tel quel.
// --------------------------------------------------------------------------
const genererPdf = () => {
  let flux = 'BT\n/F1 12 Tf\n'
  let y = 760
  for (const ligne of LIGNES) {
    flux += `1 0 0 1 60 ${y} Tm\n(${ligne.replace(/([()\\])/g, '\\$1')}) Tj\n`
    y -= 18
  }
  flux += 'ET\n'

  const objets = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${flux.length} >>\nstream\n${flux}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = []
  objets.forEach((objet, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${objet}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(pdf, 'latin1')
}

// --------------------------------------------------------------------------
// ZIP « stored » (sans compression) : de quoi fabriquer un .docx valide.
// --------------------------------------------------------------------------
const TABLE_CRC = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

const crc32 = (buffer) => {
  let c = -1
  for (const octet of buffer) c = TABLE_CRC[(c ^ octet) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

const zip = (entrees) => {
  const morceaux = []
  const central = []
  let offset = 0

  for (const { nom, contenu } of entrees) {
    const nomBuf = Buffer.from(nom, 'utf8')
    const crc = crc32(contenu)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8) // stored
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(contenu.length, 18)
    local.writeUInt32LE(contenu.length, 22)
    local.writeUInt16LE(nomBuf.length, 26)
    morceaux.push(local, nomBuf, contenu)

    const entete = Buffer.alloc(46)
    entete.writeUInt32LE(0x02014b50, 0)
    entete.writeUInt16LE(20, 4)
    entete.writeUInt16LE(20, 6)
    entete.writeUInt16LE(0, 10)
    entete.writeUInt32LE(crc, 16)
    entete.writeUInt32LE(contenu.length, 20)
    entete.writeUInt32LE(contenu.length, 24)
    entete.writeUInt16LE(nomBuf.length, 28)
    entete.writeUInt32LE(offset, 42)
    central.push(entete, nomBuf)

    offset += local.length + nomBuf.length + contenu.length
  }

  const centralBuf = Buffer.concat(central)
  const fin = Buffer.alloc(22)
  fin.writeUInt32LE(0x06054b50, 0)
  fin.writeUInt16LE(entrees.length, 8)
  fin.writeUInt16LE(entrees.length, 10)
  fin.writeUInt32LE(centralBuf.length, 12)
  fin.writeUInt32LE(offset, 16)

  return Buffer.concat([...morceaux, centralBuf, fin])
}

const genererDocx = () => {
  const paragraphes = LIGNES.map(
    (ligne) => `<w:p><w:r><w:t xml:space="preserve">${ligne}</w:t></w:r></w:p>`,
  ).join('')

  const utf8 = (texte) => Buffer.from(texte, 'utf8')

  return zip([
    {
      nom: '[Content_Types].xml',
      contenu: utf8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
          '</Types>',
      ),
    },
    {
      nom: '_rels/.rels',
      contenu: utf8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
          '</Relationships>',
      ),
    },
    {
      nom: 'word/document.xml',
      contenu: utf8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
          `<w:body>${paragraphes}</w:body></w:document>`,
      ),
    },
  ])
}

writeFileSync(join(ICI, 'bail-minimal.pdf'), genererPdf())
writeFileSync(join(ICI, 'bail-minimal.docx'), genererDocx())
console.log('Fixtures régénérées : bail-minimal.pdf, bail-minimal.docx')
