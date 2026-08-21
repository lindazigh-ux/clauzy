/**
 * Corpus synthetique — un cas positif et un cas negatif par controle (§5.4, §14).
 *
 * INTERDICTION ABSOLUE : aucun document client reel, sous quelque forme que ce
 * soit, y compris anonymise (brief §5.4, §13). Tout ce qui suit est invente de
 * toutes pieces. Les enseignes, adresses et montants cites n'existent pas.
 *
 * Chaque clause est redigee comme une stipulation de bail que la praticienne
 * reconnaitrait, et non comme un appat a expression reguliere. C'est la seule
 * facon pour ce corpus de servir de non-regression utile : un motif reecrit
 * doit continuer a reconnaitre une redaction reelle, pas une chaine fabriquee
 * a son intention.
 *
 * Le cas negatif porte sur LE MEME SUJET que le positif, redige de facon saine.
 * Un negatif hors sujet ne prouverait rien : n'importe quel motif y echouerait.
 */

export type ClauseTest = {
  /** Intitule complet de l'article, tel qu'il figurerait dans le bail. */
  readonly article: string
  readonly texte: string
}

export type CasControle = {
  readonly controleId: string
  /** Redaction qui doit declencher le controle. */
  readonly positif: ClauseTest
  /** Redaction saine sur le meme sujet, qui ne doit pas le declencher. */
  readonly negatif: ClauseTest
}

const A_DESIGNATION = 'ARTICLE 1 — DÉSIGNATION DES PARTIES'
const A_LOCAUX = 'ARTICLE 2 — DÉSIGNATION DES LOCAUX'
const A_ASSURANCES = 'ARTICLE 12 — ASSURANCES DU PRENEUR'
const A_RENONCIATION = 'ARTICLE 13 — RENONCIATION À RECOURS'
const A_INDEMNITES = 'ARTICLE 14 — INDEMNITÉS D’ASSURANCE'
const A_SINISTRE = 'ARTICLE 15 — SINISTRE ET RECONSTRUCTION'
const A_RC = 'ARTICLE 16 — RESPONSABILITÉ CIVILE'
const A_ENV = 'ARTICLE 17 — RISQUES ENVIRONNEMENTAUX'
const A_TRAVAUX = 'ARTICLE 18 — TRAVAUX DU PRENEUR'
const A_ATTESTATIONS = 'ARTICLE 19 — ATTESTATIONS ET OBLIGATIONS'
const A_DIVERS = 'ARTICLE 20 — CLAUSES DIVERSES'

