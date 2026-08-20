/**
 * Couche reseau unique de Clauzy (brief §2).
 *
 * C'est le seul fichier de l'application autorise a appeler fetch().
 * Un test d'architecture (tests/architecture/aucun-fetch-hors-net.test.ts)
 * echoue si un appel reseau apparait ailleurs.
 *
 * Le bail, les conditions particulieres et generales, les avenants, les mails
 * importes, les extraits, les citations, les redactions proposees et les exports
 * ne passent jamais par ici : ils restent dans le navigateur, de bout en bout.
 */
import { CATALOGUE_ENDPOINTS, type NomEndpoint } from './catalogue'
import { ErreurEndpointInconnu, ErreurReponseApi } from './erreurs'
import { verifierChargeSortante } from './garde'
import type { ChargeSortante } from './types'

export { CATALOGUE_ENDPOINTS, LONGUEUR_MAX_ABSOLUE, type NomEndpoint } from './catalogue'
export { ErreurEndpointInconnu, ErreurFuiteDocumentaire, ErreurReponseApi } from './erreurs'
export { CLES_INTERDITES, verifierChargeSortante } from './garde'
export type { ChargeSortante, DefinitionEndpoint, SpecChamp, ValeurSortante } from './types'

export type OptionsAppel = {
  readonly signal?: AbortSignal
}

/**
 * Unique point de sortie reseau de l'application.
 *
 * La charge est verifiee avant tout contact avec le reseau : si le garde
 * refuse, aucun octet ne part.
 */
export async function appelApi<T = unknown>(
  nom: NomEndpoint,
  charge?: ChargeSortante,
  options: OptionsAppel = {},
): Promise<T> {
  const definition = CATALOGUE_ENDPOINTS[nom]
  if (definition === undefined) throw new ErreurEndpointInconnu(String(nom))

  // Le garde s'execute avant fetch, jamais apres.
  verifierChargeSortante(nom, charge)

  const envoieUnCorps = definition.methode !== 'GET' && charge !== undefined

  const reponse = await fetch(definition.chemin, {
    method: definition.methode,
    credentials: 'same-origin',
    // Jamais de redirection vers un tiers : la reponse doit venir de la meme origine.
    redirect: 'error',
    headers: envoieUnCorps ? { 'content-type': 'application/json' } : undefined,
    body: envoieUnCorps ? JSON.stringify(charge) : undefined,
    signal: options.signal,
  })

  if (!reponse.ok) {
    throw new ErreurReponseApi(
      reponse.status,
      `Appel « ${nom} » refusé par le serveur (${reponse.status}).`,
    )
  }

  if (reponse.status === 204) return undefined as T
  return (await reponse.json()) as T
}
