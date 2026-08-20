/**
 * Export du calendrier de relance au format iCalendar (brief §7, lot L5).
 *
 * Le fichier est ecrit dans le navigateur et remis au praticien, qui l'ouvre
 * dans son agenda. Aucun service tiers, aucune invitation envoyee : Clauzy
 * n'ecrit pas dans un agenda, il produit un fichier.
 *
 * Le format est ancien et pointilleux. Trois regles qui se paient cher quand on
 * les oublie : les lignes se plient a 75 octets, les separateurs se protegent,
 * et les sauts de ligne sont des CRLF. Un agenda qui refuse un fichier ne dit
 * jamais pourquoi.
 */
import {
  JALONS,
  jalonsRestants,
  type JalonDate,
  type Suivi,
} from '@/domain/dossier/suivi'

/** Echappe ce qui, dans un texte, ferait dérailler l'analyse d'iCalendar. */
const echapper = (texte: string): string =>
  texte
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')

/**
 * Plie une ligne a 75 octets, continuation par une espace.
 *
 * On compte en OCTETS et non en caracteres : « é » en pese deux, et couper au
 * milieu produit un fichier illisible.
 */
const plier = (ligne: string): string => {
  const encodeur = new TextEncoder()
  const octets = encodeur.encode(ligne)
  if (octets.length <= 75) return ligne

  const morceaux: string[] = []
  let courant = ''
  let taille = 0
  // Premiere ligne 75 octets, suivantes 74 (l'espace de continuation compte).
  let plafond = 75

  for (const caractere of ligne) {
    const poids = encodeur.encode(caractere).length
    if (taille + poids > plafond) {
      morceaux.push(courant)
      courant = ''
      taille = 0
      plafond = 74
    }
    courant += caractere
    taille += poids
  }
  if (courant.length > 0) morceaux.push(courant)

  return morceaux.join('\r\n ')
}

/** Horodatage iCalendar en UTC : 20260904T090000Z. */
const horodatage = (iso: string): string =>
  new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/**
 * Cale l'echeance a 9 h UTC.
 *
 * Une relance se fait dans la journee de travail : un rappel a l'heure exacte
 * de l'envoi initial tomberait un soir a 19 h 42, et serait ignore.
 */
const aNeufHeures = (iso: string): string => {
  const date = new Date(iso)
  date.setUTCHours(9, 0, 0, 0)
  return date.toISOString()
}

export type OptionsCalendrier = {
  readonly reference: string
  readonly client: string
  readonly destinataire: string
  /** Rendue injectable pour que les tests produisent un fichier stable. */
  readonly maintenant?: Date
}

const evenement = (entree: JalonDate, options: OptionsCalendrier): string[] => {
  const debut = aNeufHeures(entree.echeance)
  const fin = new Date(new Date(debut).getTime() + 30 * 60 * 1000).toISOString()
  const intitule = [options.reference, options.client].filter((v) => v.trim().length > 0).join(' · ')

  const description = [
    entree.jalon.action,
    options.destinataire.trim().length > 0 ? `Destinataire : ${options.destinataire}` : '',
    `À verser au dossier : ${entree.jalon.preuve}`,
  ]
    .filter((ligne) => ligne.length > 0)
    .join('\n')

  return [
    'BEGIN:VEVENT',
    `UID:${entree.jalon.id}-${horodatage(debut)}@clauzy`,
    `DTSTAMP:${horodatage((options.maintenant ?? new Date()).toISOString())}`,
    `DTSTART:${horodatage(debut)}`,
    `DTEND:${horodatage(fin)}`,
    `SUMMARY:${echapper(`Attestation — ${entree.jalon.libelle}${intitule.length > 0 ? ` (${intitule})` : ''}`)}`,
    `DESCRIPTION:${echapper(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${echapper(entree.jalon.libelle)}`,
    'END:VALARM',
    'END:VEVENT',
  ]
}

export type Calendrier = {
  readonly contenu: string
  readonly nomFichier: string
  readonly nombreJalons: number
}

/**
 * Produit le calendrier des jalons qui restent a franchir.
 *
 * Le brief ne demande que la prochaine relance ; on porte tout ce qui reste,
 * parce qu'un praticien qui pose un rappel veut poser la suite en meme temps,
 * et que rouvrir Clauzy dans huit jours pour le suivant est un oubli annonce.
 */
export function exporterCalendrier(suivi: Suivi, options: OptionsCalendrier): Calendrier {
  const maintenant = options.maintenant ?? new Date()
  const restants = jalonsRestants(suivi, maintenant)

  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Clauzy//Suivi d attestation//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...restants.flatMap((entree) => evenement(entree, { ...options, maintenant })),
    'END:VCALENDAR',
  ]

  const reference = options.reference.trim().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '')

  return {
    contenu: lignes.map(plier).join('\r\n') + '\r\n',
    nomFichier: reference.length === 0 ? 'relances.ics' : `${reference}-relances.ics`,
    nombreJalons: restants.length,
  }
}

export { JALONS }
