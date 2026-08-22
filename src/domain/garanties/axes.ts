/**
 * Les trois axes d'une conclusion (brief directeur §4 à §8).
 *
 * Jusqu'ici, une conclusion mélangeait tout dans une phrase : « Négocier la
 * clause d'abord, chiffrer l'extension ensuite » disait à la fois la gravité
 * ressentie, le geste à faire et l'appréciation de la preuve. Un texte libre
 * ne se compte pas, ne se filtre pas, ne se trie pas — et deux surfaces qui le
 * recopient finissent par diverger.
 *
 * Trois axes INDÉPENDANTS, donc :
 *
 *   1. le NIVEAU DE PREUVE — ce que les documents démontrent ;
 *   2. la GRAVITÉ MÉTIER  — ce que le défaut coûte au client ;
 *   3. l'ACTION           — le geste que cela appelle.
 *
 * Les trois ne se déduisent pas l'un de l'autre. Une garantie critique peut
 * être « non démontrée » sans qu'aucun écart n'existe ; une modalité peut être
 * en écart confirmé sans que ce soit grave. « À négocier » n'est pas une
 * gravité : c'est une action.
 *
 * L'affichage, lui, a le droit de les résumer en un seul badge — mais il le
 * calcule à partir des trois, il ne les remplace pas.
 */
import { Categorie, NiveauPreuve } from './types'

// ---------------------------------------------------------------------------
// Axe 2 — gravité métier
// ---------------------------------------------------------------------------

/**
 * Ce que le défaut coûte, indépendamment de ce qu'on sait le démontrer.
 *
 * Distincte de la `Gravite` 1/2/3 du référentiel, qui qualifie un CONTRÔLE
 * dans l'absolu. Celle-ci qualifie une CONCLUSION sur un dossier donné.
 */
export enum GraviteMetier {
  /** Expose significativement le preneur, ou laisse une obligation majeure découverte. */
  CRITIQUE = 'CRITIQUE',
  /** Demande une intervention, sans être immédiatement critique. */
  IMPORTANTE = 'IMPORTANTE',
  /** Point à corriger ou à contrôler. */
  MODEREE = 'MODEREE',
  /** Utile à savoir, sans action urgente. */
  INFORMATION = 'INFORMATION',
}

export const LIBELLE_GRAVITE: Record<GraviteMetier, string> = {
  [GraviteMetier.CRITIQUE]: 'Critique',
  [GraviteMetier.IMPORTANTE]: 'Importante',
  [GraviteMetier.MODEREE]: 'Modérée',
  [GraviteMetier.INFORMATION]: 'Information',
}

/** Du plus grave au moins grave — sert au tri et aux plafonnements. */
export const ORDRE_GRAVITE: readonly GraviteMetier[] = [
  GraviteMetier.CRITIQUE,
  GraviteMetier.IMPORTANTE,
  GraviteMetier.MODEREE,
  GraviteMetier.INFORMATION,
]

/** La moins grave des deux. Sert à plafonner sans jamais aggraver. */
export const plafonner = (gravite: GraviteMetier, plafond: GraviteMetier): GraviteMetier =>
  ORDRE_GRAVITE.indexOf(gravite) >= ORDRE_GRAVITE.indexOf(plafond) ? gravite : plafond

// ---------------------------------------------------------------------------
// Axe 3 — action recommandée
// ---------------------------------------------------------------------------

/**
 * Le geste, en énumération FERMÉE.
 *
 * Fermée à dessein : un code se compte, se filtre et se regroupe en tête de
 * rapport — « trois pièces à demander, une clause à négocier ». Une phrase
 * libre ne le permet pas, et se met à diverger d'un écran à l'autre.
 *
 * La phrase reste, mais à côté du code : c'est sa formulation, pas sa nature.
 */
export enum Action {
  AUCUNE_ACTION = 'AUCUNE_ACTION',
  VERIFIER = 'VERIFIER',
  DEMANDER_PIECE = 'DEMANDER_PIECE',
  DEMANDER_ATTESTATION = 'DEMANDER_ATTESTATION',
  ADAPTER_CONTRAT = 'ADAPTER_CONTRAT',
  NEGOCIER_CLAUSE = 'NEGOCIER_CLAUSE',
  OBTENIR_ACCORD_ASSUREUR = 'OBTENIR_ACCORD_ASSUREUR',
  /** Le moteur ne tranche pas : le point demande un jugement de praticien. */
  VALIDATION_HUMAINE = 'VALIDATION_HUMAINE',
}

