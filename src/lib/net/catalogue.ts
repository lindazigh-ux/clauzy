/**
 * Catalogue des endpoints — l'unique surface reseau de Clauzy.
 *
 * Regle de lecture (brief §2) : chaque champ declare ici quitte le navigateur.
 * Un champ sans justification metier n'a rien a faire dans ce fichier. Ajouter
 * un champ est une decision d'architecture, pas une commodite d'implementation.
 *
 * Ne peuvent transiter que :
 *   - l'identite de l'utilisateur, l'organisation, l'abonnement, les quotas ;
 *   - les metadonnees de dossier saisies manuellement (reference, date, statut) ;
 *   - des statistiques strictement anonymes.
 *
 * Jamais un extrait de texte, jamais un nom de client, jamais un nom de fichier.
 */
import type { DefinitionEndpoint } from './types'

/** Plafond absolu : au-dela, ce n'est plus une metadonnee, c'est du contenu. */
export const LONGUEUR_MAX_ABSOLUE = 512

const STATUTS_DOSSIER = ['BROUILLON', 'EN_COURS', 'LIVRE', 'CLOS'] as const
const PLANS = ['ESSAI', 'PRATICIEN', 'CABINET', 'GRANDS_COMPTES'] as const
const PERIODICITES = ['MENSUEL', 'ANNUEL'] as const

/**
 * Motifs de demande de demonstration, en enumeration fermee.
 *
 * Un champ de message libre serait la premiere breche : le §2 n'autorise a
 * sortir que l'identite, l'organisation, l'abonnement, les quotas, les
 * metadonnees de dossier saisies a la main et des statistiques anonymes. Un
 * texte libre n'entre dans aucune de ces cases. Le besoin se choisit donc dans
 * une liste, et le detail se dit de vive voix.
 */
const BESOINS_DEMO = [
  'DECOUVERTE',
  'EQUIPE',
  'REFERENTIEL_SUR_MESURE',
  'SECURITE_ET_DPA',
  'INTEGRATION',
] as const

const TAILLES_EQUIPE = ['1', '2-5', '6-20', '21-100', '100+'] as const

