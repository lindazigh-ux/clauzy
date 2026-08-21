/**
 * Corpus synthetique — baux complets et pieces d'assurance (brief §5.4).
 *
 * INTERDICTION ABSOLUE : aucun document client reel, meme anonymise (§5.4, §13).
 * Tout ce qui suit est ecrit de toutes pieces. Les enseignes, adresses,
 * montants et references de police sont fictifs.
 *
 * Les six profils correspondent aux six redactions nommees par le brief. Ils ne
 * servent pas a verifier controle par controle — c'est le role de `cas.ts` —
 * mais a eprouver le moteur sur des documents entiers : segmentation d'un texte
 * long, baux sans titres exploitables, redaction anglo-saxonne, bail
 * minimaliste ou la plupart des controles doivent ressortir ABSENT_DU_BAIL.
 */

export type ProfilBail =
  | 'CENTRE_COMMERCIAL'
  | 'BUREAUX'
  | 'LOGISTIQUE'
  | 'ATYPIQUE_LONG'
  | 'MINIMALISTE'
  | 'ANGLO_SAXON'

export type BailSynthetique = {
  readonly id: string
  readonly profil: ProfilBail
  readonly libelle: string
  readonly texte: string
}

export type PieceSynthetique = {
  readonly id: string
  readonly libelle: string
  readonly texte: string
}

const CENTRE_COMMERCIAL = `BAIL COMMERCIAL EN CENTRE COMMERCIAL

Entre les soussignés, la société DISTRIBUTION NORD, société par actions simplifiée, ci-après dénommée le Preneur, et la société FONCIÈRE DES HALLES, ci-après dénommée le Bailleur.

ARTICLE 2 — DÉSIGNATION DES LOCAUX
Les locaux loués se composent d’une surface de vente de 420 mètres carrés et d’une réserve de 90 mètres carrés, au sein de l’ensemble commercial.

ARTICLE 3 — DESTINATION
Les lieux sont exclusivement affectés à la vente au détail d’articles de prêt-à-porter.

ARTICLE 12 — ASSURANCES DU PRENEUR
Le Preneur assurera à ses frais l’ensemble des éléments de clos et couvert, y compris la toiture, les façades et les vitrines de l’immeuble.
Le Preneur souscrit une garantie couvrant l’incendie, l’explosion, les dégâts des eaux et la tempête.
Les capitaux assurés sont fixés en valeur à neuf, à hauteur de 2 400 000 € pour le contenu professionnel.
Toute franchise demeure à la charge du preneur, qui ne pourra en réclamer le remboursement au Bailleur.
Le Preneur garantit le vol et le vandalisme, sous réserve du respect des moyens de protection exigés.

ARTICLE 13 — RENONCIATION À RECOURS
Le Preneur renonce à tout recours contre le Bailleur et contre les assureurs de ce dernier.
Le Preneur renonce également à recours contre les occupants, les prestataires et les autres locataires de l’ensemble immobilier.

ARTICLE 14 — INDEMNITÉS D’ASSURANCE
Toutes indemnités d’assurance seront versées au Bailleur, qui en aura la libre disposition.
L’indemnité de perte d’exploitation est déléguée au Bailleur à concurrence des loyers et charges échus.

ARTICLE 15 — SINISTRE ET RECONSTRUCTION
Le loyer restera intégralement dû pendant toute la durée de la reconstruction.
Aucune diminution de loyer ne pourra être demandée en cas de destruction partielle.

ARTICLE 16 — RESPONSABILITÉ CIVILE
Le Preneur répond de tous dommages survenus dans les lieux loués, quelle qu’en soit la cause.
La responsabilité civile du Preneur est garantie à hauteur de 8 000 000 € par sinistre.

ARTICLE 19 — ATTESTATIONS ET OBLIGATIONS
À défaut de production de l’attestation dans les huit jours de la première demande, le bail sera résilié de plein droit.
Toute surprime résultant de l’activité exercée dans les lieux sera refacturée au Preneur.

ARTICLE 20 — CLAUSES DIVERSES
Les stipulations du bail prévalent sur celles de la police d’assurance en cas de contradiction.`

