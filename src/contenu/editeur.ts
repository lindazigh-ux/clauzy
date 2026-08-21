/**
 * Identite de l'editeur, pour les pages legales (brief §10).
 *
 * Ces valeurs ne s'inventent pas : un numero de SIREN, un capital social ou un
 * hebergeur faux sur une page de mentions legales est une infraction, pas une
 * approximation. Elles sont donc rassemblees ici, marquees comme A COMPLETER,
 * et un test refuse le passage en production tant qu'il en reste une.
 *
 * Les remplacer, c'est editer ce seul fichier : les quatre pages legales, le
 * DPA et le pied de page les lisent toutes ici.
 */

/** Marqueur d'une valeur qui doit etre renseignee avant mise en ligne. */
export const A_COMPLETER = '[À COMPLÉTER]'

export type Editeur = {
  readonly denomination: string
  readonly formeSociale: string
  readonly capital: string
  readonly siege: string
  readonly rcs: string
  readonly siren: string
  readonly tvaIntracommunautaire: string
  readonly directeurPublication: string
  readonly courriel: string
  readonly courrielDpo: string
  readonly telephone: string
  readonly hebergeur: string
  readonly hebergeurAdresse: string
  /** Assureur de la responsabilite civile professionnelle. */
  readonly rcPro: string
}

export const EDITEUR: Editeur = {
  denomination: 'Clauzy',
  formeSociale: A_COMPLETER,
  capital: A_COMPLETER,
  siege: A_COMPLETER,
  rcs: A_COMPLETER,
  siren: A_COMPLETER,
  tvaIntracommunautaire: A_COMPLETER,
  directeurPublication: A_COMPLETER,
  courriel: 'contact@clauzy.fr',
  courrielDpo: 'donnees@clauzy.fr',
  telephone: A_COMPLETER,
  hebergeur: A_COMPLETER,
  hebergeurAdresse: A_COMPLETER,
  rcPro: A_COMPLETER,
}

/** Reste-t-il des valeurs a renseigner ? Le test de mise en ligne s'en sert. */
export const champsACompleter = (editeur: Editeur = EDITEUR): string[] =>
  Object.entries(editeur)
    .filter(([, valeur]) => valeur === A_COMPLETER)
    .map(([champ]) => champ)

/**
 * Date de derniere mise a jour des textes legaux. Elle se change a la main :
 * une date automatique changerait a chaque deploiement, ce qui priverait le
 * lecteur de l'information qu'elle porte.
 */
export const MAJ_LEGALE = '2026-08-21'

export const MAJ_LEGALE_FR = new Date(MAJ_LEGALE).toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
