/**
 * Dix dossiers d'audit — le banc d'essai de la fiabilité.
 *
 * Chaque dossier porte son résultat ATTENDU, écrit avant que le moteur ne
 * tourne. C'est la seule façon de mesurer autre chose que la capacité du
 * moteur à se confirmer lui-même : si l'attendu est déduit de la sortie, le
 * test ne prouve rien.
 *
 * Ils sont volontairement dissemblables — rédaction canonique, vocabulaire
 * d'assureur, bail muet, bail contradictoire, police généreuse, attestation
 * partielle, faux amis lexicaux — parce qu'un moteur ne se juge pas sur le cas
 * qu'il a été écrit pour traiter.
 *
 * Toutes les rédactions sont SYNTHÉTIQUES (§5.4, §13). Aucun document client,
 * sous aucune forme, y compris anonymisé.
 */
import type { NiveauPreuve } from '../../garanties/types'

export type AttenduGarantie = {
  readonly garantieId: string
  readonly niveau: keyof typeof NIVEAUX
  /** Fragment que l'extrait cité doit contenir. Vérifie l'ancrage, pas le statut. */
  readonly extraitContient?: string
  /** Fragment que la recommandation doit contenir. */
  readonly actionContient?: string
}

/** Les niveaux, en clair, pour que l'attendu se lise sans ouvrir le moteur. */
const NIVEAUX = {
  ETABLIE: 'ETABLIE',
  JUSTIFICATION_INSUFFISANTE: 'JUSTIFICATION_INSUFFISANTE',
  PROBABLE: 'PROBABLE',
  NON_DEMONTREE: 'NON_DEMONTREE',
  ECART_CONFIRME: 'ECART_CONFIRME',
} as const satisfies Record<NiveauPreuve, string>

export type DossierAudit = {
  readonly id: string
  readonly intitule: string
  /** Ce que le cas met à l'épreuve, en une phrase. */
  readonly enjeu: string
  readonly bail: string
  readonly contrat: string | null
  readonly attestation: string | null
  /** Garanties attendues, avec leur niveau de preuve. */
  readonly garanties: readonly AttenduGarantie[]
  /** Garanties qu'il serait FAUX de reconnaître ici. */
  readonly interdites: readonly string[]
  /** Identifiants de règles de cohérence attendues. */
  readonly incoherences: readonly string[]
  /**
   * Contrôles attendus en ÉCART, exactement.
   *
   * Verrouille le niveau des CONTRÔLES, pas seulement celui des garanties : un
   * écart qui apparaît ou disparaît sans qu'on l'ait voulu est une régression,
   * même si le rapprochement, lui, n'a pas bougé.
   */
  readonly ecarts: readonly string[]
}

