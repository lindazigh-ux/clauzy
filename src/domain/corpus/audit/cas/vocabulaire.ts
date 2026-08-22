/**
 * Les MOTS (brief §13 : synonymes assureurs, faux amis lexicaux, négations,
 * exceptions).
 *
 * C'est le cœur de la proposition de valeur : « des formulations juridiques et
 * assurantielles différentes désignent le même risque » (§0). Le revers est
 * aussi vrai — des formulations proches désignent des choses différentes, et
 * une négation ou une exception dans la même phrase renverse le sens.
 *
 * Attendus écrits avant exécution, figés le 22 août 2026.
 */
import type { DossierAudit } from '../types'
import { Variete } from '../varietes'

export const VOCABULAIRE: readonly DossierAudit[] = [
  {
    id: 'AUD-19',
    intitule: 'La police répond sous un intitulé de produit',
    enjeu:
      'Le tableau de garanties d’une multirisque ne reprend jamais les mots du bail. Chercher le libellé exact, c’est réclamer une garantie déjà souscrite.',
    varietes: [Variete.SYNONYME_ASSUREUR],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur souscrira une garantie des risques locatifs et une garantie du recours des voisins et des tiers.`,
    contrat: `CONTRAT MULTIRISQUE PROFESSIONNELLE
Garanties de base : responsabilité locative et recours des voisins.
Montant : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [
      { garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' },
      { garantieId: 'RECOURS_VOISINS_TIERS', niveau: 'ETABLIE' },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-20',
    intitule: 'Négation — « le Preneur n’est pas tenu d’assurer l’immeuble »',
    enjeu:
      'La phrase contient tous les mots d’un transfert abusif, et dit exactement l’inverse. Une négation ignorée produit l’alerte la plus grave du référentiel sur une clause protectrice.',
    varietes: [Variete.NEGATION],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur garantira les risques locatifs.
Le Preneur n’est pas tenu d’assurer l’immeuble, dont l’assurance demeure à la charge du Bailleur.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [{ garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' }],
    // Le cœur du cas : la clause EXONÈRE le preneur. En faire une exigence
    // serait le faux positif le plus coûteux du référentiel.
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-21',
    intitule: 'Exception — « à l’exception des biens appartenant au Bailleur »',
    enjeu:
      'La clause commence en transfert total et se termine en clause protectrice. Lire la première moitié seulement inverse la conclusion.',
    varietes: [Variete.EXCEPTION],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur assurera l’ensemble des biens garnissant les locaux, à l’exception des biens appartenant au Bailleur.`,
    contrat: `CONDITIONS PARTICULIÈRES
Contenu professionnel : 400 000 €.
Mobilier et matériel : inclus.`,
    attestation: null,
    garanties: [{ garantieId: 'DOMMAGES_BIENS_PRENEUR', niveau: 'ETABLIE' }],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    // La clause distingue expressément les biens du bailleur : DAB-07, qui
    // sanctionne l'absence de distinction, n'a pas lieu d'être.
    ecarts: [],
  },
  {
    id: 'AUD-22',
    intitule: 'Faux ami — « immobilisations » n’est pas « immeuble »',
    enjeu:
      'Un mot qui contient un autre mot. « Immobilisations corporelles » désigne le matériel du preneur, jamais le bâtiment du bailleur.',
    varietes: [Variete.FAUX_AMI_LEXICAL],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur assurera ses immobilisations corporelles ainsi que ses stocks.`,
    contrat: `CONDITIONS PARTICULIÈRES
Contenu professionnel : 400 000 €.
Marchandises et stocks : 150 000 €.`,
    attestation: null,
    garanties: [{ garantieId: 'MOBILIER_MATERIEL_MARCHANDISES', niveau: 'ETABLIE' }],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-23',
    intitule: 'La police dit le contraire de ce que le bail exige',
    enjeu:
      'Le bail exige la valeur à neuf, la police indemnise vétusté déduite. Les deux emploient le vocabulaire de la vétusté : l’un l’écarte, l’autre l’applique.',
    varietes: [Variete.FAUX_AMI_LEXICAL, Variete.PLAFOND_INSUFFISANT],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Les biens seront assurés en valeur à neuf, sans déduction de vétusté.`,
    contrat: `CONDITIONS PARTICULIÈRES
Indemnisation en valeur vénale, vétusté déduite.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'VALEUR_A_NEUF',
        niveau: 'ECART_CONFIRME',
        extraitContient: 'valeur à neuf',
      },
    ],
    interdites: [],
    incoherences: [],
    ecarts: ['GAR-05'],
    historique: [
      {
        le: '2026-08-22',
        quoi: 'Contrôles attendus en écart : DAB-04 et GAR-05 → GAR-05 seul.',
        pourquoi:
          'DAB-04 porte sur les capitaux et les valeurs assurées, pas sur la modalité d’indemnisation. La valeur à neuf est le sujet de GAR-05, et le doublon aurait fait lire deux fois le même point au courtier. Mon attendu confondait deux contrôles.',
      },
    ],
  },
  {
    id: 'AUD-24',
    intitule: 'Le bail énumère des événements, la police les regroupe',
    enjeu:
      'Le cas fondateur du brief, en plus large : quatre événements nommés d’un côté, une ligne « événements garantis » de l’autre.',
    varietes: [Variete.SYNONYME_ASSUREUR],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur assurera les locaux loués contre l’incendie, l’explosion, les dégâts des eaux et la tempête.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative — événements garantis : incendie, explosion, dégâts des eaux, tempête, catastrophes naturelles.
Montant : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [{ garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' }],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    // La couverture est acquise ; la rédaction du bail ne qualifie toujours pas
    // l'obligation.
    ecarts: ['GAR-02'],
  },
  {
    id: 'AUD-25',
    intitule: 'Renonciation réciproque, avec engagement des assureurs',
    enjeu:
      'La rédaction correcte. Un moteur qui alerte ici n’apprend rien au courtier : il lui fait revérifier ce qui est déjà bien écrit.',
    varietes: [Variete.RENONCIATION_COMPLEXE, Variete.EXCEPTION],
    figeLe: '2026-08-22',
    bail: `ARTICLE 13 — RENONCIATION À RECOURS
Le Bailleur et le Preneur renoncent réciproquement à tout recours l’un contre l’autre pour les dommages garantis par leurs polices.
Les assureurs respectifs des parties renonceront dans les mêmes termes.`,
    contrat: `CONDITIONS PARTICULIÈRES
Renonciation à recours réciproque contre le bailleur : acquise.
L’assureur renonce à son recours subrogatoire dans les mêmes limites.`,
    attestation: null,
    garanties: [{ garantieId: 'RENONCIATION_RECOURS', niveau: 'ETABLIE' }],
    interdites: [],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-26',
    intitule: 'Le bail interdit la franchise, la police en porte une',
    enjeu:
      'Une promesse que la police ne tient pas. Le preneur découvre au sinistre qu’il doit rembourser au bailleur ce que l’assureur retient.',
    varietes: [Variete.FRANCHISE, Variete.NEGATION],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur garantira les risques locatifs sans pouvoir opposer au Bailleur la moindre franchise.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.
Franchise : 1 500 € par sinistre.`,
    attestation: null,
    garanties: [
      { garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' },
      {
        garantieId: 'FRANCHISE',
        niveau: 'ECART_CONFIRME',
        limiteConnue:
          'Le moteur reconnaît la franchise des deux côtés et conclut à une couverture établie. Il ne sait pas encore qu’une franchise EXIGÉE À ZÉRO et une franchise SOUSCRITE sont contradictoires : la comparaison chiffrée n’a rien à comparer, faute de montant côté bail. DAB-05 rattrape le point ; le rapprochement, non.',
      },
    ],
    interdites: [],
    incoherences: [],
    ecarts: ['DAB-05'],
  },
]
