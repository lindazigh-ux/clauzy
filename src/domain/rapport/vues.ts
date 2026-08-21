/**
 * Deux lectures d'un même dossier (point 7 du cahier de fiabilité).
 *
 * Le rapport courtier et la note client ne sont pas le même document, et les
 * confondre a un coût des deux côtés : le courtier perd la trace du
 * raisonnement dont il a besoin pour défendre son analyse, et le client reçoit
 * des détails de motifs de détection qui ne lui apprennent rien et qui
 * alourdissent la lecture.
 *
 * Ce module pose la SÉPARATION, sans refondre l'interface : il dit ce que
 * chaque vue porte, et les rendus s'y conforment progressivement. Aujourd'hui,
 * les deux livrables rendent la vue CLIENT ; le rapport courtier complet
 * viendra ensuite, en ajoutant des rubriques, jamais en en retirant.
 */

export type Vue = 'COURTIER' | 'CLIENT'

export type DefinitionVue = {
  readonly id: Vue
  readonly libelle: string
  readonly destinataire: string
  /** Ce que cette vue porte, et que l'autre ne porte pas nécessairement. */
  readonly porte: readonly string[]
  /** Ce qu'elle laisse de côté, et pourquoi. */
  readonly ecarte: readonly string[]
}

export const VUES: Record<Vue, DefinitionVue> = {
  CLIENT: {
    id: 'CLIENT',
    libelle: 'Note de conseil',
    destinataire: 'Le client du praticien — dirigeant, direction immobilière, direction juridique.',
    porte: [
      'La synthèse et les enjeux chiffrés',
      'Le périmètre et les limites — la page qui protège',
      'Le rapprochement des garanties, avec le geste que chacune appelle',
      'Les incohérences internes du bail, expliquées',
      'Les préconisations, hiérarchisées par enjeu',
      'La matrice complète des contrôles',
      'Le calendrier de relance de l’attestation',
    ],
    ecarte: [
      'Les motifs de détection et les scores de confiance : ils décrivent l’outil, pas le dossier',
      'Les lectures écartées par le moteur : c’est au praticien de les avoir tranchées avant',
      'Les contrôles sans objet, détaillés un à un',
    ],
  },
  COURTIER: {
    id: 'COURTIER',
    libelle: 'Rapport de travail',
    destinataire: 'Le praticien lui-même, et son confrère qui reprendrait le dossier.',
    porte: [
      'Tout ce que porte la note client',
      'La trace de recherche : ce qui a été cherché, sous quels libellés, dans quelles pièces',
      'Les lectures écartées, et la raison de chaque arbitrage',
      'Les niveaux de confiance et les signaux qui ont produit chaque statut',
      'Les contrôles sans objet, avec le motif de leur mise à l’écart',
      'Les ajustements manuels, leur auteur et leur motif',
    ],
    ecarte: [
      'Rien : le rapport de travail est un sur-ensemble de la note client',
    ],
  },
}

/**
 * Une rubrique appartient-elle à cette vue ?
 *
 * Le rapport courtier étant un sur-ensemble, la question ne se pose vraiment
 * que pour la note client — et la réponse par défaut est OUI : une rubrique
 * n'est retirée du livrable client que sur décision explicite, jamais par
 * omission.
 */
export const RUBRIQUES_RESERVEES_AU_COURTIER: readonly string[] = [
  'trace-de-recherche',
  'lectures-ecartees',
  'confiance',
  'ajustements',
]

export const visibleDans = (rubrique: string, vue: Vue): boolean =>
  vue === 'COURTIER' || !RUBRIQUES_RESERVEES_AU_COURTIER.includes(rubrique)