const BUREAUX = `BAIL COMMERCIAL À USAGE DE BUREAUX

Entre les soussignés, la société CONSEIL ET AUDIT ASSOCIÉS, ci-après dénommée le Preneur, et la société IMMOBILIÈRE DU PARC, ci-après dénommée le Bailleur.

ARTICLE 2 — DÉSIGNATION DES LOCAUX
Les locaux loués comprennent un plateau de bureaux de 640 mètres carrés au troisième étage, ainsi que douze emplacements de stationnement.

ARTICLE 3 — DESTINATION
Les lieux sont affectés à l’exploitation d’une activité de conseil et d’expertise comptable.

ARTICLE 11 — ASSURANCES DU PRENEUR
Le Preneur assure ses matériels, ses marchandises et ses stocks pour leur valeur de remplacement.
Le Preneur souscrit une garantie couvrant l’incendie, l’explosion et les dégâts des eaux.

ARTICLE 12 — RENONCIATION À RECOURS
Chacune des parties abandonne tout recours contre l’autre et contre l’assureur de celle-ci, à charge de réciprocité.
Les parties obtiendront de leurs assureurs respectifs qu’ils renoncent pareillement à tout recours subrogatoire.

ARTICLE 13 — INDEMNITÉS D’ASSURANCE
Les indemnités relatives aux biens propres du Preneur lui demeurent acquises.
L’indemnité de perte d’exploitation demeure exclusivement acquise au Preneur.

ARTICLE 14 — RESPONSABILITÉ CIVILE
La responsabilité civile du Preneur est garantie à hauteur de 5 000 000 € par sinistre.
La garantie recours des voisins et des tiers est acquise à hauteur de 1 500 000 €.

ARTICLE 18 — ATTESTATIONS ET OBLIGATIONS
Le Preneur adresse chaque année au Bailleur son attestation d’assurance, à la date anniversaire de la prise d’effet.`

const LOGISTIQUE = `BAIL COMMERCIAL — ENTREPÔT LOGISTIQUE

Entre les soussignés, la société TRANSIT ATLANTIQUE, ci-après dénommée le Preneur, et la société FONCIÈRE LOGISTIQUE EUROPE, ci-après dénommée le Bailleur.

ARTICLE 2 — DÉSIGNATION DES LOCAUX
Les locaux loués comprennent un entrepôt de 18 000 mètres carrés, seize quais de chargement et un bâtiment administratif.

ARTICLE 3 — DESTINATION
Les lieux sont affectés à une activité d’entreposage et de distribution, relevant de la réglementation des installations classées.

ARTICLE 10 — ASSURANCES DU PRENEUR
Le Preneur assurera l’ensemble des biens garnissant les lieux, sans distinction de propriété ni de nature.
Les capitaux assurés sont fixés en valeur à neuf, à hauteur de 12 000 000 € pour les marchandises entreposées.
Le Preneur garantit le vol et le vandalisme, sous réserve du respect des moyens de protection exigés.

ARTICLE 15 — RISQUES ENVIRONNEMENTAUX
Le Preneur garantit les conséquences d’une pollution accidentelle du sol ou des eaux résultant de son exploitation.
Le Preneur prend les lieux en l’état, y compris toute pollution antérieure à son entrée dans les lieux.

ARTICLE 16 — SINISTRE ET RECONSTRUCTION
Si les locaux demeurent inexploitables plus de trente-six (36) mois, le Preneur pourra résilier le bail moyennant un préavis de trois mois.
Le Bailleur décidera seul s’il entend reconstruire l’immeuble sinistré.

ARTICLE 18 — TRAVAUX DU PRENEUR
Le Preneur souscrit une assurance dommages-ouvrage avant toute ouverture de chantier portant sur le gros œuvre.
Une police tous risques chantier est souscrite pour la durée des travaux.
Toute garantie complémentaire exigée par le Bailleur sera souscrite sans délai par le Preneur et à ses frais.

ARTICLE 20 — ATTESTATIONS ET OBLIGATIONS
L’attestation mentionnera les franchises et les exclusions applicables à chacune des garanties.
À défaut de justification, le Bailleur pourra souscrire lui-même les garanties manquantes aux frais du Preneur.
Le Bailleur pourra exiger un niveau de couverture supérieur à celui initialement souscrit.
L’inobservation des dispositions ci-dessus entraînera l’application de la règle proportionnelle.`

