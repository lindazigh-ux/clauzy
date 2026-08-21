import { ORIGINE, url } from '@/contenu/site'
import { FAQ } from '@/contenu/faq'
import { NOMBRE_CONTROLES } from '@/domain/controles'
import { PLANS } from '@/contenu/tarifs'

/**
 * Balisage JSON-LD (brief §9).
 *
 * Il est genere depuis les memes sources que les pages : le `FAQPage` derive
 * de `src/contenu/faq.ts`, l'offre derive de `src/contenu/tarifs.ts`. Un
 * balisage qui annonce autre chose que la page visible est sanctionne par les
 * moteurs, et serait ici un mensonge de plus sur un produit vendu sur la
 * transparence.
 */
const Balise = ({ donnees }: { donnees: object }) => (
  <script
    type="application/ld+json"
    // Contenu statique, ecrit par nous : aucune entree utilisateur n'y entre.
    dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees) }}
  />
)

export const organisation = {
  '@type': 'Organization',
  '@id': `${ORIGINE}#organisation`,
  name: 'Clauzy',
  url: ORIGINE,
  description:
    'Clauzy confronte les obligations d’assurance d’un bail commercial aux couvertures réellement souscrites.',
}

export function LogicielStructure() {
  const payants = PLANS.filter((plan) => plan.mensuel !== null && plan.mensuel > 0)

  return (
    <Balise
      donnees={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Clauzy',
        url: ORIGINE,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Analyse de conformité assurantielle',
        operatingSystem: 'Navigateur web',
        inLanguage: 'fr-FR',
        description: `Clauzy réconcilie les obligations d’assurance d’un bail commercial avec la couverture réellement souscrite, applique ${NOMBRE_CONTROLES} contrôles et produit une note de conseil opposable. L’analyse se fait entièrement dans le navigateur.`,
        featureList: [
          `${NOMBRE_CONTROLES} contrôles appliqués à chaque dossier, sans exception`,
          'Analyse locale : aucun document transmis',
          'Note Word annotée, commentaires ancrés aux clauses',
          'Rapport client PDF aux couleurs du cabinet',
          'Suivi d’attestation et calendrier de relance',
        ],
        publisher: organisation,
        offers: payants.map((plan) => ({
          '@type': 'Offer',
          name: plan.nom,
          price: String(plan.mensuel),
          priceCurrency: 'EUR',
          url: url('/tarifs'),
          category: 'Abonnement mensuel',
        })),
      }}
    />
  )
}

export function FaqStructuree() {
  return (
    <Balise
      donnees={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: 'fr-FR',
        mainEntity: FAQ.map((entree) => ({
          '@type': 'Question',
          name: entree.question,
          acceptedAnswer: { '@type': 'Answer', text: entree.reponse.join(' ') },
        })),
      }}
    />
  )
}

export function ArticleStructure({
  titre,
  chapo,
  publieLe,
  chemin,
}: {
  titre: string
  chapo: string
  publieLe: string
  chemin: string
}) {
  return (
    <Balise
      donnees={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: titre,
        description: chapo,
        datePublished: publieLe,
        inLanguage: 'fr-FR',
        mainEntityOfPage: url(chemin),
        author: organisation,
        publisher: organisation,
      }}
    />
  )
}

export function FilStructure({ etapes }: { etapes: readonly { nom: string; chemin: string }[] }) {
  return (
    <Balise
      donnees={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: etapes.map((etape, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: etape.nom,
          item: url(etape.chemin),
        })),
      }}
    />
  )
}
