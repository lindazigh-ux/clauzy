/**
 * Sauvegarde et rechargement d'un dossier (brief §4, lot L3).
 *
 * Sans ce fichier, le produit est inutilisable en usage reel : une analyse
 * prend une a deux heures, et rien ne doit dependre de la duree de vie d'un
 * onglet.
 *
 * Le fichier `.clauzy` est ecrit et relu ENTIEREMENT dans le navigateur. Il ne
 * transite jamais : il est telecharge sur le poste du praticien, comme un
 * export Word. La couche src/lib/net n'est pas importee ici, et le test
 * d'architecture le verifie.
 *
 * Chiffrement optionnel par mot de passe (§4). Il est facultatif a dessein :
 * un dossier range dans un espace de travail deja chiffre n'en a pas besoin,
 * et imposer un mot de passe qu'on oublie ferait perdre le dossier — ce qui
 * serait pire que le risque couvert.
 */
import type { Dossier } from './types'

/** Version du FORMAT de fichier, distincte de la version du dossier. */
export const VERSION_FORMAT = 1

export const EXTENSION = '.clauzy'

/**
 * PBKDF2 a 600 000 iterations : la recommandation OWASP pour SHA-256.
 * Une valeur plus basse rendrait une attaque hors ligne confortable ; une
 * valeur plus haute ferait attendre le praticien a chaque ouverture.
 */
const ITERATIONS = 600_000

type EnveloppeClaire = {
  readonly format: 'clauzy'
  readonly version: number
  readonly chiffre: false
  /** Empreinte du dossier serialise : detecte un fichier tronque ou retouche. */
  readonly empreinte: string
  readonly dossier: unknown
}

type EnveloppeChiffree = {
  readonly format: 'clauzy'
  readonly version: number
  readonly chiffre: true
  readonly kdf: {
    readonly algorithme: 'PBKDF2'
    readonly hachage: 'SHA-256'
    readonly iterations: number
    readonly sel: string
  }
  readonly chiffrement: { readonly algorithme: 'AES-GCM'; readonly vecteur: string }
  readonly charge: string
}

export type Enveloppe = EnveloppeClaire | EnveloppeChiffree

/** Une lecture qui echoue dit quoi faire (§8), jamais « une erreur est survenue ». */
export class ErreurFichierDossier extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ErreurFichierDossier'
  }
}

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

const sousCouche = (): SubtleCrypto => {
  const disponible = globalThis.crypto?.subtle
  if (disponible === undefined) {
    throw new ErreurFichierDossier(
      'Ce navigateur n’expose pas les fonctions de chiffrement. Enregistrez le dossier sans mot ' +
        'de passe, ou ouvrez-le dans un navigateur à jour.',
    )
  }
  return disponible
}

const enBase64 = (octets: Uint8Array): string => {
  let binaire = ''
  for (const octet of octets) binaire += String.fromCharCode(octet)
  return btoa(binaire)
}

const depuisBase64 = (texte: string): Uint8Array => {
  const binaire = atob(texte)
  const octets = new Uint8Array(binaire.length)
  for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i)
  return octets
}

const empreinte = async (texte: string): Promise<string> => {
  const condensat = await sousCouche().digest('SHA-256', new TextEncoder().encode(texte))
  return enBase64(new Uint8Array(condensat))
}