const ATYPIQUE_LONG = `BAIL COMMERCIAL DE LONGUE DURÉE — ENSEMBLE IMMOBILIER MIXTE

TITRE I - DISPOSITIONS GÉNÉRALES

Entre les soussignés, la société EXPLOITATION DES QUAIS, ci-après dénommée le Preneur, et la société PATRIMOINE FLUVIAL, ci-après dénommée le Bailleur.

1.1 Objet
Le présent bail porte sur un ensemble immobilier mixte comprenant des surfaces commerciales, des bureaux et des locaux techniques.

1.2 Désignation des locaux
Les locaux loués se composent de trois bâtiments distincts, désignés A, B et C au plan annexé.

TITRE II - OBLIGATIONS DU PRENEUR

2.4 Assurances
Le Preneur assurera à ses frais l’ensemble des éléments de clos et couvert, y compris la toiture et les façades de l’immeuble.
Le Preneur souscrit une garantie couvrant l’incendie, l’explosion, les dégâts des eaux, la tempête et les catastrophes naturelles.

2.5 Renonciation à recours
Le Bailleur renonce à recours contre le Preneur, quelle qu’en soit la cause et quelle que soit l’origine du sinistre.

2.6 Indemnités
Une délégation d’indemnité est consentie au Bailleur sur l’ensemble des règlements dus au titre de la police.
Le Preneur prend en charge la perte d’usage subie par le Bailleur pendant toute la durée de la remise en état.

TITRE III - SINISTRES ET RESPONSABILITÉS

3.1 Sinistre majeur
Le loyer restera intégralement dû pendant toute la durée de la reconstruction.
Le Bailleur décidera seul s’il entend reconstruire l’immeuble sinistré.

3.2 Responsabilité civile
Le Preneur répond de tous dommages survenus dans les lieux loués, quelle qu’en soit la cause.
Le Bailleur ne pourra être inquiété à raison des troubles causés par les autres occupants.
Le Preneur garantit le Bailleur contre toute réclamation de tiers liée à l’exploitation des lieux.

TITRE IV - CLAUSES DIVERSES

4.1 Articulation contractuelle
Les stipulations du bail prévalent sur celles de la police d’assurance.
Le Preneur renonce à tout recours au titre de tout autre contrat conclu avec le Bailleur.`

const MINIMALISTE = `BAIL COMMERCIAL

Entre les soussignés, la société ATELIER DU CENTRE, ci-après dénommée le Preneur, et Monsieur le Bailleur.

ARTICLE 1 — DÉSIGNATION DES LOCAUX
Les locaux loués comprennent un atelier de 110 mètres carrés.

ARTICLE 2 — DESTINATION
Les lieux sont affectés à une activité artisanale de réparation.

ARTICLE 3 — LOYER
Le loyer annuel est fixé à 14 400 €, payable par trimestre et d’avance.

ARTICLE 4 — ASSURANCES
Le Preneur souscrit une police multirisque professionnelle auprès d’une compagnie notoirement solvable.
Le Preneur adresse chaque année au Bailleur son attestation d’assurance.`

const ANGLO_SAXON = `LEASE AGREEMENT — TRADUCTION FRANÇAISE DE COURTOISIE

Le présent contrat est conclu entre les soussignés, la société GLOBAL RETAIL FRANCE, ci-après dénommée le Preneur, et la société EUROPEAN PROPERTY PARTNERS, ci-après dénommée le Bailleur.

Section 4. Insurance obligations of the Tenant / Obligations d’assurance du Preneur
Le Preneur maintiendra en vigueur, pendant toute la durée du bail, une police couvrant l’incendie, l’explosion et les dégâts des eaux, ainsi qu’une garantie de responsabilité civile d’un montant de 10 000 000 €.
Le Preneur assurera l’ensemble des biens garnissant les lieux, sans distinction de propriété.

Section 5. Waiver of subrogation / Renonciation à recours
Le Preneur renonce à tout recours contre le Bailleur, ses occupants, ses prestataires et les autres locataires de l’ensemble immobilier.
Les parties obtiendront de leurs assureurs respectifs qu’ils renoncent pareillement à tout recours subrogatoire.

Section 6. Insurance proceeds / Indemnités d’assurance
Toutes indemnités d’assurance seront versées au Bailleur, qui en aura la libre disposition.

Section 9. Precedence / Articulation contractuelle
Les stipulations du bail prévalent sur celles de la police d’assurance.`

