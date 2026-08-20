/**
 * Extracteurs de valeurs (brief §5.3, etape 3).
 *
 * Un bail ecrit « vingt-quatre (24) mois », une police ecrit « 12 mois ».
 * Sans normalisation, le rapprochement ne peut pas produire d'ecart chiffre —
 * or c'est l'ecart chiffre qui hierarchise les preconisations et fait reagir un
 * directeur immobilier (§7). « 12 mois de loyer non finances » porte ; « gravite
 * 3 » ne porte pas.
 *
 * Deux regles :
 *   - toute valeur conserve ses offsets absolus, comme les segments ;
 *   - dans le doute, on n'extrait pas. Une valeur inventee produirait un ecart
 *     chiffre faux, ce qui est pire qu'une absence de chiffre (§5.3).
 */

export type Unite = 'jour' | 'semaine' | 'mois' | 'annee'

export type ValeurExtraite =
  | {
      readonly nature: 'duree'
      readonly valeur: number
      readonly unite: Unite
      readonly texte: string
      readonly debut: number
      readonly fin: number
    }
  | {
      readonly nature: 'montant_eur' | 'pourcentage'
      readonly valeur: number
      readonly texte: string
      readonly debut: number
      readonly fin: number
    }
  | {
      readonly nature: 'date'
      readonly iso: string
      readonly texte: string
      readonly debut: number
      readonly fin: number
    }

// ---------------------------------------------------------------------------
// Nombres ecrits en toutes lettres
// ---------------------------------------------------------------------------

const UNITES: Record<string, number> = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6,
  sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13,
  quatorze: 14, quinze: 15, seize: 16,
}

const DIZAINES: Record<string, number> = {
  vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
}

const sansAccents = (mot: string): string =>
  mot.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * Convertit un nombre francais en toutes lettres, de zero a neuf cent
 * quatre-vingt-dix-neuf mille. Couvre les formes rencontrees dans les baux :
 * « vingt-quatre », « soixante-quinze », « quatre-vingt-dix », « cent vingt ».
 */
export function nombreEnLettres(expression: string): number | null {
  const mots = sansAccents(expression)
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter((mot) => mot.length > 0 && mot !== 'et')

  if (mots.length === 0) return null

  let total = 0
  let courant = 0
  let vu = false

  for (const mot of mots) {
    if (mot === 'mille' || mot === 'milles') {
      total += (courant === 0 ? 1 : courant) * 1000
      courant = 0
      vu = true
      continue
    }
    if (mot === 'cent' || mot === 'cents') {
      courant = (courant === 0 ? 1 : courant) * 100
      vu = true
      continue
    }
    const unite = UNITES[mot]
    if (unite !== undefined) {
      courant += unite
      vu = true
      continue
    }
    const dizaine = DIZAINES[mot]
    if (dizaine !== undefined) {
      courant += dizaine
      vu = true
      continue
    }
    if (mot === 'vingts') {
      courant += 20
      vu = true
      continue
    }
    return null
  }

  return vu ? total + courant : null
}

/** Motif couvrant un nombre en toutes lettres, borne pour rester lineaire. */
const MOT_NOMBRE = String.raw`(?:zéro|z[ée]ro|une?|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingts?|trente|quarante|cinquante|soixante|cents?|milles?|et)`
const NOMBRE_LETTRES = String.raw`${MOT_NOMBRE}(?:[ -]${MOT_NOMBRE}){0,6}`

// ---------------------------------------------------------------------------
// Nombres en chiffres
// ---------------------------------------------------------------------------

/** Espace fine, insecable, ou point : separateurs de milliers rencontres. */
const SEP_MILLIERS = String.raw`[ \u00A0\u202F\u2009.]`
const NOMBRE_CHIFFRES = String.raw`\d{1,3}(?:${SEP_MILLIERS}\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?`

const versNombre = (brut: string): number | null => {
  const nettoye = brut.replace(/[ \u00A0\u202F\u2009.]/g, (correspondance, index: number) => {
    // Un point suivi d'exactement trois chiffres est un separateur de milliers ;
    // sinon c'est une decimale.
    if (correspondance === '.') {
      return /^\.\d{3}(?!\d)/.test(brut.slice(index)) ? '' : '.'
    }
    return ''
  })
  const valeur = Number(nettoye.replace(',', '.'))
  return Number.isFinite(valeur) ? valeur : null
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

const UNITES_DUREE: Record<string, Unite> = {
  jour: 'jour', jours: 'jour',
  semaine: 'semaine', semaines: 'semaine',
  mois: 'mois',
  an: 'annee', ans: 'annee', annee: 'annee', annees: 'annee',
}

const MOTIF_DUREE = new RegExp(
  String.raw`\b(?:(${NOMBRE_LETTRES})\s*(?:\(\s*(\d{1,4})\s*\))?|(${NOMBRE_CHIFFRES}))\s*(jours?|semaines?|mois|ans?|ann[ée]es?)\b`,
  'gi',
)

const MOTIF_MONTANT = new RegExp(
  String.raw`\b(${NOMBRE_CHIFFRES})\s*(M€|M\s?EUR|millions?\s+d[’']?euros?|milliards?\s+d[’']?euros?|k€|milliers?\s+d[’']?euros?|€|EUR\b|euros?\b)`,
  'gi',
)

const MOTIF_POURCENTAGE = new RegExp(
  String.raw`\b(?:(${NOMBRE_CHIFFRES})|(${NOMBRE_LETTRES}))\s*(?:%|pour\s?cent\b)`,
  'gi',
)

const MOIS_FR: Record<string, number> = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
}

