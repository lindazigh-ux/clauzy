/**
 * Reception cote serveur — le meme catalogue, dans l'autre sens (brief §2).
 *
 * La garde de `garde.ts` s'execute dans le navigateur : elle protege
 * l'utilisateur d'un bogue de notre part. Elle ne protege pas le serveur d'un
 * client qui l'ignorerait — n'importe qui peut poster ce qu'il veut sur
 * /api/contact/demo.
 *
 * Ce module rejoue donc la meme allowlist a l'arrivee, depuis la meme source.
 * Consequence voulue : un champ non declare au catalogue est refuse des deux
 * cotes, et un extrait de bail poste a la main sur une route publique n'est
 * jamais accepte, encore moins journalise.
 */
import { CATALOGUE_ENDPOINTS, LONGUEUR_MAX_ABSOLUE, type NomEndpoint } from './catalogue'
import type { ChargeSortante, SpecChamp, ValeurSortante } from './types'

export class ChargeRefusee extends Error {
  constructor(
    readonly champ: string,
    raison: string,
  ) {
    super(`Champ « ${champ} » refusé : ${raison}`)
    this.name = 'ChargeRefusee'
  }
}

const verifierValeur = (champ: string, spec: SpecChamp, valeur: unknown): ValeurSortante => {
  if (spec.type === 'nombre') {
    if (typeof valeur !== 'number' || !Number.isFinite(valeur)) {
      throw new ChargeRefusee(champ, 'un nombre fini est attendu.')
    }
  } else if (spec.type === 'booleen') {
    if (typeof valeur !== 'boolean') throw new ChargeRefusee(champ, 'un booléen est attendu.')
  } else {
    if (typeof valeur !== 'string') throw new ChargeRefusee(champ, 'une chaîne est attendue.')
    const plafond = Math.min(spec.longueurMax ?? LONGUEUR_MAX_ABSOLUE, LONGUEUR_MAX_ABSOLUE)
    if (valeur.length > plafond) {
      throw new ChargeRefusee(champ, `au-delà de ${plafond} caractères, ce n’est plus une métadonnée.`)
    }
    // Un saut de ligne signale un contenu documentaire, jamais une metadonnee.
    if (/[\r\n\t]/.test(valeur)) {
      throw new ChargeRefusee(champ, 'un retour à la ligne signale un contenu, pas une métadonnée.')
    }
  }

  if (spec.valeurs !== undefined && !spec.valeurs.includes(valeur as ValeurSortante)) {
    throw new ChargeRefusee(champ, 'valeur hors de l’énumération autorisée.')
  }

  return valeur as ValeurSortante
}

/**
 * Valide un corps recu contre le catalogue et rend une charge propre.
 *
 * Elle rend UNIQUEMENT les champs declares : ce qui n'est pas au catalogue est
 * jete avant d'avoir pu etre lu, pas seulement refuse.
 */
export function recevoirCharge(nom: NomEndpoint, corps: unknown): ChargeSortante {
  const definition = CATALOGUE_ENDPOINTS[nom]
  if (corps === null || typeof corps !== 'object' || Array.isArray(corps)) {
    throw new ChargeRefusee('(corps)', 'un objet est attendu.')
  }

  const recu = corps as Record<string, unknown>
  const inconnus = Object.keys(recu).filter((cle) => !(cle in definition.champs))
  if (inconnus.length > 0) {
    throw new ChargeRefusee(inconnus[0] as string, 'champ non déclaré au catalogue (§2).')
  }

  const propre: Record<string, ValeurSortante> = {}
  for (const [champ, spec] of Object.entries(definition.champs) as [string, SpecChamp][]) {
    const valeur = recu[champ]
    if (valeur === undefined || valeur === null || valeur === '') {
      if (spec.obligatoire === true) throw new ChargeRefusee(champ, 'champ obligatoire absent.')
      continue
    }
    propre[champ] = verifierValeur(champ, spec, valeur)
  }

  return propre
}

/** Forme minimale d'une adresse. Un serveur de courrier tranchera le reste. */
export const adresseVraisemblable = (valeur: string): boolean =>
  /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(valeur)