export const BAUX: readonly BailSynthetique[] = [
  { id: 'bail-cc', profil: 'CENTRE_COMMERCIAL', libelle: 'Commerce en centre commercial', texte: CENTRE_COMMERCIAL },
  { id: 'bail-bur', profil: 'BUREAUX', libelle: 'Bureaux', texte: BUREAUX },
  { id: 'bail-log', profil: 'LOGISTIQUE', libelle: 'Entrepôt logistique', texte: LOGISTIQUE },
  { id: 'bail-atyp', profil: 'ATYPIQUE_LONG', libelle: 'Ensemble mixte, rédaction longue', texte: ATYPIQUE_LONG },
  { id: 'bail-min', profil: 'MINIMALISTE', libelle: 'Bail minimaliste', texte: MINIMALISTE },
  { id: 'bail-anglo', profil: 'ANGLO_SAXON', libelle: 'Rédaction anglo-saxonne', texte: ANGLO_SAXON },
]

const CP_COMPLETE = `CONDITIONS PARTICULIÈRES — POLICE MULTIRISQUE PROFESSIONNELLE
Police n° FIC-000000 (document synthétique, aucune compagnie réelle)

GARANTIES SOUSCRITES
Responsabilité locative (risques locatifs) : 1 500 000 € par sinistre.
Incendie, explosion, dégâts des eaux, tempête, catastrophes naturelles : acquis.
Vol, vandalisme et effraction : acquis, sous condition de moyens de protection.
Biens appartenant au preneur, matériels, marchandises et stocks : garantis.
Capitaux assurés : 2 400 000 €, en valeur à neuf.
Recours des voisins et des tiers : 1 500 000 € par sinistre.
Responsabilité civile exploitation : 8 000 000 € par sinistre et par année d’assurance.
Perte d’exploitation : marge brute garantie pendant 12 mois.
Pollution accidentelle : garantie acquise à hauteur de 1 000 000 €.
Dommages-ouvrage et tous risques chantier : garanties souscrites au cas par cas.

DISPOSITIONS PARTICULIÈRES
Les assureurs renoncent à tout recours subrogatoire contre le bailleur et ses préposés.
Bénéficiaire des indemnités : l’assuré, sauf délégation notifiée à la compagnie.`

const CP_LACUNAIRE = `CONDITIONS PARTICULIÈRES — POLICE MULTIRISQUE
Police n° FIC-111111 (document synthétique, aucune compagnie réelle)

GARANTIES SOUSCRITES
Incendie et explosion : acquis.
Capitaux assurés : 900 000 €.
Responsabilité civile exploitation : 3 000 000 € par sinistre.
Perte d’exploitation : marge brute garantie pendant 6 mois.`

/**
 * Attestation SYNTHETIQUE, volontairement incomplete au regard des conditions
 * particulieres qu'elle est censee resumer.
 *
 * C'est le cas le plus frequent en pratique, et le plus mal traite : la
 * garantie existe au contrat, mais l'attestation remise au bailleur ne la
 * mentionne pas. Ce n'est ni une conformite ni un ecart — c'est un defaut de
 * justification, qui se corrige par un courriel au courtier et non par un
 * avenant.
 */
const ATTESTATION_PARTIELLE = `ATTESTATION D’ASSURANCE
Police n° FIC-000000 (document synthétique, aucune compagnie réelle)

Nous soussignés attestons que le contrat ci-dessus référencé est en cours de validité
pour la période du 1er janvier au 31 décembre.

GARANTIES MENTIONNÉES
Responsabilité civile exploitation : 8 000 000 € par sinistre.
Recours des voisins et des tiers : 1 500 000 € par sinistre.
Incendie, explosion, dégâts des eaux : acquis.

La présente attestation est délivrée pour valoir ce que de droit. Elle ne peut engager
la compagnie au-delà des clauses et conditions du contrat auquel elle se réfère.`

export const PIECES: readonly PieceSynthetique[] = [
  { id: 'cp-complete', libelle: 'Conditions particulières complètes', texte: CP_COMPLETE },
  { id: 'cp-lacunaire', libelle: 'Conditions particulières lacunaires', texte: CP_LACUNAIRE },
]

export const ATTESTATIONS: readonly PieceSynthetique[] = [
  { id: 'att-partielle', libelle: 'Attestation d’assurance', texte: ATTESTATION_PARTIELLE },
]
