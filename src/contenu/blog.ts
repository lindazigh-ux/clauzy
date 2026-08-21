/**
 * Le carnet (brief §9).
 *
 * Contenu editorial, structure en blocs plutot qu'en HTML libre : les
 * citations de clause passent par un bloc dedie, qui porte l'italique serif du
 * §8 — le seul emploi legitime de cette face. Ecrire du HTML a la main dans un
 * article laisserait la mise en forme deriver article apres article.
 *
 * Les exemples de clauses sont SYNTHETIQUES, comme le corpus de test. Publier
 * un extrait de bail reel, meme anonymise, est interdit (§5.4, §13).
 */
export type Bloc =
  | { readonly type: 'p'; readonly texte: string }
  | { readonly type: 'h2'; readonly texte: string }
  | { readonly type: 'clause'; readonly texte: string; readonly source: string }
  | { readonly type: 'liste'; readonly items: readonly string[] }
  | { readonly type: 'encadre'; readonly titre: string; readonly texte: string }

export type Article = {
  readonly slug: string
  readonly titre: string
  /** Resume affiche a l'index et servi en meta description. */
  readonly chapo: string
  /** Date de publication, ISO 8601. */
  readonly publieLe: string
  readonly minutes: number
  /** Identifiants de controles que l'article illustre — le lien vers le produit. */
  readonly controles: readonly string[]
  readonly blocs: readonly Bloc[]
}

