/**
 * Questions frequentes (brief §9).
 *
 * Source unique : la page /faq et le JSON-LD `FAQPage` lisent ce fichier. Un
 * balisage structure qui annonce autre chose que la page visible est une
 * pratique sanctionnee par les moteurs — et, ici, un mensonge de plus sur un
 * produit vendu sur la transparence.
 *
 * Les reponses n'esquivent pas. « Clauzy remplace-t-il un avocat » se repond
 * par non, pas par une periphrase : le §13 interdit de presenter une sortie du
 * moteur comme un avis juridique, et une FAQ evasive est deja une infraction.
 */
import { NOMBRE_CONTROLES } from '@/domain/controles'

export type QuestionReponse = {
  readonly question: string
  /** Reponse en paragraphes. Le premier tranche, les suivants expliquent. */
  readonly reponse: readonly string[]
  readonly rubrique: 'Confidentialité' | 'Méthode' | 'Portée' | 'Pratique'
}

export const FAQ: readonly QuestionReponse[] = [
  {
    question: 'Mes documents partent-ils sur vos serveurs ?',
    rubrique: 'Confidentialité',
    reponse: [
      'Non, et ce n’est pas une politique : c’est une impossibilité technique. Le bail, les conditions générales et particulières, les avenants et les courriels sont lus, découpés et analysés par votre navigateur. Rien n’est téléversé.',
      'Une seule couche du code sait ouvrir une connexion réseau, et elle refuse tout champ qui n’est pas déclaré au catalogue publié sur notre page sécurité. Un test d’architecture échoue si un module d’analyse tente seulement de l’importer.',
    ],
  },
  {
    question: 'Pourquoi pas simplement un assistant IA généraliste ?',
    rubrique: 'Méthode',
    reponse: [
      'Parce qu’un assistant généraliste répond à ce qu’on lui demande, et se tait sur ce qu’on ne lui a pas demandé. C’est exactement le mode de défaillance qu’un devoir de conseil ne pardonne pas.',
      `Clauzy applique les mêmes ${NOMBRE_CONTROLES} contrôles à chaque dossier, dans le même ordre, et rend ${NOMBRE_CONTROLES} résultats — y compris pour les contrôles qu’il n’a pas su trancher, qui ressortent « à vérifier manuellement ». Un rapport qui omet une ligne se lit comme « pas de problème sur ce point », ce qui est faux.`,
      'Il faut y ajouter la confidentialité : envoyer un bail commercial et le programme d’assurance d’un client à un service tiers est une décision que peu de directions juridiques prennent à la légère.',
    ],
  },
  {
    question: 'Clauzy remplace-t-il un avocat ou un courtier ?',
    rubrique: 'Portée',
    reponse: [
      'Non. Clauzy est un outil d’aide au conseil : il prépare le travail, il ne le signe pas. Le rapport porte cette mention et sort sous votre nom, pas sous le nôtre.',
      'Ce que l’outil produit n’est ni un avis juridique, ni une garantie de couverture. Il ne dispense pas de l’examen des conditions générales et particulières des polices, ni de la consultation d’un conseil. C’est écrit sur chaque livrable.',
    ],
  },
  {
    question: 'Que se passe-t-il quand le moteur ne comprend pas une clause ?',
    rubrique: 'Méthode',
    reponse: [
      'Le contrôle ressort « à vérifier manuellement », en toutes lettres, avec sa place dans la matrice et sa gravité. Il n’est jamais masqué ni silencieusement classé conforme.',
      'C’est la règle la plus stricte du produit : un faux négatif silencieux est le pire défaut possible sur un outil qui touche au devoir de conseil. Mieux vaut une ligne qui dit « je ne sais pas » qu’une ligne absente.',
    ],
  },
  {
    question: 'Le bail de mon client est atypique. Est-ce que ça marche quand même ?',
    rubrique: 'Méthode',
    reponse: [
      'Oui, parce que vous n’êtes pas prisonnier du moteur. Quand une rédaction inhabituelle échappe à la détection, vous sélectionnez le passage dans le lecteur et vous le rattachez au contrôle concerné.',
      'Le rattachement porte les positions exactes du texte : le commentaire ancré dans la note Word exportée pointe le passage que vous avez désigné, au caractère près.',
    ],
  },
  {
    question: 'Quels formats lisez-vous ?',
    rubrique: 'Pratique',
    reponse: [
      'PDF, Word (.docx), courriels Outlook (.msg) et texte brut. Les pièces jointes d’un courriel sont lues à leur tour — l’attestation arrive presque toujours agrafée à un mail.',
      'Le format est déduit du contenu du fichier, pas de son extension : un PDF renommé en .docx se lit quand même.',
    ],
  },
  {
    question: 'Et si le bail n’est qu’un scan ?',
    rubrique: 'Pratique',
    reponse: [
      'Un scan sans couche texte ne donne rien à analyser, et l’outil vous le dit page par page plutôt que de rendre un rapport vide qui aurait l’air complet.',
      `Deux issues : redemander une version avec couche texte, ou rattacher les clauses à la main dans le lecteur. Les ${NOMBRE_CONTROLES} contrôles restent applicables dans les deux cas.`,
    ],
  },
  {
    question: 'Le rapport sort-il à mes couleurs ou aux vôtres ?',
    rubrique: 'Pratique',
    reponse: [
      'Aux vôtres. Vous renseignez le nom du cabinet, sa couleur, le praticien signataire et sa qualité ; la page de garde et les en-têtes s’y conforment.',
      'Votre client achète une analyse, pas notre abonnement. Notre marque reste en pied de page.',
    ],
  },
  {
    question: 'Que devient mon dossier si je ferme l’onglet ?',
    rubrique: 'Pratique',
    reponse: [
      'Rien n’est conservé automatiquement, puisque rien n’est envoyé nulle part. Vous enregistrez le dossier dans un fichier .clauzy, chiffré par un mot de passe que vous choisissez, et vous le rouvrez tel quel.',
      'Le fichier contient l’analyse, vos ajustements, vos motifs et le périmètre. Il vit sur votre poste ou sur le partage de votre cabinet — jamais chez nous.',
    ],
  },
  {
    question: 'Combien de temps prend une analyse ?',
    rubrique: 'Pratique',
    reponse: [
      `Le moteur rend ses ${NOMBRE_CONTROLES} résultats en quelques secondes. Le temps réel est celui de la reprise à la main : lire les écarts, écarter les faux positifs avec un motif, chiffrer, rédiger.`,
      'C’est le travail que vous factureriez de toute façon. Ce que l’outil supprime, c’est la relecture ligne à ligne du bail et le risque d’avoir sauté un point.',
    ],
  },
  {
    question: 'Puis-je ajouter mes propres contrôles ?',
    rubrique: 'Portée',
    reponse: [
      'Une observation libre s’ajoute à tout dossier et rejoint le rapport, avec sa gravité. C’est la soupape : ce que vous voyez et que le référentiel ne couvre pas.',
      'Les contrôles sur mesure, versés au référentiel de votre organisation, relèvent de l’offre grands comptes. Un identifiant de contrôle existant n’est jamais renuméroté : une référence citée dans un rapport de l’an dernier reste valide.',
    ],
  },
  {
    question: 'Le bail ou la police : lequel corrige-t-on d’abord ?',
    rubrique: 'Méthode',
    reponse: [
      'Le bail. Toujours en premier, et l’outil ne permet pas de présenter les choses dans l’autre sens.',
      'Sur près de la moitié des contrôles, aucune police ne rattrape la rédaction : le transfert de risque est déséquilibré, ou la clause est de pure procédure. Le rapport l’écrit noir sur blanc au lieu de laisser la case vide. L’adaptation du programme d’assurance n’intervient qu’en second, si la négociation contractuelle échoue.',
    ],
  },
]

export const RUBRIQUES_FAQ = ['Confidentialité', 'Méthode', 'Portée', 'Pratique'] as const
