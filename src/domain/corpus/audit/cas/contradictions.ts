/**
 * Les clauses qui se CONTREDISENT (brief §10, §13 : contradictions,
 * renonciations complexes).
 *
 * Chacune de ces stipulations passerait sans remarque prise isolément. C'est
 * leur coexistence qui pose problème, et c'est ce qu'aucune relecture linéaire
 * ne voit — le moteur doit toujours produire les DEUX extraits, jamais trancher
 * en silence.
 *
 * Attendus écrits avant exécution, figés le 22 août 2026.
 */
import type { DossierAudit } from '../types'
import { Variete } from '../varietes'

export const CONTRADICTIONS: readonly DossierAudit[] = [
  {
    id: 'AUD-43',
    intitule: 'Le preneur renonce, et le bailleur garantit sa responsabilité envers lui',
    enjeu:
      'Deux clauses qui s’annulent. Au sinistre, chaque partie invoquera celle des deux qui l’arrange, et le juge tranchera sans elles.',
    varietes: [Variete.CONTRADICTION, Variete.RENONCIATION_COMPLEXE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 13 — RENONCIATION À RECOURS
Le Preneur renonce à tout recours contre le Bailleur pour les dommages atteignant ses biens.

ARTICLE 14 — RESPONSABILITÉ DU BAILLEUR
Le Bailleur assurera sa responsabilité envers le Preneur pour les dommages résultant d’un vice de construction.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.
Renonciation à recours contre le bailleur : acquise.`,
    attestation: null,
    garanties: [{ garantieId: 'RENONCIATION_RECOURS', niveau: 'ETABLIE' }],
    interdites: [],
    incoherences: ['COH-01'],
    ecarts: ['RR-01'],
  },
  {
    id: 'AUD-44',
    intitule: 'Réciprocité annoncée, renonciation unilatérale',
    enjeu:
      'Le bail dit « réciproquement » et n’engage que le preneur. Le mot rassure le lecteur pressé ; il n’oblige personne.',
    varietes: [Variete.CONTRADICTION, Variete.RENONCIATION_COMPLEXE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 13 — RENONCIATION RÉCIPROQUE À RECOURS
Les parties conviennent d’une renonciation réciproque à recours.
Le Preneur renonce à tout recours contre le Bailleur et ses assureurs.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.
Renonciation à recours contre le bailleur : acquise.`,
    attestation: null,
    garanties: [{ garantieId: 'RENONCIATION_RECOURS', niveau: 'ETABLIE' }],
    interdites: [],
    incoherences: ['COH-02'],
    ecarts: ['RR-01'],
  },
  {
    id: 'AUD-45',
    intitule: 'L’immeuble assuré des deux côtés, sans que personne s’en aperçoive',
    enjeu:
      'Deux polices sur le même bien : l’une des deux paiera pour rien, et la règle de contribution se réglera entre assureurs, aux frais des primes.',
    varietes: [Variete.CONTRADICTION],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES DU PRENEUR
Le Preneur prend à sa charge l’assurance de la structure et du clos et couvert.

ARTICLE 18 — ASSURANCES DU BAILLEUR
Le Bailleur souscrit et maintient une police garantissant l’immeuble contre l’incendie et les dégâts des eaux.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'ASSURANCE_IMMEUBLE_BAILLEUR',
        niveau: 'ECART_CONFIRME',
        actionContient: 'Ne pas chiffrer d’extension',
      },
    ],
    interdites: [],
    incoherences: ['COH-03'],
    ecarts: ['DAB-01'],
  },
  {
    id: 'AUD-46',
    intitule: 'Obligation absolue, puis renvoi aux limites de la police',
    enjeu:
      'L’article 12 impose une garantie sans réserve ; l’article 25 la ramène aux conditions de la police souscrite. Les deux ne peuvent pas être vrais.',
    varietes: [Variete.CONTRADICTION],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Par dérogation à toute clause contraire, le Preneur garantira les risques locatifs sans réserve ni limitation.

ARTICLE 25 — PORTÉE DES GARANTIES
Les obligations du Preneur s’entendent dans les limites de la police souscrite.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [{ garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' }],
    interdites: [],
    incoherences: ['COH-04'],
    ecarts: [],
  },
  {
    id: 'AUD-47',
    intitule: 'Renonciation organisée par le bail, police muette',
    enjeu:
      'Une renonciation que l’assureur n’a pas acceptée n’engage que le preneur : il renonce à un recours dont son assureur, lui, dispose toujours.',
    varietes: [Variete.RENONCIATION_COMPLEXE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 13 — RENONCIATION À RECOURS
Le Bailleur et le Preneur renoncent réciproquement à tout recours pour les dommages garantis.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.
Responsabilité civile exploitation : 8 000 000 € par sinistre.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'RENONCIATION_RECOURS',
        niveau: 'ECART_CONFIRME',
        actionContient: 'renonciation à recours de l’assureur',
      },
    ],
    interdites: [],
    incoherences: ['COH-05'],
    ecarts: [],
    historique: [
      {
        le: '2026-08-22',
        quoi: 'Contrôles attendus en écart : RR-01 et RR-04 → aucun.',
        pourquoi:
          'RR-01 sanctionne le défaut de réciprocité, et la clause est réciproque ; RR-04 exige que le bail parle des assureurs, et ce bail n’en parle pas — c’est précisément la lacune du cas. Les deux se taisent à bon droit, et c’est COH-05 qui porte le point. Mon attendu cherchait le défaut au mauvais endroit.',
      },
    ],
  },
  {
    id: 'AUD-48',
    intitule: 'Renonciation en cascade — occupants, prestataires, fournisseurs',
    enjeu:
      'Le preneur renonce pour des personnes qui ne sont pas parties au bail. Il s’engage à un résultat qu’il ne maîtrise pas.',
    varietes: [Variete.RENONCIATION_COMPLEXE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 13 — RENONCIATION À RECOURS
Le Preneur renonce à tout recours contre le Bailleur, et fait renoncer les autres occupants, ses prestataires et ses fournisseurs.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.
Renonciation à recours contre le bailleur : acquise.`,
    attestation: null,
    garanties: [{ garantieId: 'RENONCIATION_RECOURS', niveau: 'ETABLIE' }],
    interdites: [],
    incoherences: [],
    ecarts: ['RR-01', 'RR-03'],
  },
  {
    id: 'AUD-49',
    intitule: 'Le bail prime sur la police',
    enjeu:
      'La clause la plus dangereuse du référentiel : elle rend le preneur débiteur de ce que sa police ne couvre pas, et aucune assurance ne corrige cela.',
    varietes: [Variete.CONTRADICTION],
    figeLe: '2026-08-22',
    bail: `ARTICLE 25 — ARTICULATION
Les stipulations du bail priment sur celles de la police d’assurance du Preneur.
L’insuffisance de la couverture souscrite ne limite pas les obligations du Preneur.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [],
    interdites: ['RISQUES_LOCATIFS', 'ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: [],
    limitesControles: [
      {
        controleId: 'ART-01',
        pourquoi:
          'Le moteur trouve les deux stipulations — « le bail prime sur la police » et « l’insuffisance de la couverture ne limite pas les obligations » — mais les note à 52 sur un seuil de 60, et conclut « à vérifier ». La conclusion reste honnête au sens du §46 ; la sensibilité, elle, est insuffisante sur la clause la plus dangereuse du référentiel.',
      },
    ],
  },
  {
    id: 'AUD-50',
    intitule: 'Le bailleur décide seul du niveau de couverture',
    enjeu:
      'Une obligation dont le montant n’est pas connu à la signature ne peut être ni chiffrée ni assurée. Le preneur signe un engagement ouvert.',
    varietes: [Variete.CONTRADICTION],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur garantira les risques locatifs.
Le Bailleur pourra exiger à tout moment un niveau de couverture supérieur qu’il estimera nécessaire.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [{ garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' }],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: ['FOR-05'],
  },
]
