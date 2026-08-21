/**
 * Batterie de cas metier — le garde-fou du moteur.
 *
 * Le principe est celui du test anti-fuite du lot L0 : on ecrit d'abord ce que
 * le moteur DOIT savoir distinguer, et le moteur n'est pas valide tant qu'il
 * echoue. Ces cas ne sont pas des exemples d'interface : ce sont les questions
 * qu'un courtier IARD pose devant une clause, et dont la reponse ne se devine
 * pas au mot-a-mot.
 *
 * Chaque cas dit trois choses :
 *   - ce qu'un courtier LIT dans la stipulation (`attendues`) ;
 *   - ce qu'il ne doit SURTOUT PAS y lire (`interdites`) — c'est la moitie qui
 *     compte, et celle que le mot-a-mot rate ;
 *   - pourquoi, en une phrase citable dans une revue de moteur (`pourquoi`).
 *
 * Toutes les redactions sont SYNTHETIQUES (§5.4, §13). Aucun extrait de
 * document client, sous quelque forme que ce soit, y compris anonymise.
 *
 * Ajouter un cas ici est la bonne facon de signaler un defaut d'analyse : le
 * cas echoue, le moteur se corrige, et la regression devient impossible.
 */
import type { Beneficiaire } from './types'

export type CasMetier = {
  readonly id: string
  readonly intitule: string
  /** Cote du document ou la stipulation se lit. */
  readonly cote: 'OBLIGATION' | 'COUVERTURE'
  readonly texte: string
  /** Identifiants de garanties qu'un courtier reconnait ici. */
  readonly attendues: readonly string[]
  /** Identifiants qu'il serait FAUX de reconnaitre. */
  readonly interdites: readonly string[]
  readonly pourquoi: string
  /** Beneficiaire reel de la garantie principale, quand le cas s'y prete. */
  readonly beneficiaire?: Beneficiaire
}