export const LIBELLE_ACTION: Record<Action, string> = {
  [Action.AUCUNE_ACTION]: 'Aucune action',
  [Action.VERIFIER]: 'Vérifier',
  [Action.DEMANDER_PIECE]: 'Demander une pièce',
  [Action.DEMANDER_ATTESTATION]: 'Demander une attestation',
  [Action.ADAPTER_CONTRAT]: 'Adapter le contrat',
  [Action.NEGOCIER_CLAUSE]: 'Négocier la clause',
  [Action.OBTENIR_ACCORD_ASSUREUR]: 'Obtenir l’accord de l’assureur',
  [Action.VALIDATION_HUMAINE]: 'Validation humaine',
}

/** Qui doit être sollicité. Utile pour regrouper les démarches d'un dossier. */
export const INTERLOCUTEUR: Record<Action, string | null> = {
  [Action.AUCUNE_ACTION]: null,
  [Action.VERIFIER]: null,
  [Action.DEMANDER_PIECE]: 'Le preneur ou son courtier',
  [Action.DEMANDER_ATTESTATION]: 'Le courtier ou la compagnie',
  [Action.ADAPTER_CONTRAT]: 'La compagnie',
  [Action.NEGOCIER_CLAUSE]: 'Le bailleur',
  [Action.OBTENIR_ACCORD_ASSUREUR]: 'La compagnie',
  [Action.VALIDATION_HUMAINE]: null,
}

/**
 * Une recommandation : le code, et sa formulation.
 *
 * Le code sert à compter et à trier, la phrase à lire. Les deux vivent
 * ensemble pour qu'aucune surface n'ait à réinventer l'une à partir de l'autre.
 */
export type Recommandation = {
  readonly action: Action
  readonly phrase: string
}

// ---------------------------------------------------------------------------
// Statut d'affichage — le résumé des trois axes
// ---------------------------------------------------------------------------

/**
 * Ce que l'interface montre en un coup d'œil (§8).
 *
 * Il se CALCULE à partir des trois axes ; il ne les remplace jamais. Un
 * rapport qui ne porterait que ce badge aurait perdu ce qui permet de le
 * justifier.
 */
export enum StatutAffiche {
  CONFORME = 'CONFORME',
  A_VERIFIER = 'A_VERIFIER',
  A_NEGOCIER = 'A_NEGOCIER',
  CRITIQUE = 'CRITIQUE',
  INFORMATION = 'INFORMATION',
}

export const LIBELLE_STATUT_AFFICHE: Record<StatutAffiche, string> = {
  [StatutAffiche.CONFORME]: 'Conforme',
  [StatutAffiche.A_VERIFIER]: 'À vérifier',
  [StatutAffiche.A_NEGOCIER]: 'À négocier',
  [StatutAffiche.CRITIQUE]: 'Critique',
  [StatutAffiche.INFORMATION]: 'Information',
}

/**
 * Le badge, déduit des trois axes.
 *
 * L'ordre des règles est l'ordre de lecture d'un courtier : ce qui est acquis
 * ne l'intéresse plus, ce qui est critique passe devant, ce qui se négocie se
 * distingue de ce qui se vérifie.
 */
export function statutAffiche(
  preuve: NiveauPreuve,
  gravite: GraviteMetier,
  action: Action,
): StatutAffiche {
  // Ce qui est démontré est clos, quelle que soit la gravité du contrôle.
  if (preuve === NiveauPreuve.ETABLIE) return StatutAffiche.CONFORME
  if (gravite === GraviteMetier.CRITIQUE) return StatutAffiche.CRITIQUE
  // La négociation est un geste, pas une gravité : elle a sa propre couleur.
  if (action === Action.NEGOCIER_CLAUSE) return StatutAffiche.A_NEGOCIER
  if (gravite === GraviteMetier.INFORMATION) return StatutAffiche.INFORMATION
  return StatutAffiche.A_VERIFIER
}

