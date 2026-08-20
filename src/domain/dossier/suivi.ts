/**
 * Suivi d'attestation (brief §7, lot L5).
 *
 * Obtenir une attestation conforme n'est pas un evenement, c'est une relance.
 * Le bail donne souvent huit jours au preneur pour produire la sienne, sous
 * peine de resiliation de plein droit (FOR-01) — le calendrier n'est donc pas
 * un confort, c'est la preuve que la diligence a ete faite.
 *
 * Cinq jalons, tous comptes depuis la DATE D'ENVOI de la demande. Cette date
 * vient du courriel importe quand elle est lisible, et se saisit a la main
 * sinon : le moteur ne devine jamais une date, une relance calculee sur une
 * date fausse etant pire qu'une relance non calculee.
 */

export type IdJalon =
  | 'DEMANDE'
  | 'RELANCE_SIMPLE'
  | 'RELANCE_FORMELLE'
  | 'ESCALADE'
  | 'CLOTURE'

export type Jalon = {
  readonly id: IdJalon
  readonly libelle: string
  /** Jours ecoules depuis l'envoi de la demande. */
  readonly jours: number
  /** Ce qu'il y a a faire ce jour-la. */
  readonly action: string
  /** Ce qui doit rejoindre le dossier une fois le jalon franchi. */
  readonly preuve: string
}

/**
 * Le calendrier de relance.
 *
 * Les huit jours de la premiere relance ne sont pas arbitraires : c'est le
 * delai que les baux stipulent le plus souvent, et celui que le controle FOR-01
 * surveille. Les suivants suivent la pratique : une relance ecrite a quinze
 * jours, une escalade a trente, une cloture a quarante-cinq.
 */
export const JALONS: readonly Jalon[] = [
  {
    id: 'DEMANDE',
    libelle: 'Demande envoyée',
    jours: 0,
    action: 'Demander l’attestation à la compagnie ou au courtier, en citant les garanties exigées par le bail.',
    preuve: 'Copie de la demande, avec la liste des garanties demandées.',
  },
  {
    id: 'RELANCE_SIMPLE',
    libelle: 'Première relance',
    jours: 8,
    action: 'Relancer par courriel, en rappelant le délai que le bail impose.',
    preuve: 'Courriel de relance daté.',
  },
  {
    id: 'RELANCE_FORMELLE',
    libelle: 'Relance formelle',
    jours: 15,
    action: 'Relancer par écrit, en citant la clause et la sanction qu’elle prévoit.',
    preuve: 'Lettre de relance et accusé de réception.',
  },
  {
    id: 'ESCALADE',
    libelle: 'Escalade',
    jours: 30,
    action: 'Saisir la direction du courtier ou le souscripteur de la compagnie.',
    preuve: 'Trace de la saisine et de son destinataire.',
  },
  {
    id: 'CLOTURE',
    libelle: 'Clôture du point',
    jours: 45,
    action: 'Verser l’attestation au dossier, ou porter l’absence de réponse au rapport.',
    preuve: 'Attestation conforme, ou mention motivée de son absence.',
  },
]

export type Suivi = {
  /** Date d'envoi de la demande, ISO 8601. Null tant qu'elle n'est pas connue. */
  readonly envoyeLe: string | null
  readonly destinataire: string
  /** Jalons deja franchis. */
  readonly faits: readonly IdJalon[]
  /** Date de reception d'une attestation conforme. Clot le suivi. */
  readonly recuLe: string | null
}

export const SUIVI_VIDE: Suivi = {
  envoyeLe: null,
  destinataire: '',
  faits: [],
  recuLe: null,
}

/** Ajoute des jours a une date, en UTC : le changement d'heure ne decale rien. */
export const decaler = (iso: string, jours: number): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const decalee = new Date(date.getTime())
  decalee.setUTCDate(decalee.getUTCDate() + jours)
  return decalee.toISOString()
}

export type EtatJalon = 'FAIT' | 'A_FAIRE' | 'EN_RETARD' | 'A_VENIR'

export type JalonDate = {
  readonly jalon: Jalon
  readonly echeance: string
  readonly etat: EtatJalon
}

/**
 * Deroule le calendrier a partir de la date d'envoi.
 *
 * Sans date d'envoi, il n'y a pas de calendrier — et l'on ne l'invente pas : la
 * liste revient vide, et l'interface demande la date plutot que d'afficher des
 * echeances fausses.
 */
export function calendrier(suivi: Suivi, aujourdhui = new Date()): JalonDate[] {
  if (suivi.envoyeLe === null) return []

  return JALONS.map((jalon) => {
    const echeance = decaler(suivi.envoyeLe as string, jalon.jours)
    // Renseigner la date d'envoi EST l'affirmation que la demande est partie :
    // ce jalon n'a pas a etre coche une seconde fois, et le presenter « en
    // retard » serait absurde.
    const fait = jalon.id === 'DEMANDE' || suivi.faits.includes(jalon.id)

    if (fait) return { jalon, echeance, etat: 'FAIT' as const }
    // Une attestation recue clot tout ce qui restait.
    if (suivi.recuLe !== null) return { jalon, echeance, etat: 'FAIT' as const }

    const echue = new Date(echeance).getTime() <= aujourdhui.getTime()
    const enRetard = new Date(decaler(echeance, 1)).getTime() <= aujourdhui.getTime()

    return { jalon, echeance, etat: enRetard ? 'EN_RETARD' : echue ? 'A_FAIRE' : 'A_VENIR' }
  })
}

/** Le prochain jalon a traiter — c'est lui que le rapport date (§7). */
export function prochaineAction(suivi: Suivi, aujourdhui = new Date()): JalonDate | null {
  return calendrier(suivi, aujourdhui).find((entree) => entree.etat !== 'FAIT') ?? null
}

/** Ce qui reste a faire, pour le calendrier a exporter. */
export function jalonsRestants(suivi: Suivi, aujourdhui = new Date()): JalonDate[] {
  return calendrier(suivi, aujourdhui).filter((entree) => entree.etat !== 'FAIT')
}

/** Formulation destinee au rapport : « Relance formelle, le 4 septembre 2026 ». */
export function formulerProchaineAction(suivi: Suivi, aujourdhui = new Date()): string {
  if (suivi.recuLe !== null) {
    return `Attestation reçue le ${enFrancais(suivi.recuLe)}. Le point est clos.`
  }
  if (suivi.envoyeLe === null) {
    return 'Aucune date d’envoi renseignée : le calendrier de relance ne peut pas être calculé.'
  }
  const prochaine = prochaineAction(suivi, aujourdhui)
  if (prochaine === null) return 'Tous les jalons ont été franchis.'

  const retard = prochaine.etat === 'EN_RETARD' ? ' — en retard' : ''
  return `${prochaine.jalon.libelle}, le ${enFrancais(prochaine.echeance)}${retard}.`
}

export const enFrancais = (iso: string): string =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