export const CAS_METIER: readonly CasMetier[] = [
  // -------------------------------------------------------------------
  // Le cas fondateur : risques locatifs contre assurance de l'immeuble
  // -------------------------------------------------------------------
  {
    id: 'LOC-01',
    intitule: 'La clause d’assurance la plus banale d’un bail commercial',
    cote: 'OBLIGATION',
    texte:
      'Le Preneur devra assurer les locaux loués contre l’incendie, l’explosion et les dégâts des eaux.',
    attendues: ['RISQUES_LOCATIFS'],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    pourquoi:
      'C’est une obligation de responsabilité locative, au sens des articles 1732 à 1735 du Code civil. La lire comme une obligation d’assurer l’immeuble du bailleur invente un transfert de risque que le bail ne stipule pas, et fait remonter un écart critique là où il n’y en a pas.',
  },
  {
    id: 'LOC-02',
    intitule: 'Les risques locatifs, nommés',
    cote: 'OBLIGATION',
    texte:
      'Le Preneur souscrira une police garantissant les risques locatifs ainsi que le recours des voisins et des tiers.',
    attendues: ['RISQUES_LOCATIFS', 'RECOURS_VOISINS_TIERS'],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    pourquoi: 'Rédaction canonique. Si le moteur la rate, il ne sait rien lire du tout.',
  },
  {
    id: 'LOC-03',
    intitule: 'Le vrai transfert : l’immeuble du bailleur à la charge du preneur',
    cote: 'OBLIGATION',
    texte:
      'Le Preneur assurera l’immeuble appartenant au Bailleur, en ce compris la structure, le clos et le couvert, pour sa valeur de reconstruction.',
    attendues: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    interdites: ['RISQUES_LOCATIFS'],
    pourquoi:
      'Ici le transfert est caractérisé : le bail met à la charge du preneur une assurance de choses sur un bien dont il n’est pas propriétaire. C’est le cas où l’alerte critique est justifiée — et le seul.',
  },
  {
    id: 'LOC-04',
    intitule: 'Une police qui répond en vocabulaire d’assureur',
    cote: 'COUVERTURE',
    texte: 'Garantie responsabilité locative (risques locatifs) : 1 500 000 € par sinistre.',
    attendues: ['RISQUES_LOCATIFS'],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    pourquoi:
      'Le bail écrit « assurer les locaux contre l’incendie », la police écrit « responsabilité locative ». Le même risque, deux vocabulaires : c’est précisément ce que la nomenclature doit réconcilier.',
  },
  {
    id: 'LOC-05',
    intitule: 'La RC occupant, qui englobe les deux',
    cote: 'COUVERTURE',
    texte: 'Responsabilité civile occupant : 3 000 000 € par sinistre, incendie, explosion, dégâts des eaux.',
    attendues: ['RC_OCCUPANT'],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    pourquoi:
      'Une exigence de risques locatifs est satisfaite par une RC occupant, sans qu’une ligne « risques locatifs » figure au tableau. Réclamer la ligne serait réclamer un mot, pas une couverture.',
  },

  // -------------------------------------------------------------------
  // Responsabilites : ne pas confondre les trois
  // -------------------------------------------------------------------
  {
    id: 'RCX-01',
    intitule: 'Le recours des voisins n’est pas la RC exploitation',
    cote: 'OBLIGATION',
    texte:
      'Le Preneur garantira les dommages causés aux voisins et aux tiers par un sinistre survenu dans les lieux loués.',
    attendues: ['RECOURS_VOISINS_TIERS'],
    interdites: ['RC_EXPLOITATION', 'RISQUES_LOCATIFS'],
    pourquoi:
      'Le recours des voisins et des tiers répare la propagation d’un sinistre du bâtiment. La RC exploitation répare les dommages de l’activité. Confondre les deux mène à valider une exigence avec la mauvaise ligne de police.',
  },
  {
    id: 'RCX-02',
    intitule: 'La RC exploitation n’est pas le recours des voisins',
    cote: 'OBLIGATION',
    texte:
      'Le Preneur justifiera d’une responsabilité civile exploitation couvrant les conséquences pécuniaires des dommages causés aux tiers du fait de son activité.',
    attendues: ['RC_EXPLOITATION'],
    interdites: ['RECOURS_VOISINS_TIERS', 'RISQUES_LOCATIFS'],
    pourquoi: 'Symétrique du cas précédent : la confusion se produit dans les deux sens.',
  },

  // -------------------------------------------------------------------
  // Biens : propriete, pas localisation
  // -------------------------------------------------------------------
  {
    id: 'BIE-01',
    intitule: 'Les agencements du preneur ne sont pas l’immeuble du bailleur',
    cote: 'OBLIGATION',
    texte:
      'Le Preneur assurera ses aménagements, agencements et embellissements pour leur valeur de remplacement.',
    attendues: ['AGENCEMENTS_AMENAGEMENTS'],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    pourquoi:
      'Un agencement fixé à demeure ressemble à de l’immobilier, mais tant que le bail court il reste au risque du preneur qui l’a financé. C’est la propriété qui départage, pas la fixation au sol.',
  },
  {
    id: 'BIE-02',
    intitule: 'Le contenu mobilier, sans ambiguïté',
    cote: 'OBLIGATION',
    texte:
      'Le Preneur assurera son mobilier, son matériel professionnel et ses marchandises contre les événements garantis.',
    attendues: ['MOBILIER_MATERIEL_MARCHANDISES'],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR', 'RISQUES_LOCATIFS'],
    pourquoi:
      'Assurer ses propres biens n’est ni une responsabilité, ni un transfert : c’est une assurance de choses ordinaire.',
  },

  // -------------------------------------------------------------------
  // Pertes financieres : deux victimes, deux garanties
  // -------------------------------------------------------------------
  {
    id: 'PER-01',
    intitule: 'La perte de loyers du bailleur',
    cote: 'OBLIGATION',
    texte:
      'Le Preneur fera garantir, au profit du Bailleur, la perte des loyers et charges pour une durée de vingt-quatre mois.',
    attendues: ['PERTE_LOYERS'],
    interdites: ['PERTE_EXPLOITATION'],
    pourquoi:
      'Le bailleur perd des loyers, le preneur perd une marge. Deux victimes, deux garanties, deux périodes d’indemnisation à comparer séparément.',
  },
  {
    id: 'PER-02',
    intitule: 'La perte d’exploitation du preneur',
    cote: 'COUVERTURE',
    texte: 'Pertes d’exploitation — marge brute : période d’indemnisation douze mois, franchise trois jours ouvrés.',
    attendues: ['PERTE_EXPLOITATION', 'FRANCHISE'],
    interdites: ['PERTE_LOYERS'],
    pourquoi:
      'Répondre à une exigence de perte de loyers par une ligne de perte d’exploitation revient à valider une couverture qui profite à la mauvaise partie.',
  },

  // -------------------------------------------------------------------
  // Mecanismes
  // -------------------------------------------------------------------
  {
    id: 'MEC-01',
    intitule: 'La renonciation à recours, côté bail',
    cote: 'OBLIGATION',
    texte:
      'Le Bailleur et le Preneur renoncent réciproquement à tous recours l’un contre l’autre et s’engagent à faire renoncer leurs assureurs respectifs.',
    attendues: ['RENONCIATION_RECOURS'],
    interdites: ['RECOURS_VOISINS_TIERS'],
    pourquoi:
      'Renoncer à recours contre son cocontractant ne dit rien des tiers. Le rapprochement avec la garantie « recours des voisins et des tiers » serait un contresens complet.',
  },
  {
    id: 'MEC-02',
    intitule: 'L’assurance pour compte désigne un bénéficiaire, elle n’étend rien',
    cote: 'COUVERTURE',
    texte: 'La présente police est souscrite pour le compte de qui il appartiendra.',
    attendues: ['ASSURANCE_POUR_COMPTE'],
    interdites: ['RENONCIATION_RECOURS'],
    pourquoi:
      'Elle change qui touche l’indemnité, pas ce qui est garanti. La présenter comme une extension de couverture serait trompeur.',
  },

  // -------------------------------------------------------------------
  // Modalites : ne jamais les prendre pour des garanties
  // -------------------------------------------------------------------
  {
    id: 'MOD-01',
    intitule: 'La valeur à neuf n’est pas une garantie',
    cote: 'COUVERTURE',
    texte: 'Indemnisation en valeur à neuf, sans déduction de vétusté.',
    attendues: ['VALEUR_A_NEUF'],
    interdites: ['DOMMAGES_BIENS_PRENEUR', 'ASSURANCE_IMMEUBLE_BAILLEUR'],
    pourquoi:
      'Une modalité d’indemnisation ne crée aucune couverture. Un bien non assuré ne le devient pas parce que la police indemnise en valeur à neuf.',
  },
]

export const CAS_PAR_ID: ReadonlyMap<string, CasMetier> = new Map(
  CAS_METIER.map((cas) => [cas.id, cas]),
)