export const DOSSIERS_AUDIT: readonly DossierAudit[] = [
  {
    id: 'AUD-01',
    intitule: 'Bail canonique, police qui répond en vocabulaire d’assureur',
    enjeu:
      'Le cas nominal, et le piège d’origine : le bail décrit des événements, la police nomme une garantie.',
    bail: `ARTICLE 12 — ASSURANCES DU PRENEUR
Le Preneur devra assurer les locaux loués contre l’incendie, l’explosion et les dégâts des eaux.
Le Preneur garantira également le recours des voisins et des tiers.
Le Preneur justifiera d’une responsabilité civile exploitation.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative (risques locatifs) : 1 500 000 € par sinistre.
Recours des voisins et des tiers : 1 500 000 € par sinistre.
Responsabilité civile exploitation : 8 000 000 € par sinistre.`,
    attestation: null,
    garanties: [
      { garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE', extraitContient: 'locaux loués' },
      { garantieId: 'RECOURS_VOISINS_TIERS', niveau: 'ETABLIE' },
      { garantieId: 'RC_EXPLOITATION', niveau: 'ETABLIE' },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR', 'MOBILIER_MATERIEL_MARCHANDISES'],
    incoherences: [],
    // GAR-02 : le bail dit « assurer les locaux » sans qualifier l'obligation.
    // L'écart porte sur la rédaction, pas sur la couverture — qui est acquise.
    ecarts: ['GAR-02'],
  },
  {
    id: 'AUD-02',
    intitule: 'Transfert caractérisé — l’immeuble du bailleur à la charge du preneur',
    enjeu: 'Le seul cas où l’alerte critique est justifiée, et où souscrire serait le mauvais conseil.',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur assurera l’immeuble appartenant au Bailleur, en ce compris la structure, le clos et le couvert, pour sa valeur de reconstruction.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'ASSURANCE_IMMEUBLE_BAILLEUR',
        niveau: 'ECART_CONFIRME',
        extraitContient: 'immeuble appartenant au Bailleur',
        // Ne jamais proposer de souscrire : ce serait faire financer au preneur
        // un bien qui n'est pas le sien.
        actionContient: 'Ne pas chiffrer d’extension',
      },
    ],
    interdites: ['RISQUES_LOCATIFS'],
    incoherences: [],
    ecarts: ['DAB-01'],
  },
  {
    id: 'AUD-03',
    intitule: 'Garantie présente mais insuffisante',
    enjeu: 'Trouver le bon libellé ne suffit pas : c’est l’écart le plus courant, et le plus silencieux.',
    bail: `ARTICLE 12 — ASSURANCES
Les capitaux assurés seront maintenus à hauteur de 2 400 000 € pour le contenu professionnel.`,
    contrat: `CONDITIONS PARTICULIÈRES
Capitaux assurés : 900 000 €.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'CAPITAUX_ASSURES',
        niveau: 'ECART_CONFIRME',
        actionContient: 'constater la modalité réelle',
      },
    ],
    interdites: [],
    incoherences: [],
    ecarts: ['DAB-04'],
  },
  {
    id: 'AUD-04',
    intitule: 'Attestation muette sur une garantie que le contrat porte',
    enjeu: 'Ni conformité ni écart : un courriel au courtier, pas un avenant.',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur fera garantir la perte d’exploitation pendant douze mois.`,
    contrat: `CONDITIONS PARTICULIÈRES
Perte d’exploitation : marge brute garantie pendant douze mois.`,
    attestation: `ATTESTATION D’ASSURANCE
Garanties mentionnées : responsabilité civile exploitation, recours des voisins et des tiers.`,
    garanties: [
      {
        garantieId: 'PERTE_EXPLOITATION',
        niveau: 'JUSTIFICATION_INSUFFISANTE',
        actionContient: 'attestation',
      },
    ],
    interdites: [],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-05',
    intitule: 'Attestation seule, sans conditions particulières',
    enjeu:
      'Une attestation prouve qu’un contrat existe, pas ce qu’il couvre. Le moteur ne doit pas conclure à la conformité.',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur devra assurer les locaux loués contre l’incendie et les dégâts des eaux.`,
    contrat: null,
    attestation: `ATTESTATION D’ASSURANCE
Garanties mentionnées : risques locatifs, recours des voisins et des tiers.`,
    garanties: [
      {
        garantieId: 'RISQUES_LOCATIFS',
        niveau: 'PROBABLE',
        actionContient: 'confirmer',
      },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: ['GAR-02'],
  },
  {
    id: 'AUD-06',
    intitule: 'Aucune pièce d’assurance',
    enjeu: '« Absent » n’est pas « non démontré » : sans pièce, on ne conclut pas à une absence.',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur garantira les risques locatifs et le recours des voisins et des tiers.`,
    contrat: null,
    attestation: null,
    garanties: [
      { garantieId: 'RISQUES_LOCATIFS', niveau: 'NON_DEMONTREE', actionContient: 'Réclamer' },
      { garantieId: 'RECOURS_VOISINS_TIERS', niveau: 'NON_DEMONTREE' },
    ],
    interdites: [],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-07',
    intitule: 'RC occupant en réponse à une exigence de risques locatifs',
    enjeu:
      'Réclamer la ligne exacte serait réclamer un mot. Mais l’équivalence ne s’affirme pas non plus.',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur garantira les risques locatifs.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité civile occupant : 3 000 000 € par sinistre.`,
    attestation: null,
    garanties: [
      { garantieId: 'RISQUES_LOCATIFS', niveau: 'PROBABLE', actionContient: 'confirmer' },
    ],
    interdites: [],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-08',
    intitule: 'Faux amis lexicaux',
    enjeu:
      'Le défaut d’origine : « mobilier » dans « immobilier », « par sinistre » pris pour un capital.',
    bail: `ARTICLE 13 — RENONCIATION À RECOURS
Le Preneur renonce à tout recours contre les autres locataires de l’ensemble immobilier.
Les biens immobiliers demeurent la propriété du Bailleur.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité civile exploitation : 8 000 000 € par sinistre.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'RENONCIATION_RECOURS',
        niveau: 'ECART_CONFIRME',
        // Jamais l'intitulé de l'article : une stipulation, ou rien.
        extraitContient: 'Le Preneur renonce',
        // Attendu corrigé après audit : j'avais écrit l'action générique de la
        // catégorie MÉCANISME, alors que la renonciation à recours porte la
        // sienne, plus précise. Le moteur avait raison.
        actionContient: 'renonciation à recours de l’assureur',
      },
    ],
    interdites: ['MOBILIER_MATERIEL_MARCHANDISES', 'CAPITAUX_ASSURES'],
    // Attendu corrigé après audit : le bail organise une renonciation, la
    // police est muette dessus. COH-05 a raison de le signaler — je l'avais
    // oublié en écrivant le cas.
    incoherences: ['COH-05'],
    // RR-01 : la renonciation est unilatérale. RR-03 : elle s'étend aux autres
    // locataires, qui sont des tiers au bail. Les deux sont fondés.
    ecarts: ['RR-01', 'RR-03'],
  },
  {
    id: 'AUD-09',
    intitule: 'Bail contradictoire — immeuble assuré des deux côtés',
    enjeu: 'Chaque clause est acceptable seule ; leur coexistence ne l’est pas.',
    bail: `ARTICLE 12 — ASSURANCES DU PRENEUR
Le Preneur assurera l’immeuble, la structure et le clos et le couvert.

ARTICLE 17 — ASSURANCES DU BAILLEUR
Le Bailleur souscrit une police garantissant l’immeuble contre l’incendie.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 €.`,
    attestation: null,
    garanties: [{ garantieId: 'ASSURANCE_IMMEUBLE_BAILLEUR', niveau: 'ECART_CONFIRME' }],
    interdites: [],
    incoherences: ['COH-03'],
    ecarts: ['DAB-01'],
  },
  {
    id: 'AUD-10',
    intitule: 'Bail muet sur l’assurance',
    enjeu:
      'Rien à trouver. Le moteur doit se taire plutôt que d’inventer une exigence — le faux positif le plus coûteux.',
    bail: `ARTICLE 1 — DÉSIGNATION
Les locaux loués comprennent un atelier de 110 mètres carrés.

ARTICLE 2 — DESTINATION
Les locaux sont destinés à l’activité d’ébénisterie.

ARTICLE 3 — LOYER
Le loyer annuel est fixé à 24 000 € hors taxes, payable trimestriellement.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité civile exploitation : 8 000 000 € par sinistre.`,
    attestation: null,
    garanties: [],
    interdites: [
      'RISQUES_LOCATIFS',
      'ASSURANCE_IMMEUBLE_BAILLEUR',
      'MOBILIER_MATERIEL_MARCHANDISES',
      'RENONCIATION_RECOURS',
      'CAPITAUX_ASSURES',
    ],
    incoherences: [],
    // Le bail ne parle pas d'assurance, mais il DÉSIGNE les locaux et DÉCLARE
    // une activité, quand la police n'en porte aucune. Un courtier le relève :
    // il ne peut pas vérifier que le risque assuré est celui du bail.
    ecarts: ['DOC-02', 'DOC-03'],
  },
]
