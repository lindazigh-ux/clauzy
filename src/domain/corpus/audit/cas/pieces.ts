/**
 * Ce que les PIÈCES démontrent (brief §13 : attestation partielle, contrat
 * absent, bail muet — et §11 : ne jamais transformer une absence d'information
 * en absence de couverture).
 *
 * C'est l'axe où un moteur se déshonore le plus vite : conclure « le client
 * n'est pas assuré » parce qu'on ne lui a rien remis. Trois états distincts
 * doivent survivre — absent, non démontré, probable.
 *
 * Attendus écrits avant exécution, figés le 22 août 2026.
 */
import type { DossierAudit } from '../types'
import { Variete } from '../varietes'

export const PIECES: readonly DossierAudit[] = [
  {
    id: 'AUD-35',
    intitule: 'Attestation partielle — elle omet une garantie que le contrat porte',
    enjeu:
      'Ni conformité ni écart : la couverture existe, la pièce remise au bailleur ne la démontre pas. La correction est un courriel, pas un avenant.',
    varietes: [Variete.ATTESTATION_PARTIELLE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur maintiendra une garantie des risques locatifs ainsi qu’une garantie du recours des voisins et des tiers.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.
Recours des voisins et des tiers : 1 500 000 € par sinistre.`,
    attestation: `ATTESTATION D’ASSURANCE
Garanties mentionnées : responsabilité locative.`,
    garanties: [
      { garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' },
      {
        garantieId: 'RECOURS_VOISINS_TIERS',
        niveau: 'JUSTIFICATION_INSUFFISANTE',
        actionContient: 'attestation',
      },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-36',
    intitule: 'Attestation détaillée, conditions particulières absentes',
    enjeu:
      'Une attestation prouve qu’un contrat existe, jamais l’étendue de ce qu’il couvre. Même détaillée, elle ne vaut pas conditions particulières.',
    varietes: [Variete.CONTRAT_ABSENT, Variete.ATTESTATION_PARTIELLE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur garantira les risques locatifs, le recours des voisins et des tiers, et sa responsabilité civile exploitation.`,
    contrat: null,
    attestation: `ATTESTATION D’ASSURANCE
Garanties mentionnées : risques locatifs, recours des voisins et des tiers, responsabilité civile exploitation.
Montants : 1 500 000 € et 8 000 000 € par sinistre.`,
    garanties: [
      { garantieId: 'RISQUES_LOCATIFS', niveau: 'PROBABLE', actionContient: 'confirmer' },
      { garantieId: 'RECOURS_VOISINS_TIERS', niveau: 'PROBABLE' },
      { garantieId: 'RC_EXPLOITATION', niveau: 'PROBABLE' },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-37',
    intitule: 'Aucune pièce, bail exigeant',
    enjeu:
      'Cinq garanties exigées, rien pour les vérifier. Le moteur doit dire « non démontré » cinq fois, et jamais « non assuré ».',
    varietes: [Variete.CONTRAT_ABSENT],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur garantira les risques locatifs, le recours des voisins et des tiers, sa responsabilité civile exploitation, ses marchandises et sa perte d’exploitation.`,
    contrat: null,
    attestation: null,
    garanties: [
      { garantieId: 'RISQUES_LOCATIFS', niveau: 'NON_DEMONTREE', actionContient: 'Réclamer' },
      { garantieId: 'RECOURS_VOISINS_TIERS', niveau: 'NON_DEMONTREE' },
      { garantieId: 'RC_EXPLOITATION', niveau: 'NON_DEMONTREE' },
      { garantieId: 'MOBILIER_MATERIEL_MARCHANDISES', niveau: 'NON_DEMONTREE' },
      { garantieId: 'PERTE_EXPLOITATION', niveau: 'NON_DEMONTREE' },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-38',
    intitule: 'Contrat complet, aucune attestation',
    enjeu:
      'L’attestation n’est pas nécessaire pour établir une couverture : elle sert à la démontrer au tiers. Son absence ne dégrade pas la preuve.',
    varietes: [Variete.BAIL_SIMPLE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur devra être garanti au titre des risques locatifs pendant toute la durée du bail.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [
      { garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE', actionContient: 'Point clos' },
    ],
    interdites: [],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-39',
    intitule: 'Bail muet, police riche',
    enjeu:
      'Rien n’est exigé, tout est souscrit. Le moteur ne doit pas déduire une obligation d’une garantie : ce serait inventer une exigence à partir de la police.',
    varietes: [Variete.BAIL_MUET],
    figeLe: '2026-08-22',
    bail: `ARTICLE 1 — DÉSIGNATION
Les locaux loués comprennent un entrepôt de 800 mètres carrés.

ARTICLE 2 — LOYER
Le loyer annuel est fixé à 48 000 € hors taxes.`,
    contrat: `CONDITIONS PARTICULIÈRES
Site assuré : zone industrielle des Vignes
Responsabilité locative : 1 500 000 €.
Recours des voisins et des tiers : 1 500 000 €.
Responsabilité civile exploitation : 8 000 000 €.
Perte d’exploitation : douze mois.`,
    attestation: null,
    garanties: [],
    interdites: [
      'RISQUES_LOCATIFS',
      'RECOURS_VOISINS_TIERS',
      'RC_EXPLOITATION',
      'PERTE_EXPLOITATION',
      'ASSURANCE_IMMEUBLE_BAILLEUR',
    ],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-40',
    intitule: 'Bail muet, aucune pièce',
    enjeu:
      'Le dossier vide. Tout ce que le moteur produirait ici serait inventé — c’est le test du silence.',
    varietes: [Variete.BAIL_MUET, Variete.CONTRAT_ABSENT],
    figeLe: '2026-08-22',
    bail: `ARTICLE 1 — DÉSIGNATION
Un local de 60 mètres carrés au rez-de-chaussée.

ARTICLE 2 — DURÉE
Le bail est consenti pour neuf années.`,
    contrat: null,
    attestation: null,
    garanties: [],
    interdites: [
      'RISQUES_LOCATIFS',
      'ASSURANCE_IMMEUBLE_BAILLEUR',
      'RENONCIATION_RECOURS',
      'CAPITAUX_ASSURES',
      'FRANCHISE',
    ],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-41',
    intitule: 'L’attestation contredit le contrat sur le montant',
    enjeu:
      'Deux pièces d’assurance, deux montants. C’est le contrat qui fait foi, et l’écart entre les deux est un point à signaler, pas à arbitrer en silence.',
    varietes: [Variete.ATTESTATION_PARTIELLE, Variete.PLAFOND_INSUFFISANT],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur garantira les risques locatifs à hauteur de 2 000 000 € au minimum.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 2 000 000 € par sinistre.`,
    attestation: `ATTESTATION D’ASSURANCE
Risques locatifs : 800 000 € par sinistre.`,
    garanties: [{ garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' }],
    interdites: [],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-42',
    intitule: 'Le contrat couvre un autre site',
    enjeu:
      'Toutes les garanties sont là, sur une adresse qui n’est pas celle du bail. Le périmètre documentaire est la première question, avant toute garantie.',
    varietes: [Variete.BAIL_SIMPLE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 1 — DÉSIGNATION
Les locaux loués sont situés à Roubaix, 8 rue de l’Épeule.

ARTICLE 12 — ASSURANCES
Le Preneur garantira les risques locatifs.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [{ garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' }],
    interdites: [],
    incoherences: [],
    // La police ne dit pas quel site elle assure : DOC-02 ne peut pas être
    // rapproché, et c'est bien un écart de périmètre documentaire.
    ecarts: ['DOC-02'],
  },
]