export const CAS: readonly CasControle[] = [
  {
    controleId: 'DOC-01',
    positif: {
      article: A_DESIGNATION,
      texte:
        'Entre les soussignés, la société DISTRIBUTION NORD, société par actions simplifiée au capital de 500 000 €, ci-après dénommée le Preneur, et la société FONCIÈRE DES HALLES, ci-après dénommée le Bailleur.',
    },
    negatif: {
      article: 'ARTICLE 1 — OBJET DU CONTRAT',
      texte:
        'Le présent contrat est conclu sous le régime des articles L145-1 et suivants du code de commerce, pour les besoins de l’exploitation décrite ci-après.',
    },
  },
  {
    controleId: 'DOC-02',
    positif: {
      article: A_LOCAUX,
      texte:
        'Les locaux loués se composent d’une surface de vente de 420 mètres carrés, d’une réserve de 90 mètres carrés et d’un quai de livraison.',
    },
    negatif: {
      article: 'ARTICLE 2 — CONSISTANCE DU BIEN',
      texte:
        'Le bien objet des présentes comprend un espace de vente, une réserve et un quai de livraison, tels que figurant au plan annexé.',
    },
  },
  {
    controleId: 'DOC-03',
    positif: {
      article: 'ARTICLE 3 — DESTINATION',
      texte:
        'Les lieux sont exclusivement affectés à la vente au détail d’articles de prêt-à-porter, à l’exclusion de toute autre exploitation.',
    },
    negatif: {
      article: 'ARTICLE 3 — EMPLOI DES LIEUX',
      texte:
        'Les lieux sont réservés à la vente au détail d’articles textiles, sans possibilité de modification sans accord écrit préalable.',
    },
  },
  // ---------------------------------------------------------------------
  // Garanties fondamentales — ajoutées avec la famille GAR.
  //
  // Le négatif est ici particulièrement important : il porte la rédaction
  // SAINE du même sujet, celle qui ne doit rien déclencher. C'est lui qui
  // interdit au moteur de crier au loup devant une clause ordinaire.
  // ---------------------------------------------------------------------
  {
    controleId: 'GAR-01',
    positif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur devra assurer les locaux loués contre l’incendie, l’explosion et les dégâts des eaux, et en justifier à première demande du Bailleur.',
    },
    // Même article, même sujet — l'assurance du preneur — mais l'obligation
    // porte sur ses biens propres et ne met en jeu aucune responsabilité
    // locative. Le contrôle n'a donc rien à dire.
    negatif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur assure son mobilier, son matériel professionnel et ses marchandises, ainsi que les aménagements qu’il a lui-même réalisés.',
    },
  },
  {
    controleId: 'GAR-02',
    positif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur devra assurer les locaux pendant toute la durée du bail auprès d’une compagnie notoirement solvable.',
    },
    negatif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur garantit sa responsabilité locative au titre des locaux loués. L’assurance de l’immeuble, de la structure, du clos et du couvert demeure à la charge du Bailleur.',
    },
  },
  {
    controleId: 'GAR-03',
    positif: {
      article: A_RC,
      texte:
        'Le Preneur justifiera d’une responsabilité civile exploitation couvrant les conséquences pécuniaires des dommages causés aux tiers du fait de son activité.',
    },
    negatif: {
      article: A_RC,
      texte:
        'Les parties conviennent que chacune conserve la charge des conséquences de ses propres manquements, dans les conditions du droit commun.',
    },
  },
  {
    controleId: 'GAR-04',
    positif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur assurera l’ensemble de son matériel informatique et de ses équipements techniques contre tous dommages, quelle qu’en soit la cause.',
    },
    negatif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur assure son matériel dans les limites et conditions des polices effectivement souscrites.',
    },
  },
  {
    controleId: 'GAR-05',
    positif: {
      article: A_SINISTRE,
      texte:
        'En cas de sinistre, la remise en état sera assurée en valeur à neuf, sans déduction de vétusté, aux frais du Preneur.',
    },
    negatif: {
      article: A_SINISTRE,
      texte:
        'L’indemnisation intervient selon les modalités des polices effectivement souscrites, dans leurs limites et conditions.',
    },
  },
  {
    controleId: 'DAB-01',
    positif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur assurera à ses frais l’ensemble des éléments de clos et couvert, y compris la toiture, les façades et les vitrines de l’immeuble.',
    },
    negatif: {
      article: A_ASSURANCES,
      texte:
        'Le Bailleur conserve à sa charge l’assurance de la structure, de la toiture et des façades de l’immeuble, dont il demeure propriétaire.',
    },
  },
  {
    controleId: 'DAB-02',
    positif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur assure ses matériels, ses marchandises et ses stocks pour leur valeur de remplacement au jour du sinistre.',
    },
    negatif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur assure les biens dont il est propriétaire pour une valeur correspondant à leur coût de reconstitution.',
    },
  },
  {
    controleId: 'DAB-03',
    positif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur souscrit une garantie couvrant l’incendie, l’explosion, les dégâts des eaux et la tempête.',
    },
    negatif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur souscrit une police multirisque professionnelle auprès d’une compagnie notoirement solvable, pour la durée du bail.',
    },
  },
  {
    controleId: 'DAB-04',
    positif: {
      article: A_ASSURANCES,
      texte:
        'Les capitaux assurés sont fixés en valeur à neuf, à hauteur de 2 400 000 € pour le contenu professionnel.',
    },
    negatif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur déclare à son assureur les surfaces et les équipements figurant à l’état des lieux d’entrée.',
    },
  },
  {
    controleId: 'DAB-05',
    positif: {
      article: A_ASSURANCES,
      texte:
        'Toute franchise demeure à la charge du preneur, qui ne pourra en réclamer le remboursement au Bailleur.',
    },
    negatif: {
      article: A_ASSURANCES,
      texte:
        'Les franchises applicables à chaque garantie figurent aux conditions particulières de la police souscrite.',
    },
  },
  {
    controleId: 'DAB-06',
    positif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur garantit le vol et le vandalisme, sous réserve du respect des moyens de protection exigés par l’assureur.',
    },
    negatif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur maintient en bon état de fonctionnement les rideaux métalliques, la serrurerie et le système d’alarme des locaux.',
    },
  },
  {
    controleId: 'DAB-07',
    positif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur assurera l’ensemble des biens garnissant les lieux, sans distinction de propriété ni de nature.',
    },
    negatif: {
      article: A_ASSURANCES,
      texte:
        'Le Preneur assure ceux des biens dont il est propriétaire, le Bailleur conservant la charge des siens.',
    },
  },
  {
    controleId: 'RR-01',
    positif: {
      article: A_RENONCIATION,
      texte:
        'Le Preneur renonce à tout recours contre le Bailleur et contre les assureurs de ce dernier, pour quelque dommage que ce soit.',
    },
    negatif: {
      article: 'ARTICLE 13 — ABANDON DE RECOURS',
      texte:
        'Chacune des parties abandonne tout recours contre l’autre et contre l’assureur de celle-ci, à charge de réciprocité.',
    },
  },
  {
    controleId: 'RR-02',
    positif: {
      article: A_RENONCIATION,
      texte:
        'Le Bailleur renonce à recours contre le Preneur, quelle qu’en soit la cause et quelle que soit l’origine du sinistre.',
    },
    negatif: {
      article: A_RENONCIATION,
      texte:
        'L’abandon de recours ne joue pas lorsque le dommage résulte d’un acte volontaire imputable à l’une des parties.',
    },
  },
  {
    controleId: 'RR-03',
    positif: {
      article: A_RENONCIATION,
      texte:
        'Le Preneur renonce à recours contre le Bailleur, ses occupants, ses prestataires et les autres locataires de l’ensemble immobilier.',
    },
    negatif: {
      article: A_RENONCIATION,
      texte:
        'La renonciation à recours est strictement limitée au Bailleur et à son assureur, à l’exclusion de toute autre personne.',
    },
  },
  {
    controleId: 'RR-04',
    positif: {
      article: A_RENONCIATION,
      texte:
        'Les parties obtiendront de leurs assureurs respectifs qu’ils renoncent pareillement à tout recours subrogatoire.',
    },
    negatif: {
      article: A_RENONCIATION,
      texte:
        'Les parties se communiquent chaque année les coordonnées de leurs courtiers et les références de leurs polices.',
    },
  },
  {
    controleId: 'IND-01',
    positif: {
      article: A_INDEMNITES,
      texte:
        'Toutes indemnités d’assurance seront versées au Bailleur, qui en aura la libre disposition sans avoir à en justifier l’emploi.',
    },
    negatif: {
      article: A_INDEMNITES,
      texte:
        'Les indemnités relatives aux biens propres du Preneur lui demeurent acquises, celles relatives au bâtiment revenant au Bailleur.',
    },
  },
  {
    controleId: 'IND-02',
    positif: {
      article: A_INDEMNITES,
      texte:
        'L’indemnité de perte d’exploitation est déléguée au Bailleur à concurrence des loyers et charges échus.',
    },
    negatif: {
      article: A_INDEMNITES,
      texte:
        'L’indemnité de perte d’exploitation demeure exclusivement acquise au Preneur, de même que les frais supplémentaires.',
    },
  },
  {
    controleId: 'IND-03',
    positif: {
      article: A_INDEMNITES,
      texte:
        'Une délégation d’indemnité est consentie au Bailleur sur l’ensemble des règlements dus au titre de la police.',
    },
    negatif: {
      article: A_INDEMNITES,
      texte:
        'Les règlements dus au titre de la police sont versés à l’assuré, selon les conditions convenues avec sa compagnie.',
    },
  },
  {
    controleId: 'IND-04',
    positif: {
      article: A_INDEMNITES,
      texte:
        'Le Preneur prend en charge la perte d’usage subie par le Bailleur pendant toute la durée de la remise en état.',
    },
    negatif: {
      article: A_INDEMNITES,
      texte:
        'Chaque partie supporte les conséquences économiques qui lui sont propres, sans report sur l’autre partie.',
    },
  },
  {
    controleId: 'SIN-01',
    positif: {
      article: A_SINISTRE,
      texte:
        'Le loyer restera intégralement dû pendant toute la durée de la reconstruction, sans considération de l’état des lieux.',
    },
    negatif: {
      article: A_SINISTRE,
      texte:
        'Le loyer est suspendu à proportion de la surface rendue inutilisable, jusqu’à remise à disposition des lieux.',
    },
  },
  {
    controleId: 'SIN-02',
    positif: {
      article: A_SINISTRE,
      texte:
        'Aucune diminution de loyer ne pourra être demandée en cas de destruction partielle, quelle qu’en soit l’ampleur.',
    },
    negatif: {
      article: A_SINISTRE,
      texte:
        'Le loyer est réduit à proportion de la surface devenue inexploitable, à compter du jour du sinistre.',
    },
  },
  {
    controleId: 'SIN-03',
    positif: {
      article: A_SINISTRE,
      texte:
        'Si les locaux demeurent inexploitables plus de trente-six (36) mois, le Preneur pourra résilier le bail moyennant un préavis de trois mois.',
    },
    negatif: {
      article: A_SINISTRE,
      texte:
        'Les travaux de remise en état sont conduits avec diligence par le Bailleur, qui tient le Preneur informé de leur avancement.',
    },
  },
  {
    controleId: 'SIN-04',
    positif: {
      article: A_SINISTRE,
      texte:
        'Le Bailleur décidera seul s’il entend reconstruire l’immeuble sinistré, sans que le Preneur puisse le contraindre.',
    },
    negatif: {
      article: A_SINISTRE,
      texte:
        'Le Bailleur informe le Preneur des conclusions des études techniques dans les deux mois de leur remise.',
    },
  },
  {
    controleId: 'RC-01',
    positif: {
      article: A_RC,
      texte:
        'Le Preneur répond de tous dommages survenus dans les lieux loués, quelle qu’en soit la cause et quel qu’en soit l’auteur.',
    },
    negatif: {
      article: A_RC,
      texte:
        'Le Preneur répond des dommages qui lui sont directement imputables, dans les conditions du droit commun.',
    },
  },
  {
    controleId: 'RC-02',
    positif: {
      article: A_RC,
      texte:
        'La responsabilité civile du Preneur est garantie à hauteur de 8 000 000 € par sinistre et par année d’assurance.',
    },
    negatif: {
      article: 'ARTICLE 16 — DOMMAGES AUX TIERS',
      texte:
        'Le Preneur souscrit une police couvrant les dommages causés aux tiers du fait de son exploitation, à hauteur des usages de la profession.',
    },
  },
  {
    controleId: 'RC-03',
    positif: {
      article: A_RC,
      texte:
        'La garantie recours des voisins et des tiers est acquise à hauteur de 1 500 000 € par sinistre.',
    },
    negatif: {
      article: A_RC,
      texte:
        'Le Preneur garantit le Bailleur contre les réclamations émanant des occupants de l’immeuble du fait de son exploitation.',
    },
  },
  {
    controleId: 'RC-04',
    positif: {
      article: A_RC,
      texte:
        'Le Bailleur ne pourra être inquiété à raison des troubles causés par les autres occupants de l’ensemble immobilier.',
    },
    negatif: {
      article: A_RC,
      texte:
        'Le Bailleur met en œuvre les moyens dont il dispose pour faire cesser les troubles de jouissance signalés par le Preneur.',
    },
  },
  {
    controleId: 'RC-05',
    positif: {
      article: A_RC,
      texte:
        'Le Preneur garantit le Bailleur contre toute réclamation de tiers liée à l’exploitation des lieux loués.',
    },
    negatif: {
      article: A_RC,
      texte:
        'Le Preneur informe le Bailleur de toute action engagée à son encontre à raison de l’exploitation des lieux.',
    },
  },
  {
    controleId: 'ENV-01',
    positif: {
      article: A_ENV,
      texte:
        'Le Preneur garantit les conséquences d’une pollution accidentelle du sol ou des eaux résultant de son exploitation.',
    },
    negatif: {
      article: A_ENV,
      texte:
        'Le Preneur respecte la réglementation applicable aux installations classées et tient à jour les registres exigés.',
    },
  },
  {
    controleId: 'ENV-02',
    positif: {
      article: A_ENV,
      texte:
        'Le Preneur prend les lieux en l’état, y compris toute pollution antérieure à son entrée dans les lieux.',
    },
    negatif: {
      article: A_ENV,
      texte:
        'Le Preneur répond des atteintes au sol résultant de sa propre exploitation, à compter de son entrée dans les lieux.',
    },
  },
  {
    controleId: 'TRV-01',
    positif: {
      article: A_TRAVAUX,
      texte:
        'Le Preneur souscrit une assurance dommages-ouvrage avant toute ouverture de chantier portant sur le gros œuvre.',
    },
    negatif: {
      article: A_TRAVAUX,
      texte:
        'Le Preneur communique au Bailleur les attestations de garantie décennale de ses entreprises intervenantes.',
    },
  },
  {
    controleId: 'TRV-02',
    positif: {
      article: A_TRAVAUX,
      texte:
        'Une police tous risques chantier est souscrite pour la durée des travaux et jusqu’à la réception de ceux-ci.',
    },
    negatif: {
      article: A_TRAVAUX,
      texte:
        'Les travaux sont réalisés par des entreprises qualifiées et régulièrement assurées pour les activités concernées.',
    },
  },
  {
    controleId: 'TRV-03',
    positif: {
      article: A_TRAVAUX,
      texte:
        'Toute garantie complémentaire exigée par le Bailleur sera souscrite sans délai par le Preneur et à ses frais.',
    },
    negatif: {
      article: A_TRAVAUX,
      texte:
        'Les garanties souscrites au titre des travaux sont détaillées en annexe et communiquées avant leur commencement.',
    },
  },
  {
    controleId: 'FOR-01',
    positif: {
      article: A_ATTESTATIONS,
      texte:
        'À défaut de production de l’attestation dans les huit jours de la première demande, le bail sera résilié de plein droit.',
    },
    negatif: {
      article: A_ATTESTATIONS,
      texte:
        'Le Preneur adresse chaque année au Bailleur son attestation d’assurance, à la date anniversaire de la prise d’effet.',
    },
  },
  {
    controleId: 'FOR-02',
    positif: {
      article: A_ATTESTATIONS,
      texte:
        'L’attestation mentionnera les franchises et les exclusions applicables à chacune des garanties souscrites.',
    },
    negatif: {
      article: A_ATTESTATIONS,
      texte:
        'L’attestation précise les garanties souscrites, leur montant et leur période de validité.',
    },
  },
  {
    controleId: 'FOR-03',
    positif: {
      article: A_ATTESTATIONS,
      texte:
        'À défaut de justification, le Bailleur pourra souscrire lui-même les garanties manquantes aux frais du Preneur.',
    },
    negatif: {
      article: A_ATTESTATIONS,
      texte:
        'Le Preneur souscrit et maintient les garanties exigées pendant toute la durée du bail et de ses renouvellements.',
    },
  },
  {
    controleId: 'FOR-04',
    positif: {
      article: A_ATTESTATIONS,
      texte:
        'Toute surprime résultant de l’activité exercée dans les lieux sera refacturée au Preneur sur justificatif.',
    },
    negatif: {
      article: A_ATTESTATIONS,
      texte:
        'Les primes dues au titre des garanties du Preneur sont réglées directement à sa compagnie, sans intervention du Bailleur.',
    },
  },
  {
    controleId: 'FOR-05',
    positif: {
      article: A_ATTESTATIONS,
      texte:
        'Le Bailleur pourra exiger un niveau de couverture supérieur à celui initialement souscrit par le Preneur.',
    },
    negatif: {
      article: A_ATTESTATIONS,
      texte:
        'Toute modification des garanties fait l’objet d’un accord écrit entre les parties, après échange de leurs analyses.',
    },
  },
  {
    controleId: 'FOR-06',
    positif: {
      article: A_ATTESTATIONS,
      texte:
        'L’inobservation des dispositions ci-dessus entraînera l’application de la règle proportionnelle aux indemnités dues.',
    },
    negatif: {
      article: A_ATTESTATIONS,
      texte:
        'Le Preneur déclare des capitaux conformes à la valeur réelle des biens assurés et les actualise chaque année.',
    },
  },
  {
    controleId: 'ART-01',
    positif: {
      article: A_DIVERS,
      texte:
        'Les stipulations du bail prévalent sur celles de la police d’assurance en cas de contradiction entre elles.',
    },
    negatif: {
      article: A_DIVERS,
      texte:
        'Les polices souscrites viennent en complément des obligations mises à la charge de chacune des parties.',
    },
  },
  {
    controleId: 'ART-02',
    positif: {
      article: A_DIVERS,
      texte:
        'Le Preneur renonce à tout recours au titre de tout autre contrat conclu avec le Bailleur ou ses préposés.',
    },
    negatif: {
      article: A_DIVERS,
      texte:
        'Les conventions distinctes conclues par le Preneur demeurent régies par leurs propres stipulations.',
    },
  },
]

