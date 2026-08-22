/**
 * Ce que la police PORTE, et à quelle hauteur (brief §13 : garantie englobante,
 * couverture partielle, plafond insuffisant, franchises, exclusions).
 *
 * Trouver le bon libellé ne suffit pas. Une garantie présente mais insuffisante
 * est un écart, et c'est même le plus courant — et le plus silencieux, parce
 * qu'un moteur qui compare des mots le déclare conforme.
 *
 * Attendus écrits avant exécution, figés le 22 août 2026.
 */
import type { DossierAudit } from '../types'
import { Variete } from '../varietes'

export const COUVERTURE: readonly DossierAudit[] = [
  {
    id: 'AUD-27',
    intitule: 'RC exploitation exigée à 8 M€, souscrite à 3 M€',
    enjeu:
      'La bonne ligne au tableau, la mauvaise hauteur. Le bail exige un montant plancher que la police ne tient pas.',
    varietes: [Variete.PLAFOND_INSUFFISANT],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur justifiera d’une responsabilité civile exploitation d’un montant minimum de 8 000 000 € par sinistre.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité civile exploitation : 3 000 000 € par sinistre.`,
    attestation: null,
    garanties: [
      { garantieId: 'RC_EXPLOITATION', niveau: 'ECART_CONFIRME' },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: ['GAR-03', 'RC-02'],
  },
  {
    id: 'AUD-28',
    intitule: 'Couverture partielle — la moitié de ce que le bail exige',
    enjeu:
      'La police répond sur les risques locatifs et ignore le vol. Conclure « conforme » sur la première moitié laisserait la seconde découverte.',
    varietes: [Variete.COUVERTURE_PARTIELLE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur garantira les risques locatifs ainsi que le vol et le vandalisme des biens garnissant les locaux.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [
      { garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' },
      { garantieId: 'DOMMAGES_BIENS_PRENEUR', niveau: 'ECART_CONFIRME' },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: ['DAB-06'],
  },
  {
    id: 'AUD-29',
    intitule: 'La police exclut un événement que le bail impose',
    enjeu:
      'La garantie existe, l’événement en est exclu. C’est l’écart qu’aucune comparaison de libellés ne voit — et celui que le sinistre révèle.',
    varietes: [Variete.EXCLUSION],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur garantira les risques locatifs, y compris les dégâts des eaux.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.
Exclusion : les dommages par dégâts des eaux ne sont pas garantis.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'RISQUES_LOCATIFS',
        niveau: 'ECART_CONFIRME',
        limiteConnue:
          'Le moteur ne lit pas les exclusions : il reconnaît « responsabilité locative » au contrat et conclut à une couverture établie, sans voir que l’événement expressément exigé par le bail en est retiré. La lecture des exclusions n’est pas au périmètre du moteur aujourd’hui.',
      },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-30',
    intitule: 'Franchise plafonnée par le bail, dépassée par la police',
    enjeu:
      'Deux montants comparables des deux côtés : c’est le cas où la confrontation chiffrée doit trancher, et non se taire.',
    varietes: [Variete.FRANCHISE, Variete.PLAFOND_INSUFFISANT],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
La franchise applicable ne pourra excéder 1 000 € par sinistre.`,
    contrat: `CONDITIONS PARTICULIÈRES
Franchise : 5 000 € par sinistre.`,
    attestation: null,
    garanties: [{ garantieId: 'FRANCHISE', niveau: 'ECART_CONFIRME' }],
    interdites: [],
    incoherences: [],
    ecarts: [],
    historique: [
      {
        le: '2026-08-22',
        quoi: 'Contrôles attendus en écart : DAB-05 → aucun.',
        pourquoi:
          'DAB-05 vise la clause qui rend la franchise INOPPOSABLE au bailleur ou la met à la charge du preneur, pas celle qui la plafonne. Un bail qui plafonne la franchise est une clause normale ; c’est le dépassement, chiffré, que le rapprochement doit dire — et il le dit désormais.',
      },
    ],
  },
  {
    id: 'AUD-31',
    intitule: 'Capitaux souscrits SUPÉRIEURS à ce que le bail exige',
    enjeu:
      'Le pendant d’AUD-03. Comparer des montants sans regarder le sens de l’inégalité produirait un écart là où le preneur est mieux couvert qu’exigé.',
    varietes: [Variete.PLAFOND_INSUFFISANT],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Les capitaux assurés seront maintenus à hauteur de 2 000 000 € pour le contenu professionnel.`,
    contrat: `CONDITIONS PARTICULIÈRES
Capitaux assurés : 2 500 000 €.`,
    attestation: null,
    garanties: [{ garantieId: 'CAPITAUX_ASSURES', niveau: 'ETABLIE' }],
    interdites: [],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-32',
    intitule: 'Garantie englobante — « tous risques informatiques » couvre le bris',
    enjeu:
      'La police est plus large que l’exigence. Réclamer la ligne exacte reviendrait à réclamer un mot.',
    varietes: [Variete.GARANTIE_ENGLOBANTE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur garantira le bris de machines et de son matériel informatique.`,
    contrat: `CONDITIONS PARTICULIÈRES
Tous risques informatiques : 250 000 €.
Bris de machines : 400 000 €.`,
    attestation: null,
    garanties: [{ garantieId: 'BRIS_DE_MACHINE', niveau: 'ETABLIE' }],
    interdites: [],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-33',
    intitule: 'RC exploitation exigée, « responsabilité civile générale » souscrite',
    enjeu:
      'Le vocabulaire des compagnies varie d’un produit à l’autre. « Générale » englobe « exploitation », et le moteur doit le savoir.',
    varietes: [Variete.GARANTIE_ENGLOBANTE, Variete.SYNONYME_ASSUREUR],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur justifiera d’une responsabilité civile exploitation.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité civile générale : 8 000 000 € par sinistre.`,
    attestation: null,
    garanties: [{ garantieId: 'RC_EXPLOITATION', niveau: 'ETABLIE' }],
    interdites: [],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-34',
    intitule: 'Perte d’exploitation exigée sur 18 mois, garantie sur 12',
    enjeu:
      'La période d’indemnisation ne figure jamais sur une attestation, et c’est elle qui décide de tout. Six mois manquants sont six mois de charges.',
    varietes: [Variete.PLAFOND_INSUFFISANT, Variete.COUVERTURE_PARTIELLE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur fera garantir la perte d’exploitation pendant dix-huit mois.`,
    contrat: `CONDITIONS PARTICULIÈRES
Perte d’exploitation : marge brute garantie pendant douze mois.`,
    attestation: null,
    garanties: [{ garantieId: 'PERTE_EXPLOITATION', niveau: 'ECART_CONFIRME' }],
    interdites: [],
    incoherences: [],
    ecarts: [],
  },
]
