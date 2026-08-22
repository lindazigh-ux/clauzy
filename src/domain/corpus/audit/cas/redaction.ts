/**
 * Comment le bail est ÉCRIT (brief §13 : bail simple, bail long, clauses
 * imbriquées, formulations anciennes).
 *
 * Un moteur qui ne trouve l'obligation que dans un article intitulé
 * « ASSURANCES », rédigé au présent et en une phrase, ne sert à rien : les
 * baux réels la logent dans une énumération, dans une annexe, dans un article
 * 9 sur douze, ou l'écrivent à l'ancienne. La substance ne change pas.
 *
 * Attendus écrits avant exécution, figés le 22 août 2026.
 */
import type { DossierAudit } from '../types'
import { Variete } from '../varietes'

export const REDACTION: readonly DossierAudit[] = [
  {
    id: 'AUD-11',
    intitule: 'Bail long — l’obligation dort à l’article 9 sur douze',
    enjeu:
      'Onze articles ne parlent pas d’assurance. Le moteur doit trouver le douzième sans se laisser distraire par les onze autres.',
    varietes: [Variete.BAIL_LONG],
    figeLe: '2026-08-22',
    bail: `Entre les soussignés, la SCI DES PEUPLIERS, Bailleur, et la SAS ATELIER NORD, Preneur, il a été convenu ce qui suit.

ARTICLE 1 — DÉSIGNATION
Les locaux loués comprennent un plateau de bureaux de 240 mètres carrés au deuxième étage.

ARTICLE 2 — DESTINATION
Les locaux sont destinés à l’activité de conseil en organisation.

ARTICLE 3 — DURÉE
Le bail est consenti pour une durée de neuf années entières et consécutives.

ARTICLE 4 — LOYER
Le loyer annuel est fixé à 96 000 € hors taxes, payable d’avance et par trimestre.

ARTICLE 5 — CHARGES
Les charges locatives sont refacturées au Preneur au prorata des surfaces occupées.

ARTICLE 6 — DÉPÔT DE GARANTIE
Un dépôt de garantie égal à trois mois de loyer est versé à la signature.

ARTICLE 7 — ENTRETIEN
Le Preneur entretiendra les lieux en bon état pendant toute la durée du bail.

ARTICLE 8 — TRAVAUX
Le Preneur ne pourra réaliser aucun travaux sans l’accord écrit préalable du Bailleur.

ARTICLE 9 — ASSURANCES
Le Preneur souscrira une garantie des risques locatifs auprès d’une compagnie d’assurance.

ARTICLE 10 — CESSION
La cession du bail est soumise à l’agrément préalable du Bailleur.

ARTICLE 11 — ÉTAT DES LIEUX
Un état des lieux contradictoire est dressé à l’entrée et à la sortie.

ARTICLE 12 — ÉLECTION DE DOMICILE
Les parties élisent domicile en leurs sièges respectifs.`,
    contrat: `CONDITIONS PARTICULIÈRES
Assuré : SAS ATELIER NORD
Site assuré : 14 rue des Peupliers, 59000 Lille — plateau de bureaux
Activité assurée : conseil en organisation
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'RISQUES_LOCATIFS',
        niveau: 'ETABLIE',
        extraitContient: 'garantie des risques locatifs',
      },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR', 'MOBILIER_MATERIEL_MARCHANDISES', 'RENONCIATION_RECOURS'],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-12',
    intitule: 'Formulation ancienne, mais obligation qualifiée',
    enjeu:
      '« S’oblige à faire assurer… à concurrence de… » dit exactement la même chose que la rédaction moderne, et la clause NOMME la garantie.',
    varietes: [Variete.FORMULATION_ANCIENNE, Variete.BAIL_SIMPLE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 9 — ASSURANCES
Le Preneur s’oblige à faire assurer les locaux loués contre les risques locatifs, à concurrence de leur valeur, auprès d’une compagnie notoirement solvable.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'RISQUES_LOCATIFS',
        niveau: 'ETABLIE',
        extraitContient: 'faire assurer les locaux loués',
      },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    // La clause dit « contre les risques locatifs » : elle EST qualifiée.
    // GAR-02 ne doit pas la traiter comme une rédaction ambiguë.
    ecarts: [],
  },
  {
    id: 'AUD-13',
    intitule: 'L’obligation au point c) d’une énumération',
    enjeu:
      'La clause vit dans une liste d’obligations générales du preneur, entre le paiement du loyer et le droit de visite.',
    varietes: [Variete.CLAUSES_IMBRIQUEES],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — OBLIGATIONS DU PRENEUR
Le Preneur devra :
a) payer le loyer aux échéances convenues ;
b) entretenir les lieux en bon état ;
c) assurer les locaux loués contre l’incendie, l’explosion et les dégâts des eaux ;
d) laisser visiter les lieux en cas de mise en vente.`,
    contrat: `CONDITIONS PARTICULIÈRES
Risques locatifs : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'RISQUES_LOCATIFS',
        niveau: 'ETABLIE',
        extraitContient: 'assurer les locaux loués',
      },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    // « assurer les locaux » sans qualifier : la couverture est acquise, la
    // rédaction reste à corriger.
    ecarts: ['GAR-02'],
  },
  {
    id: 'AUD-14',
    intitule: 'La stipulation écrite sur la ligne de titre',
    enjeu:
      'Beaucoup de baux écrivent « ARTICLE 12 — ASSURANCES : le Preneur garantira… » d’un seul tenant. Écarter la ligne de titre effacerait la clause.',
    varietes: [Variete.CLAUSES_IMBRIQUEES, Variete.BAIL_SIMPLE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES : le Preneur garantira les risques locatifs et le recours des voisins et des tiers.`,
    contrat: `CONDITIONS PARTICULIÈRES
Risques locatifs : 1 500 000 € par sinistre.
Recours des voisins et des tiers : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'RISQUES_LOCATIFS',
        niveau: 'ETABLIE',
        extraitContient: 'garantira les risques locatifs',
      },
      { garantieId: 'RECOURS_VOISINS_TIERS', niveau: 'ETABLIE' },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-15',
    intitule: '« Le Preneur fera son affaire personnelle de toutes assurances »',
    enjeu:
      'La clause la plus fréquente, et la plus vide : elle transfère sans rien exiger. Le moteur ne doit inventer aucune garantie derrière.',
    varietes: [Variete.BAIL_SIMPLE, Variete.BAIL_MUET],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur fera son affaire personnelle de toutes assurances utiles à son exploitation.
Le Bailleur ne pourra être recherché à ce titre.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité civile exploitation : 8 000 000 € par sinistre.`,
    attestation: null,
    garanties: [],
    interdites: [
      'RISQUES_LOCATIFS',
      'ASSURANCE_IMMEUBLE_BAILLEUR',
      'RC_EXPLOITATION',
      'MOBILIER_MATERIEL_MARCHANDISES',
      'RENONCIATION_RECOURS',
    ],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-16',
    intitule: 'Les garanties exigées renvoyées à une annexe',
    enjeu:
      'L’article d’assurance ne dit rien ; l’annexe dit tout. Un moteur qui s’arrête à l’article rate l’intégralité de l’obligation.',
    varietes: [Variete.CLAUSES_IMBRIQUEES, Variete.COUVERTURE_PARTIELLE],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES
Le Preneur souscrira les garanties énumérées à l’annexe 4 du présent bail.

ANNEXE 4 — GARANTIES EXIGÉES
Le Preneur garantira les risques locatifs à hauteur de 1 500 000 €.
Le Preneur garantira le recours des voisins et des tiers.
Le Preneur garantira la perte d’exploitation pendant douze mois.`,
    contrat: `CONDITIONS PARTICULIÈRES
Risques locatifs : 1 500 000 € par sinistre.
Recours des voisins et des tiers : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [
      { garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' },
      { garantieId: 'RECOURS_VOISINS_TIERS', niveau: 'ETABLIE' },
      {
        garantieId: 'PERTE_EXPLOITATION',
        niveau: 'ECART_CONFIRME',
        extraitContient: 'perte d’exploitation',
      },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    // La perte d'exploitation manquante ne relève d'aucun contrôle du
    // référentiel : IND-02 et SIN-01 exigent un lien au bailleur ou au loyer.
    // Elle ressort au rapprochement, et c'est là qu'il faut la lire.
    ecarts: [],
  },
  {
    id: 'AUD-17',
    intitule: 'Sous-clauses numérotées 8.1 / 8.2',
    enjeu:
      'La numérotation décimale coupe l’article en stipulations distinctes : l’obligation est en 8.1, la formalité en 8.2, et elles n’appellent pas la même chose.',
    varietes: [Variete.CLAUSES_IMBRIQUEES, Variete.SYNONYME_ASSUREUR],
    figeLe: '2026-08-22',
    bail: `ARTICLE 8 — ASSURANCES
8.1 Le Preneur justifiera d’une assurance couvrant sa responsabilité civile occupant.
8.2 Il en remettra l’attestation au Bailleur à chaque échéance annuelle.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité civile occupant : 3 000 000 € par sinistre.`,
    attestation: null,
    garanties: [
      {
        garantieId: 'RC_OCCUPANT',
        niveau: 'ETABLIE',
        extraitContient: 'responsabilité civile occupant',
      },
    ],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: [],
  },
  {
    id: 'AUD-18',
    intitule: 'Le même risque exigé dans deux articles',
    enjeu:
      'Un bail qui se répète ne crée pas deux obligations. Deux lignes pour un même risque dans le rapport, et le courtier croit à deux points à traiter.',
    varietes: [Variete.BAIL_LONG, Variete.CLAUSES_IMBRIQUEES],
    figeLe: '2026-08-22',
    bail: `ARTICLE 12 — ASSURANCES DU PRENEUR
Le Preneur garantira les risques locatifs pour un montant au moins égal à 1 500 000 €.

ARTICLE 19 — DISPOSITIONS PARTICULIÈRES
Le Preneur maintiendra pendant toute la durée du bail la garantie des risques locatifs visée ci-dessus.`,
    contrat: `CONDITIONS PARTICULIÈRES
Responsabilité locative : 1 500 000 € par sinistre.`,
    attestation: null,
    garanties: [{ garantieId: 'RISQUES_LOCATIFS', niveau: 'ETABLIE' }],
    interdites: ['ASSURANCE_IMMEUBLE_BAILLEUR'],
    incoherences: [],
    ecarts: [],
  },
]