// ---------------------------------------------------------------------------
// Table par défaut — gravité et action selon la nature de la garantie
// ---------------------------------------------------------------------------

/**
 * Gravité de BASE d'une catégorie, quand un défaut est confirmé.
 *
 * Une responsabilité découverte expose le preneur sur son patrimoine ; une
 * modalité d'indemnisation mal calée coûte la différence. Ce n'est pas le même
 * ordre de grandeur, et l'interface ne doit pas les peindre pareil.
 */
export const GRAVITE_DE_BASE: Record<Categorie, GraviteMetier> = {
  [Categorie.RESPONSABILITE]: GraviteMetier.CRITIQUE,
  [Categorie.DOMMAGES_AUX_BIENS]: GraviteMetier.IMPORTANTE,
  [Categorie.PERTES_FINANCIERES]: GraviteMetier.IMPORTANTE,
  [Categorie.MODALITE]: GraviteMetier.MODEREE,
  [Categorie.MECANISME]: GraviteMetier.IMPORTANTE,
}

/**
 * Le niveau de preuve PLAFONNE la gravité — il ne la fixe pas.
 *
 * On ne peut pas crier au critique sur une garantie qu'on n'a simplement pas
 * pu vérifier : « non démontré » veut dire qu'on ne sait pas, et l'annoncer
 * comme critique est précisément le faux positif qui fait tout revérifier.
 * Seul un écart CONFIRMÉ laisse la gravité de base s'exprimer.
 */
export const PLAFOND_PAR_PREUVE: Record<NiveauPreuve, GraviteMetier> = {
  [NiveauPreuve.ETABLIE]: GraviteMetier.INFORMATION,
  [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]: GraviteMetier.MODEREE,
  [NiveauPreuve.PROBABLE]: GraviteMetier.MODEREE,
  [NiveauPreuve.NON_DEMONTREE]: GraviteMetier.IMPORTANTE,
  [NiveauPreuve.ECART_CONFIRME]: GraviteMetier.CRITIQUE,
}

/** La gravité d'une conclusion : la base de la catégorie, plafonnée par la preuve. */
export const graviteDe = (categorie: Categorie, preuve: NiveauPreuve): GraviteMetier =>
  plafonner(GRAVITE_DE_BASE[categorie], PLAFOND_PAR_PREUVE[preuve])

/**
 * Ce que chaque niveau appelle, par defaut, selon la NATURE de la garantie.
 *
 * Une responsabilite absente se negocie puis se chiffre. Une modalite
 * d'indemnisation ne se negocie pas : elle se confirme aux conditions
 * particulieres. Un mecanisme contractuel ne s'achete pas : il s'obtient par
 * ecrit de l'assureur. Confondre les trois envoie le courtier au mauvais
 * interlocuteur.
 */
