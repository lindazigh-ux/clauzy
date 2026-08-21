/**
 * Plans d'abonnement (brief §10).
 *
 * Le brief fixe la STRUCTURE et laisse les MONTANTS a valider
 * commercialement. Ils sont donc rassembles ici, en un seul endroit, et
 * portent une constante explicite : les changer ne demande de toucher a aucune
 * page. Ce sont des montants de travail, pas des montants arbitres.
 *
 * Les identifiants de plan reprennent ceux du catalogue reseau
 * (`abonnement.checkout`) : un plan affiche ici et refuse par la couche reseau
 * serait une impasse a la caisse.
 */
import { NOMBRE_CONTROLES } from '@/domain/controles'

export type IdPlan = 'ESSAI' | 'PRATICIEN' | 'CABINET' | 'GRANDS_COMPTES'

export type Plan = {
  readonly id: IdPlan
  readonly nom: string
  /** Prix mensuel hors taxes, en euros. Null = sur devis. */
  readonly mensuel: number | null
  /** Prix mensuel hors taxes en engagement annuel. Null = sur devis. */
  readonly annuel: number | null
  /** A qui ce plan s'adresse, en une phrase. */
  readonly pourQui: string
  readonly inclus: readonly string[]
  /** Ce que le plan ne fait PAS — dit ici plutot que decouvert a l'usage. */
  readonly limites: readonly string[]
  readonly appel: string
  readonly cheminAppel: string
  readonly misEnAvant?: boolean
}

/**
 * MONTANTS A VALIDER COMMERCIALEMENT (brief §10).
 * Ils tiennent la page debout et se remplacent d'une ligne.
 */
export const PLANS: readonly Plan[] = [
  {
    id: 'ESSAI',
    nom: 'Essai',
    mensuel: 0,
    annuel: 0,
    pourQui: 'Pour juger sur pièces, avec vos propres baux.',
    inclus: [
      `Les ${NOMBRE_CONTROLES} contrôles, sans exception`,
      '3 dossiers',
      'Poste de travail complet : reprise à la main, rattachement, observations',
      'Export Word et PDF, en filigrane',
    ],
    limites: ['Le livrable porte un filigrane', 'Pas de personnalisation aux couleurs du cabinet'],
    appel: 'Essayer sans compte',
    cheminAppel: '/dossier',
  },
  {
    id: 'PRATICIEN',
    nom: 'Praticien',
    mensuel: 89,
    annuel: 74,
    pourQui: 'Pour un courtier, un avocat ou un juriste qui livre en son nom.',
    inclus: [
      'Dossiers illimités',
      'Livrable aux couleurs de votre cabinet, signé par vous',
      'Suivi d’attestation et calendrier de relance exportable',
      'Sauvegarde chiffrée des dossiers',
    ],
    limites: ['Un seul utilisateur'],
    appel: 'Prendre l’abonnement',
    cheminAppel: '/dossier',
    misEnAvant: true,
  },
  {
    id: 'CABINET',
    nom: 'Cabinet',
    mensuel: 320,
    annuel: 267,
    pourQui: 'Pour une équipe qui doit rendre des analyses homogènes.',
    inclus: [
      'Tout le plan Praticien',
      '5 utilisateurs',
      'Bibliothèque de clauses partagée',
      'Modèles de rapport personnalisés',
    ],
    limites: ['Au-delà de 5 utilisateurs, passer en grands comptes'],
    appel: 'Prendre l’abonnement',
    cheminAppel: '/dossier',
  },
  {
    id: 'GRANDS_COMPTES',
    nom: 'Grands comptes',
    mensuel: null,
    annuel: null,
    pourQui: 'Pour une direction juridique ou un réseau, avec son propre référentiel.',
    inclus: [
      'Tout le plan Cabinet',
      'Utilisateurs illimités',
      'Contrôles sur mesure versés à votre référentiel',
      'Revue d’architecture et DPA négocié',
    ],
    limites: [],
    appel: 'Réserver une démonstration',
    cheminAppel: '/demo',
  },
]

/** Economie de l'engagement annuel, en pourcentage entier. */
export const remiseAnnuelle = (plan: Plan): number | null => {
  if (plan.mensuel === null || plan.annuel === null || plan.mensuel === 0) return null
  return Math.round(((plan.mensuel - plan.annuel) / plan.mensuel) * 100)
}