const deriverCle = async (motDePasse: string, sel: Uint8Array): Promise<CryptoKey> => {
  const subtle = sousCouche()
  const matiere = await subtle.importKey(
    'raw',
    new TextEncoder().encode(motDePasse),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: sel as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    matiere,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// ---------------------------------------------------------------------------
// Ecriture
// ---------------------------------------------------------------------------

/**
 * Serialise un dossier en enveloppe `.clauzy`.
 *
 * Sans mot de passe, le contenu reste lisible : c'est assume et documente,
 * pour qu'un dossier reste recuperable meme si Clauzy disparait. L'empreinte
 * ne protege pas de la falsification, elle detecte la corruption.
 */
export async function serialiser(dossier: Dossier, motDePasse?: string): Promise<string> {
  const contenu = JSON.stringify(dossier)

  if (motDePasse === undefined || motDePasse.length === 0) {
    const enveloppe: EnveloppeClaire = {
      format: 'clauzy',
      version: VERSION_FORMAT,
      chiffre: false,
      empreinte: await empreinte(contenu),
      dossier,
    }
    return JSON.stringify(enveloppe, null, 2)
  }

  const sel = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const vecteur = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const cle = await deriverCle(motDePasse, sel)

  const chiffre = await sousCouche().encrypt(
    { name: 'AES-GCM', iv: vecteur as BufferSource },
    cle,
    new TextEncoder().encode(contenu),
  )

  const enveloppe: EnveloppeChiffree = {
    format: 'clauzy',
    version: VERSION_FORMAT,
    chiffre: true,
    kdf: { algorithme: 'PBKDF2', hachage: 'SHA-256', iterations: ITERATIONS, sel: enBase64(sel) },
    chiffrement: { algorithme: 'AES-GCM', vecteur: enBase64(vecteur) },
    charge: enBase64(new Uint8Array(chiffre)),
  }
  return JSON.stringify(enveloppe, null, 2)
}

/** Un dossier chiffre se reconnait sans mot de passe : on peut le demander avant. */
export function estChiffre(contenu: string): boolean {
  try {
    const brut = JSON.parse(contenu) as { chiffre?: unknown }
    return brut.chiffre === true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

/**
 * Point de migration.
 *
 * Un dossier enregistre aujourd'hui doit rester ouvrable dans deux ans : c'est
 * la seule sauvegarde du travail du praticien. Chaque montee de version ajoute
 * une etape ici, jamais un refus de lire.
 */
const migrer = (dossier: Dossier, versionFichier: number): Dossier => {
  if (versionFichier > VERSION_FORMAT) {
    throw new ErreurFichierDossier(
      `Ce dossier a été enregistré avec une version plus récente de Clauzy (format ` +
        `${versionFichier}). Mettez l’application à jour pour l’ouvrir.`,
    )
  }
  return dossier
}

const enDossier = (valeur: unknown): Dossier => {
  const candidat = valeur as Partial<Dossier> | null
  if (
    candidat === null ||
    typeof candidat !== 'object' ||
    !Array.isArray(candidat.documents) ||
    typeof candidat.ajustements !== 'object'
  ) {
    throw new ErreurFichierDossier(
      'Ce fichier ne contient pas de dossier Clauzy exploitable. Vérifiez que vous avez bien ' +
        'sélectionné un fichier « .clauzy ».',
    )
  }
  return candidat as Dossier
}

export async function deserialiser(contenu: string, motDePasse?: string): Promise<Dossier> {
  let brut: Enveloppe
  try {
    brut = JSON.parse(contenu) as Enveloppe
  } catch {
    throw new ErreurFichierDossier(
      'Ce fichier est illisible. S’il a été envoyé par messagerie, il a pu être tronqué : ' +
        'demandez-en une copie.',
    )
  }

  if (brut?.format !== 'clauzy') {
    throw new ErreurFichierDossier(
      'Ce fichier n’est pas un dossier Clauzy. Sélectionnez un fichier « .clauzy ».',
    )
  }

  if (brut.chiffre) {
    if (motDePasse === undefined || motDePasse.length === 0) {
      throw new ErreurFichierDossier(
        'Ce dossier est protégé par un mot de passe. Saisissez-le pour l’ouvrir.',
      )
    }
    const cle = await deriverCle(motDePasse, depuisBase64(brut.kdf.sel))
    let clair: ArrayBuffer
    try {
      clair = await sousCouche().decrypt(
        { name: 'AES-GCM', iv: depuisBase64(brut.chiffrement.vecteur) as BufferSource },
        cle,
        depuisBase64(brut.charge) as BufferSource,
      )
    } catch {
      // AES-GCM ne distingue pas un mauvais mot de passe d'un fichier altere :
      // on le dit, plutot que d'affirmer l'un des deux.
      throw new ErreurFichierDossier(
        'Le dossier n’a pas pu être déchiffré. Le mot de passe est incorrect, ou le fichier a ' +
          'été altéré depuis son enregistrement.',
      )
    }
    return migrer(enDossier(JSON.parse(new TextDecoder().decode(clair))), brut.version)
  }

  const serialise = JSON.stringify(brut.dossier)
  if ((await empreinte(serialise)) !== brut.empreinte) {
    throw new ErreurFichierDossier(
      'Ce dossier a été modifié ou tronqué depuis son enregistrement. Ouvrez une copie saine, ' +
        'ou repartez de la dernière version que vous avez livrée.',
    )
  }

  return migrer(enDossier(brut.dossier), brut.version)
}

/**
 * Nom de fichier propose.
 *
 * La reference est une metadonnee saisie a la main : elle vit sur le poste du
 * praticien et n'a jamais transite (§2).
 */
export function nomFichier(dossier: Dossier, maintenant = new Date()): string {
  const reference = dossier.reference.trim().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '')
  const jour = maintenant.toISOString().slice(0, 10)
  return `${reference.length === 0 ? 'dossier' : reference}-${jour}${EXTENSION}`
}