export const ARTICLES: readonly Article[] = [
  {
    slug: 'le-loyer-continue-la-perte-d-exploitation-s-arrete',
    titre: 'Le loyer continue, la perte d’exploitation s’arrête',
    chapo:
      'L’écart le plus coûteux que nous voyons ne se lit ni dans le bail, ni dans la police. Il n’apparaît qu’en mettant deux durées côte à côte.',
    publieLe: '2026-06-12',
    minutes: 6,
    controles: ['SIN-01', 'IND-02'],
    blocs: [
      {
        type: 'p',
        texte:
          'Un bail commercial prévoit ce qui se passe après un sinistre majeur. Le local est inutilisable, la reconstruction dure, et la question devient : qui paie le loyer pendant ce temps ? La réponse tient souvent en une ligne, que personne ne relit.',
      },
      {
        type: 'clause',
        source: 'Rédaction synthétique, représentative',
        texte:
          '« Le loyer restera intégralement dû pendant toute la durée des travaux de reconstruction. Le Preneur ne pourra résilier qu’au-delà de vingt-quatre (24) mois d’inutilisabilité. »',
      },
      {
        type: 'p',
        texte:
          'Côté police, la perte d’exploitation existe. Elle est souscrite, elle figure aux conditions particulières, et l’attestation la mentionne. Tout paraît en ordre — jusqu’au moment où l’on compare les deux durées.',
      },
      {
        type: 'p',
        texte:
          'Douze mois de période d’indemnisation contre vingt-quatre mois de loyer dû, c’est douze mois de loyer à payer sans un euro d’indemnité en face. Sur un local à 8 000 € par mois, l’écart pèse près de 100 000 €. Personne ne l’a caché : simplement, les deux documents n’ont jamais été lus l’un en face de l’autre.',
      },
      { type: 'h2', texte: 'Pourquoi cet écart survit à toutes les relectures' },
      {
        type: 'p',
        texte:
          'Parce que chaque document, pris isolément, est irréprochable. Le bail stipule une durée conforme à l’usage. La police garantit une perte d’exploitation réelle. L’attestation coche la case. Il faut confronter une durée à une autre durée pour que le défaut existe.',
      },
      {
        type: 'p',
        texte:
          'C’est ce que nous appelons un contrôle de croisement : sans les deux pièces, il n’a pas de réponse. Un outil honnête doit alors le dire — « à vérifier manuellement » — plutôt que de conclure sur une seule source.',
      },
      { type: 'h2', texte: 'Ce qu’il faut regarder, dans l’ordre' },
      {
        type: 'liste',
        items: [
          'La durée pendant laquelle le loyer reste dû, en mois, et non « le loyer est-il suspendu ».',
          'La période d’indemnisation de la perte d’exploitation aux conditions particulières — l’attestation ne la porte presque jamais.',
          'Le seuil d’inutilisabilité qui ouvre le droit de résilier : s’il est plus long que la période de PE, il ne protège personne.',
          'La franchise en jours, qui ampute le début de la période garantie.',
          'À qui l’indemnité de perte d’exploitation est acquise : une délégation au bailleur la rend indisponible pour financer la reprise.',
        ],
      },
      {
        type: 'encadre',
        titre: 'La correction se fait côté bail d’abord',
        texte:
          'Étendre la période de perte d’exploitation à vingt-quatre mois coûte une prime, tous les ans. Obtenir la suspension du loyer pendant l’inutilisabilité ne coûte qu’une négociation, une fois. La question se pose dans cet ordre, et le chiffrage de l’extension n’arrive qu’en second, si le bailleur refuse.',
      },
      {
        type: 'p',
        texte:
          'Un rapport utile ne dit pas « écart sur la perte d’exploitation ». Il dit : vingt-quatre mois de loyer dû, douze mois indemnisés, douze mois d’exposition, voici la rédaction de remplacement à proposer et voici la pièce à verser au dossier pour clore le point.',
      },
    ],
  },
  {
    slug: 'renonciation-a-recours-la-clause-que-la-police-ne-suit-pas',
    titre: 'Renonciation à recours : la clause que la police ne suit pas',
    chapo:
      'Le bail organise une renonciation réciproque. Encore faut-il que les assureurs des deux parties l’aient acceptée — et c’est rarement vérifié.',
    publieLe: '2026-07-03',
    minutes: 5,
    controles: ['RR-01', 'RR-04'],
    blocs: [
      {
        type: 'p',
        texte:
          'La renonciation à recours est une mécanique élégante : chaque partie renonce à agir contre l’autre pour les dommages assurés, et fait renoncer son assureur. Elle évite des contentieux entiers. Elle ne fonctionne que si les deux moitiés existent.',
      },
      {
        type: 'clause',
        source: 'Rédaction synthétique, représentative',
        texte:
          '« Le Bailleur et le Preneur renoncent réciproquement à tous recours l’un contre l’autre et s’engagent à faire renoncer leurs assureurs respectifs. »',
      },
      {
        type: 'p',
        texte:
          'La première moitié — la renonciation des parties — tient dans le bail. La seconde — celle des assureurs — dépend d’une clause de la police, que le bail ne peut pas créer. Si elle manque, la renonciation est bancale : la partie a renoncé, son assureur non, et il exercera son recours subrogatoire.',
      },
      { type: 'h2', texte: 'Le défaut se voit en trois questions' },
      {
        type: 'liste',
        items: [
          'La police du preneur porte-t-elle une renonciation à recours au profit du bailleur, nommément ?',
          'Est-elle réciproque, ou seulement à sens unique — ce qui est le cas le plus fréquent ?',
          'Couvre-t-elle le même périmètre de dommages que la clause du bail, ou seulement l’incendie et les dégâts des eaux ?',
        ],
      },
      {
        type: 'p',
        texte:
          'La troisième question est la plus souvent négligée. Un bail qui renonce sur « tous dommages » face à une police qui renonce sur « incendie, explosion et dégâts des eaux » laisse un espace non couvert dont personne ne se souvient au moment du sinistre.',
      },
      { type: 'h2', texte: 'Ce qui ne se rattrape pas par une police' },
      {
        type: 'p',
        texte:
          'Une renonciation unilatérale, où le preneur renonce sans que le bailleur en fasse autant, n’est pas un défaut d’assurance : c’est un déséquilibre de rédaction. Aucune police ne le corrige, et présenter une extension de garantie comme la solution reviendrait à faire payer au preneur une clause qu’il n’aurait pas dû accepter.',
      },
      {
        type: 'p',
        texte:
          'C’est la ligne que nous tenons partout : la correction contractuelle passe en premier. Le programme d’assurance s’adapte ensuite, si la négociation échoue — et le rapport le formule dans cet ordre.',
      },
    ],
  },
  {
    slug: 'une-attestation-ne-prouve-pas-une-couverture',
    titre: 'Une attestation ne prouve pas une couverture',
    chapo:
      'L’attestation d’assurance est la pièce que tout le monde réclame et que personne ne peut opposer. Voici ce qu’elle démontre, et ce qu’elle ne démontre pas.',
    publieLe: '2026-07-28',
    minutes: 5,
    controles: ['FOR-01', 'FOR-02'],
    blocs: [
      {
        type: 'p',
        texte:
          'Un bail exige une attestation annuelle, sous huit jours, sous peine de résiliation de plein droit. Le preneur l’envoie, le bailleur la classe, et le dossier est réputé conforme. Il ne l’est pas : l’attestation prouve qu’un contrat existe, pas ce qu’il couvre.',
      },
      { type: 'h2', texte: 'Ce qu’une attestation dit réellement' },
      {
        type: 'liste',
        items: [
          'Qu’un contrat est en cours à la date d’émission — et à cette date seulement.',
          'Le nom de l’assuré, celui de la compagnie, un numéro de police.',
          'Une liste de garanties, en intitulés, sans montants ni sous-limites la plupart du temps.',
        ],
      },
      { type: 'h2', texte: 'Ce qu’elle ne dit pas' },
      {
        type: 'liste',
        items: [
          'Les montants garantis, les sous-limites et les franchises.',
          'Les exclusions applicables, qui vivent aux conditions générales.',
          'La durée d’indemnisation des pertes d’exploitation ou de loyers.',
          'Si la renonciation à recours est acquise, et à quel périmètre.',
          'Si le contrat sera encore en vigueur demain : une attestation ne vaut pas engagement de maintien.',
        ],
      },
      {
        type: 'encadre',
        titre: 'La bonne demande',
        texte:
          'Demander « l’attestation » revient à demander la couverture d’un livre par son titre. La demande utile cite les garanties exigées par le bail, une par une, et réclame les conditions particulières.',
      },
      {
        type: 'p',
        texte:
          'C’est aussi pourquoi obtenir la bonne pièce n’est pas un événement mais une relance. Huit jours, quinze jours, trente jours : le calendrier n’est pas un confort d’organisation, c’est la trace que la diligence a été faite — et c’est cette trace que l’on produit le jour où le point est contesté.',
      },
    ],
  },
]

export const ARTICLES_RECENTS = [...ARTICLES].sort((a, b) =>
  b.publieLe.localeCompare(a.publieLe),
)

export const article = (slug: string): Article | undefined =>
  ARTICLES.find((entree) => entree.slug === slug)