const MOTIF_DATE_LETTRES = new RegExp(
  String.raw`\b(\d{1,2})\s*(?:er|ème|eme)?\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})\b`,
  'gi',
)

const MOTIF_DATE_CHIFFRES = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/g

const multiplicateur = (suffixe: string): number => {
  const normalise = sansAccents(suffixe)
  if (normalise.startsWith('milliard')) return 1_000_000_000
  if (normalise.startsWith('m') && normalise.includes('€')) return 1_000_000
  if (normalise.startsWith('million')) return 1_000_000
  if (normalise.startsWith('k') || normalise.startsWith('millier')) return 1_000
  return 1
}

/**
 * Extrait toutes les valeurs normalisees d'un texte.
 *
 * `decalage` est l'offset absolu du texte dans le document d'origine : les
 * offsets renvoyes sont donc directement exploitables pour l'ancrage Word.
 */
export function extraireValeurs(texte: string, decalage = 0): ValeurExtraite[] {
  const valeurs: ValeurExtraite[] = []

  for (const m of texte.matchAll(MOTIF_DUREE)) {
    const [entier, lettres, chiffresEntreParentheses, chiffres, uniteBrute] = m
    const unite = UNITES_DUREE[sansAccents(uniteBrute ?? '')]
    if (unite === undefined) continue

    // « vingt-quatre (24) mois » : les deux formes doivent concorder, sinon le
    // document est ambigu et l'on n'extrait rien.
    let valeur: number | null = null
    if (chiffres !== undefined) {
      valeur = versNombre(chiffres)
    } else if (lettres !== undefined) {
      const enLettres = nombreEnLettres(lettres)
      if (chiffresEntreParentheses !== undefined) {
        const confirme = Number(chiffresEntreParentheses)
        valeur = enLettres === confirme ? confirme : null
      } else {
        valeur = enLettres
      }
    }

    if (valeur === null || valeur <= 0) continue
    valeurs.push({
      nature: 'duree',
      valeur,
      unite,
      texte: entier,
      debut: decalage + (m.index ?? 0),
      fin: decalage + (m.index ?? 0) + entier.length,
    })
  }

  for (const m of texte.matchAll(MOTIF_MONTANT)) {
    const [entier, nombre, suffixe] = m
    const base = versNombre(nombre ?? '')
    if (base === null) continue
    valeurs.push({
      nature: 'montant_eur',
      valeur: base * multiplicateur(suffixe ?? ''),
      texte: entier,
      debut: decalage + (m.index ?? 0),
      fin: decalage + (m.index ?? 0) + entier.length,
    })
  }

  for (const m of texte.matchAll(MOTIF_POURCENTAGE)) {
    const [entier, chiffres, lettres] = m
    const valeur = chiffres !== undefined ? versNombre(chiffres) : nombreEnLettres(lettres ?? '')
    if (valeur === null) continue
    valeurs.push({
      nature: 'pourcentage',
      valeur,
      texte: entier,
      debut: decalage + (m.index ?? 0),
      fin: decalage + (m.index ?? 0) + entier.length,
    })
  }

  const ajouterDate = (entier: string, jour: number, mois: number, annee: number, index: number) => {
    if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return
    const iso = `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`
    // Rejette le 31 fevrier et consorts : une date fausse fausserait une relance.
    const controle = new Date(`${iso}T00:00:00Z`)
    if (Number.isNaN(controle.getTime()) || controle.getUTCDate() !== jour) return
    valeurs.push({
      nature: 'date',
      iso,
      texte: entier,
      debut: decalage + index,
      fin: decalage + index + entier.length,
    })
  }

  for (const m of texte.matchAll(MOTIF_DATE_LETTRES)) {
    const mois = MOIS_FR[sansAccents(m[2] ?? '')]
    if (mois === undefined) continue
    ajouterDate(m[0], Number(m[1]), mois, Number(m[3]), m.index ?? 0)
  }

  for (const m of texte.matchAll(MOTIF_DATE_CHIFFRES)) {
    ajouterDate(m[0], Number(m[1]), Number(m[2]), Number(m[3]), m.index ?? 0)
  }

  return valeurs.sort((a, b) => a.debut - b.debut)
}

const JOURS_PAR_UNITE: Record<Unite, number> = { jour: 1, semaine: 7, mois: 30, annee: 365 }
const MOIS_PAR_UNITE: Record<Unite, number> = { jour: 1 / 30, semaine: 7 / 30, mois: 1, annee: 12 }

/** Duree exprimee en mois. Les mois calendaires ne sont pas convertis en jours. */
export const enMois = (valeur: number, unite: Unite): number => valeur * MOIS_PAR_UNITE[unite]

/** Duree exprimee en jours — pour les delais de procedure, jamais pour une PE. */
export const enJours = (valeur: number, unite: Unite): number => valeur * JOURS_PAR_UNITE[unite]

/** Formulation destinee au decideur : « 24 mois exigés · 12 mois soutenus ». */
export function formulerEcart(exige: string, demontre: string): string {
  return `${exige} exigés · ${demontre} soutenus`
}
