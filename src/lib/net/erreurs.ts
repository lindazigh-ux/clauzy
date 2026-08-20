/**
 * Erreurs de la couche reseau.
 *
 * ErreurFuiteDocumentaire n'est pas une erreur technique : c'est le signal
 * qu'une partie du code a tente d'envoyer au serveur quelque chose qui doit
 * rester dans le navigateur (brief §2). Elle ne doit jamais etre rattrapee
 * puis ignoree silencieusement.
 */

export class ErreurFuiteDocumentaire extends Error {
  readonly endpoint: string
  readonly champ: string

  constructor(endpoint: string, champ: string, motif: string) {
    super(
      `Fuite documentaire empêchée sur « ${endpoint} » — champ « ${champ} » : ${motif}. ` +
        `Le contenu documentaire ne quitte jamais le navigateur (brief §2). ` +
        `Traitez ce besoin côté client, ou déclarez un champ de métadonnée ` +
        `dans src/lib/net/catalogue.ts.`,
    )
    this.name = 'ErreurFuiteDocumentaire'
    this.endpoint = endpoint
    this.champ = champ
  }
}

export class ErreurEndpointInconnu extends Error {
  constructor(nom: string) {
    super(
      `Endpoint « ${nom} » inconnu. Tout appel réseau passe par un endpoint ` +
        `déclaré dans src/lib/net/catalogue.ts.`,
    )
    this.name = 'ErreurEndpointInconnu'
  }
}

export class ErreurReponseApi extends Error {
  readonly statut: number

  constructor(statut: number, message: string) {
    super(message)
    this.name = 'ErreurReponseApi'
    this.statut = statut
  }
}