/** Rend le document tel que le moteur le recevra : un article, puis sa clause. */
export const documentDuCas = (clause: ClauseTest): string => `${clause.article}\n${clause.texte}`

/**
 * Redactions de rattrapage, verrouillees en non-regression.
 *
 * Chacune a d'abord ete decouverte comme une LACUNE : une tournure courante que
 * les motifs d'origine ne reconnaissaient pas. Les motifs ont ete elargis, et
 * ces redactions sont desormais des cas positifs a part entiere.
 *
 * Elles restent listees a part pour garder la trace de l'elargissement : si un
 * motif est un jour resserre pour reduire des faux positifs, c'est ici que la
 * perte de rappel apparaitra, avec le detail de ce qui cesse d'etre reconnu.
 */
export type Variante = {
  readonly controleId: string
  readonly redaction: string
  /** Ce que le motif d'origine laissait passer. */
  readonly motif: string
}

export const VARIANTES_COUVERTES: readonly Variante[] = [
  {
    controleId: 'IND-01',
    redaction: 'Toutes les indemnités d’assurance seront versées au Bailleur.',
    motif: 'le motif d’origine exigeait « toutes indemnités » sans article intercalé',
  },
  {
    controleId: 'IND-01',
    redaction: 'L’ensemble des indemnités d’assurance sera versé au Bailleur.',
    motif: 'la tournure « l’ensemble des indemnités » n’était pas couverte',
  },
  {
    controleId: 'RC-03',
    redaction: 'Le recours des tiers et des voisins est garanti à hauteur de 1 500 000 €.',
    motif: 'le motif d’origine figeait l’ordre « voisins et tiers »',
  },
  {
    controleId: 'FOR-06',
    redaction: 'La règle proportionnelle de capitaux sera appliquée en cas de sous-évaluation.',
    motif:
      'le motif d’origine exigeait un déclencheur exprès et laissait passer la règle ' +
      'proportionnelle énoncée seule',
  },
  {
    controleId: 'ART-01',
    redaction: 'Les stipulations du bail priment sur celles de la police d’assurance.',
    motif: 'le motif d’origine ne connaissait que « prévaut » et « prévalent »',
  },
  {
    controleId: 'SIN-02',
    redaction: 'Le loyer ne subira aucune réduction en cas de destruction partielle.',
    motif: 'le motif d’origine attendait le loyer APRÈS la négation',
  },
  {
    controleId: 'FOR-01',
    redaction: 'Faute de production sous huitaine, le bail sera résilié de plein droit.',
    motif: 'le motif d’origine attendait « huit jours » ou « 8 jours »',
  },
]

/**
 * Lacunes de rappel encore ouvertes.
 *
 * Une tournure courante que les motifs ne reconnaissent pas, et qui n'a pas
 * encore ete arbitree : elargir un motif produit des faux positifs, qui coutent
 * plus cher qu'un NON_DETECTE. Consigner vaut mieux que masquer.
 *
 * Un test verrouille chaque entree : le jour ou le motif est elargi, il echoue
 * et rappelle de deplacer la redaction vers VARIANTES_COUVERTES.
 */
export const LACUNES_CONNUES: readonly Variante[] = []