export const CATALOGUE_ENDPOINTS = {
  'auth.inscription': {
    methode: 'POST',
    chemin: '/api/auth/inscription',
    champs: {
      email: { type: 'chaine', longueurMax: 320, obligatoire: true, justification: 'Identité de l’utilisateur (§2).' },
      motDePasse: { type: 'chaine', longueurMax: 200, obligatoire: true, justification: 'Secret d’authentification, haché côté serveur.' },
      nom: { type: 'chaine', longueurMax: 120, justification: 'Identité de l’utilisateur — jamais un nom de fichier ni de client.' },
      organisation: { type: 'chaine', longueurMax: 160, justification: 'Organisation abonnée (§2), pas le client final du dossier.' },
    },
  },
  'auth.connexion': {
    methode: 'POST',
    chemin: '/api/auth/connexion',
    champs: {
      email: { type: 'chaine', longueurMax: 320, obligatoire: true, justification: 'Identité de l’utilisateur (§2).' },
      motDePasse: { type: 'chaine', longueurMax: 200, obligatoire: true, justification: 'Secret d’authentification.' },
    },
  },
  'auth.lienMagique': {
    methode: 'POST',
    chemin: '/api/auth/lien-magique',
    champs: {
      email: { type: 'chaine', longueurMax: 320, obligatoire: true, justification: 'Identité de l’utilisateur (§2).' },
    },
  },
  'auth.deconnexion': {
    methode: 'POST',
    chemin: '/api/auth/deconnexion',
    champs: {},
  },
  'session.courante': {
    methode: 'GET',
    chemin: '/api/session',
    champs: {},
  },
  'licence.jeton': {
    methode: 'GET',
    chemin: '/api/licence/jeton',
    champs: {},
  },
  'dossierMeta.lister': {
    methode: 'GET',
    chemin: '/api/dossiers',
    champs: {},
  },
  'dossierMeta.creer': {
    methode: 'POST',
    chemin: '/api/dossiers',
    champs: {
      reference: { type: 'chaine', longueurMax: 120, obligatoire: true, justification: 'Référence interne saisie manuellement (§2). Jamais pré-remplie depuis un document.' },
      statut: { type: 'chaine', longueurMax: 16, valeurs: STATUTS_DOSSIER, justification: 'Statut de suivi (§2).' },
    },
  },
  'dossierMeta.majStatut': {
    methode: 'PATCH',
    chemin: '/api/dossiers/statut',
    champs: {
      id: { type: 'chaine', longueurMax: 40, obligatoire: true, justification: 'Identifiant technique du dossier, généré par le serveur.' },
      statut: { type: 'chaine', longueurMax: 16, obligatoire: true, valeurs: STATUTS_DOSSIER, justification: 'Statut de suivi (§2).' },
    },
  },
  'usage.evenement': {
    methode: 'POST',
    chemin: '/api/usage',
    champs: {
      type: { type: 'chaine', longueurMax: 64, obligatoire: true, justification: 'Type d’événement anonyme (§2).' },
      controleId: { type: 'chaine', longueurMax: 16, justification: 'Identifiant du contrôle déclenché, ex. « IND-02 » (§2). Jamais son contenu.' },
      gravite: { type: 'nombre', valeurs: [1, 2, 3], justification: 'Gravité du contrôle (§2).' },
      dureeMs: { type: 'nombre', justification: 'Durée d’analyse (§2).' },
      horodatage: { type: 'chaine', longueurMax: 32, justification: 'Horodatage ISO 8601.' },
    },
  },
  'contact.rapportExemple': {
    methode: 'POST',
    chemin: '/api/contact/rapport-exemple',
    champs: {
      email: { type: 'chaine', longueurMax: 320, obligatoire: true, justification: 'Identité de la personne qui demande le rapport d’exemple (§2). Le rapport porte sur un bail SYNTHÉTIQUE : aucune pièce client n’intervient.' },
      organisation: { type: 'chaine', longueurMax: 160, justification: 'Organisation du demandeur (§2), jamais le client final d’un dossier.' },
    },
  },
  'contact.demo': {
    methode: 'POST',
    chemin: '/api/contact/demo',
    champs: {
      email: { type: 'chaine', longueurMax: 320, obligatoire: true, justification: 'Identité du demandeur (§2).' },
      nom: { type: 'chaine', longueurMax: 120, justification: 'Identité du demandeur — jamais un nom de client ni de fichier.' },
      organisation: { type: 'chaine', longueurMax: 160, justification: 'Organisation du demandeur (§2).' },
      tailleEquipe: { type: 'chaine', longueurMax: 8, valeurs: TAILLES_EQUIPE, justification: 'Dimensionnement de l’offre (§10). Énumération fermée.' },
      besoin: { type: 'chaine', longueurMax: 32, valeurs: BESOINS_DEMO, justification: 'Motif de la demande, en énumération fermée (§10). Pas de texte libre : voir BESOINS_DEMO.' },
    },
  },
  'abonnement.checkout': {
    methode: 'POST',
    chemin: '/api/abonnement/checkout',
    champs: {
      plan: { type: 'chaine', longueurMax: 20, obligatoire: true, valeurs: PLANS, justification: 'Plan choisi (§10).' },
      periodicite: { type: 'chaine', longueurMax: 10, obligatoire: true, valeurs: PERIODICITES, justification: 'Périodicité de l’abonnement : mensuel ou annuel (§3).' },
    },
  },
  'abonnement.portail': {
    methode: 'POST',
    chemin: '/api/abonnement/portail',
    champs: {},
  },
} as const satisfies Record<string, DefinitionEndpoint>

export type NomEndpoint = keyof typeof CATALOGUE_ENDPOINTS
