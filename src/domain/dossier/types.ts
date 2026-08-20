/**
 * Le dossier — etat de session du praticien (brief §4, §6).
 *
 * Il ne quitte JAMAIS le navigateur. Il n'existe aucune fonction pour
 * l'envoyer : la couche src/lib/net refuserait de toute facon la moitie de ses
 * champs, a commencer par `documents` et `texte` (§2).
 *
 * Decision structurante : les AJUSTEMENTS du praticien sont ranges a part de la
 * sortie du moteur, et non fusionnes dedans. Une analyse prend une a deux
 * heures ; importer une piece supplementaire et relancer le moteur ne doit
 * jamais effacer ce travail. Le moteur ecrit dans `analyse`, le praticien dans
 * `ajustements`, et `resultatsAffiches()` compose les deux a l'affichage.
 */
import type { Gravite, Statut } from '../controles'
import type { Analyse } from '../moteur/moteur'
import type { DocumentImporte } from '@/lib/import'
import type { Suivi } from './suivi'

export type FicheClient = {
  readonly raisonSociale: string
  readonly adresse: string
  readonly activite: string
}

/**
 * Identite de l'organisation qui livre l'analyse (brief §7).
 *
 * Le rapport sort aux couleurs du cabinet, PAS a celles de Clauzy : le client
 * achete une analyse, pas un abonnement. La marque Clauzy reste discrete, en
 * pied de page.
 */
export type Cabinet = {
  readonly nom: string
  /** Couleur de la page de garde, en hexadecimal sans diese. */
  readonly couleur: string
  readonly praticien: string
  /** Qualite du signataire : « courtier », « avocat », « directrice juridique »… */
  readonly qualite: string
}

/** De quel cote du croisement vient un passage rattache a la main. */
export type CoteRattachement = 'OBLIGATION' | 'COUVERTURE'

/**
 * Un passage que le praticien relie lui-meme a un controle (brief §6).
 *
 * C'est le geste qui regle l'essentiel du probleme des baux atypiques sans
 * toucher au moteur : la ou un motif ne reconnait pas une redaction, la
 * praticienne selectionne le passage et le rattache.
 */
export type Rattachement = {
  readonly documentId: string
  /** Offsets absolus, comme partout : ils portent l'ancrage Word (§7). */
  readonly debut: number
  readonly fin: number
  readonly texte: string
  readonly cote: CoteRattachement
}

/**
 * Tout ce que le praticien a modifie sur un controle.
 *
 * Chaque champ absent signifie « le moteur fait foi ». Un ajustement est donc
 * toujours un delta lisible, jamais une copie de la ligne entiere : le rapport
 * peut signaler precisement ce qui a ete repris a la main (§6).
 */
export type Ajustement = {
  readonly controleId: string
  readonly auteur: string
  readonly horodatage: string
  readonly statutForce: Statut | null
  readonly graviteForcee: Gravite | null
  readonly analyseReecrite: string | null
  readonly redactionReecrite: string | null
  /** Faux positif ecarte. Exige un motif (§6). */
  readonly ecarte: boolean
  /** Obligatoire des qu'un statut est force ou qu'un controle est ecarte. */
  readonly motif: string
  readonly rattachements: readonly Rattachement[]
}

/** Observation hors des 40 controles (brief §6). */
export type Observation = {
  readonly id: string
  readonly titre: string
  readonly texte: string
  readonly gravite: Gravite
  readonly creeLe: string
}

/**
 * Perimetre et limites (brief §6, §7).
 *
 * C'est la page qui distingue un livrable d'une sortie machine, et celle qui
 * protege. Elle se remplit a la main : le moteur ne sait pas ce qu'on ne lui a
 * pas donne.
 */
export type Perimetre = {
  readonly piecesRecues: readonly string[]
  readonly piecesManquantes: readonly string[]
  /** Identifiants de controles declares sans objet pour ce dossier. */
  readonly controlesSansObjet: readonly string[]
  readonly hypotheses: readonly string[]
}

export type Dossier = {
  readonly version: 1
  readonly reference: string
  readonly cabinet: Cabinet
  readonly client: FicheClient
  readonly documents: readonly DocumentImporte[]
  /** Derniere sortie du moteur. Null tant qu'aucune analyse n'a tourne. */
  readonly analyse: Analyse | null
  /** Ajustements du praticien, indexes par identifiant de controle. */
  readonly ajustements: Readonly<Record<string, Ajustement>>
  readonly observations: readonly Observation[]
  readonly perimetre: Perimetre
  /** Calendrier de relance de l'attestation (§7, lot L5). */
  readonly suivi: Suivi
  readonly majLe: string
}

export const PERIMETRE_VIDE: Perimetre = {
  piecesRecues: [],
  piecesManquantes: [],
  controlesSansObjet: [],
  hypotheses: [],
}

export const CLIENT_VIDE: FicheClient = { raisonSociale: '', adresse: '', activite: '' }

/**
 * Le vert de Clauzy sert de defaut, et rien de plus : un cabinet met sa propre
 * couleur, et le rapport sort a la sienne (§7).
 */
export const CABINET_VIDE: Cabinet = {
  nom: '',
  couleur: '0E6B4A',
  praticien: '',
  qualite: '',
}

/** Mention imposee au rapport (brief §7, §13). Jamais reformulee a la legere. */
export const MENTION_LIMITE =
  'Outil d’aide au conseil. Ce document ne constitue ni un avis juridique, ni une garantie de ' +
  'couverture. Il ne dispense pas de l’examen des conditions générales et particulières des ' +
  'polices, ni de la consultation d’un conseil.'

/** Une modification manuelle sans motif n'est pas opposable. */
export class MotifRequis extends Error {
  constructor(controleId: string, geste: string) {
    super(
      `${geste} sur « ${controleId} » exige un motif. ` +
        `Le rapport doit pouvoir dire pourquoi l’analyse a été reprise à la main (brief §6).`,
    )
    this.name = 'MotifRequis'
  }
}
