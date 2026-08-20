/**
 * Lecteur ZIP minimal, reserve aux TESTS.
 *
 * Il sert a ouvrir le .docx produit et a verifier l'ancrage des commentaires
 * dans l'OOXML reel (brief §14). Verifier le plan d'annotation ne suffit pas :
 * c'est le fichier remis au client qui doit etre juste, pas la structure
 * intermediaire.
 *
 * Volontairement minimal — il lit le repertoire central, pas les cas exotiques
 * (Zip64, chiffrement). Aucune dependance : ajouter une bibliotheque pour lire
 * ses propres tests serait mal placer sa confiance.
 */
import { inflateRawSync } from 'node:zlib'

const SIGNATURE_FIN = 0x06054b50
const SIGNATURE_ENTREE = 0x02014b50

export function lireZip(donnees: Buffer): Map<string, Buffer> {
  let finRepertoire = -1
  for (let position = donnees.length - 22; position >= 0; position -= 1) {
    if (donnees.readUInt32LE(position) === SIGNATURE_FIN) {
      finRepertoire = position
      break
    }
  }
  if (finRepertoire === -1) throw new Error('Archive illisible : fin de répertoire introuvable.')

  const nombre = donnees.readUInt16LE(finRepertoire + 10)
  let curseur = donnees.readUInt32LE(finRepertoire + 16)
  const entrees = new Map<string, Buffer>()

  for (let index = 0; index < nombre; index += 1) {
    if (donnees.readUInt32LE(curseur) !== SIGNATURE_ENTREE) break

    const methode = donnees.readUInt16LE(curseur + 10)
    const tailleCompressee = donnees.readUInt32LE(curseur + 20)
    const longueurNom = donnees.readUInt16LE(curseur + 28)
    const longueurExtra = donnees.readUInt16LE(curseur + 30)
    const longueurCommentaire = donnees.readUInt16LE(curseur + 32)
    const offsetLocal = donnees.readUInt32LE(curseur + 42)
    const nom = donnees.toString('utf8', curseur + 46, curseur + 46 + longueurNom)

    const longueurNomLocal = donnees.readUInt16LE(offsetLocal + 26)
    const longueurExtraLocal = donnees.readUInt16LE(offsetLocal + 28)
    const debutDonnees = offsetLocal + 30 + longueurNomLocal + longueurExtraLocal
    const brut = donnees.subarray(debutDonnees, debutDonnees + tailleCompressee)

    entrees.set(nom, methode === 0 ? Buffer.from(brut) : inflateRawSync(brut))
    curseur += 46 + longueurNom + longueurExtra + longueurCommentaire
  }

  return entrees
}