export const ACTION_PAR_CATEGORIE: Record<Categorie, Record<NiveauPreuve, Recommandation>> = {
  [Categorie.RESPONSABILITE]: {
    [NiveauPreuve.ETABLIE]: { action: Action.AUCUNE_ACTION, phrase: 'Point clos.' },
    [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]: {
      action: Action.DEMANDER_ATTESTATION,
      phrase:
      'Demander une attestation qui détaille cette garantie et son montant. Le contrat n’est pas en cause.',
      },
    [NiveauPreuve.PROBABLE]: {
      action: Action.VERIFIER,
      phrase:
      'Faire confirmer la garantie et son montant aux conditions particulières avant de conclure.',
      },
    [NiveauPreuve.NON_DEMONTREE]: {
      action: Action.DEMANDER_PIECE,
      phrase:
      'Réclamer les conditions particulières. Sans elles, la responsabilité ne peut être ni confirmée ni écartée.',
      },
    [NiveauPreuve.ECART_CONFIRME]: {
      action: Action.NEGOCIER_CLAUSE,
      phrase:
      'Corriger la clause du bail en premier ; à défaut, chiffrer l’extension de garantie auprès de la compagnie.',
      },
  },
  [Categorie.DOMMAGES_AUX_BIENS]: {
    [NiveauPreuve.ETABLIE]: { action: Action.AUCUNE_ACTION, phrase: 'Point clos.' },
    [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]: {
      action: Action.DEMANDER_ATTESTATION,
      phrase:
      'Demander une attestation mentionnant cette catégorie de biens et son capital.',
      },
    [NiveauPreuve.PROBABLE]: {
      action: Action.VERIFIER,
      phrase:
      'Faire confirmer le périmètre des biens couverts et leur capital aux conditions particulières.',
      },
    [NiveauPreuve.NON_DEMONTREE]: {
      action: Action.DEMANDER_PIECE,
      phrase:
      'Réclamer l’inventaire valorisé et le tableau de garanties : sans eux, aucun capital ne se vérifie.',
      },
    [NiveauPreuve.ECART_CONFIRME]: {
      action: Action.NEGOCIER_CLAUSE,
      phrase:
      'Limiter l’obligation du bail aux biens dont le preneur est propriétaire ou gardien ; à défaut, faire étendre le périmètre assuré.',
      },
  },
  [Categorie.PERTES_FINANCIERES]: {
    [NiveauPreuve.ETABLIE]: { action: Action.AUCUNE_ACTION, phrase: 'Point clos.' },
    [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]: {
      action: Action.DEMANDER_ATTESTATION,
      phrase:
      'Demander une attestation portant la période d’indemnisation, que les attestations omettent presque toujours.',
      },
    [NiveauPreuve.PROBABLE]: {
      action: Action.VERIFIER,
      phrase:
      'Faire confirmer la période d’indemnisation et l’assiette aux conditions particulières.',
      },
    [NiveauPreuve.NON_DEMONTREE]: {
      action: Action.DEMANDER_PIECE,
      phrase:
      'Réclamer les conditions particulières : la période d’indemnisation ne figure jamais sur une attestation.',
      },
    [NiveauPreuve.ECART_CONFIRME]: {
      action: Action.ADAPTER_CONTRAT,
      phrase:
      'Aligner la durée exigée par le bail sur la période réellement indemnisée, ou faire chiffrer l’allongement de cette période.',
      },
  },
  [Categorie.MODALITE]: {
    [NiveauPreuve.ETABLIE]: { action: Action.AUCUNE_ACTION, phrase: 'Point clos.' },
    [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]: {
      action: Action.DEMANDER_ATTESTATION,
      phrase:
      'Demander une attestation reprenant cette modalité : une attestation muette ne l’oppose à personne.',
      },
    [NiveauPreuve.PROBABLE]: { action: Action.VERIFIER, phrase: 'Faire confirmer la modalité et ses conditions d’application par écrit.' },
    [NiveauPreuve.NON_DEMONTREE]: {
      action: Action.DEMANDER_PIECE,
      phrase:
      'Réclamer les conditions particulières : une modalité d’indemnisation ne se déduit pas.',
      },
    // Une modalité ne se négocie pas et ne s'achète pas en extension : elle se
    // constate. Le défaut vient presque toujours d'une promesse du bail que la
    // police ne tient pas.
    [NiveauPreuve.ECART_CONFIRME]: {
      action: Action.VERIFIER,
      phrase:
      'Faire constater la modalité réelle aux conditions particulières, puis corriger la promesse du bail qui ne lui correspond pas.',
      },
  },
  [Categorie.MECANISME]: {
    [NiveauPreuve.ETABLIE]: { action: Action.AUCUNE_ACTION, phrase: 'Point clos.' },
    [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]: {
      action: Action.DEMANDER_ATTESTATION,
      phrase:
      'Demander une attestation portant expressément ce mécanisme : sans mention, il n’est pas opposable.',
      },
    [NiveauPreuve.PROBABLE]: { action: Action.VERIFIER, phrase: 'Faire confirmer le mécanisme et son périmètre par écrit de l’assureur.' },
    [NiveauPreuve.NON_DEMONTREE]: {
      action: Action.DEMANDER_PIECE,
      phrase:
      'Réclamer les conditions particulières : ce mécanisme ne se présume pas.',
      },
    // Un mécanisme ne s'achète pas : il s'obtient par un écrit de l'assureur.
    [NiveauPreuve.ECART_CONFIRME]: {
      action: Action.OBTENIR_ACCORD_ASSUREUR,
      phrase:
      'Obtenir l’accord écrit de l’assureur : le bail ne peut pas créer cet engagement à sa place.',
      },
  },
}

