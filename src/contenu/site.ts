/**
 * Plan du site (brief §9).
 *
 * Source unique : la navigation, le pied de page, `sitemap.xml` et les tests
 * lisent tous ce fichier. Une page ajoutee sans etre declaree ici serait
 * orpheline — invisible dans la navigation, absente du plan de site, et donc
 * jamais indexee. Un test verifie qu'aucune route ne manque a l'appel.
 */
import { Famille, LIBELLE_FAMILLE, NOMBRE_CONTROLES } from '@/domain/controles'

/**
 * Origine canonique. Elle sert aux URL absolues : Open Graph, plan de site,
 * balises canoniques. En developpement, localhost suffit ; en production, la
 * variable est fournie par l'hebergeur.
 */
export const ORIGINE =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clauzy.fr'

export const url = (chemin: string): string => new URL(chemin, ORIGINE).href

/**
 * Metadonnees de partage d'une page (brief §9).
 *
 * Elle existe pour une raison precise : dans Next, une page qui redefinit
 * `openGraph` REMPLACE l'objet du layout au lieu de le completer. Une page qui
 * se contente d'annoncer son titre perd donc l'image de partage, sans rien
 * signaler — et cela ne se voit qu'une fois le lien colle dans une
 * conversation. Passer par cette fonction rend l'oubli impossible.
 */
export const partage = (options: {
  readonly titre: string
  readonly description: string
  readonly chemin: string
  readonly type?: 'website' | 'article'
  readonly publieLe?: string
}) => {
  const adresse = url(options.chemin)
  const image = { url: url('/opengraph-image'), width: 1200, height: 630, alt: options.titre }

  return {
    alternates: { canonical: adresse },
    openGraph: {
      type: options.type ?? 'website',
      locale: 'fr_FR',
      siteName: 'Clauzy',
      title: options.titre,
      description: options.description,
      url: adresse,
      images: [image],
      ...(options.publieLe === undefined ? {} : { publishedTime: options.publieLe }),
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: options.titre,
      description: options.description,
      images: [image.url],
    },
  }
}

/** Rubrique du plan de site. `nav` marque ce qui figure dans l'en-tete. */
export type Page = {
  readonly chemin: string
  readonly titre: string
  /** Libelle court, pour la navigation. */
  readonly nav?: string
  /** Priorite dans le plan de site, entre 0 et 1. */
  readonly priorite: number
  readonly rubrique: 'produit' | 'preuve' | 'contenu' | 'legal' | 'application'
}

/** Slug d'une famille, tel qu'il apparait dans l'URL. */
export const SLUG_FAMILLE: Record<Famille, string> = {
  [Famille.PERIMETRE_DOCUMENTAIRE]: 'perimetre-documentaire',
  [Famille.GARANTIES_FONDAMENTALES]: 'garanties-fondamentales',
  [Famille.DOMMAGES_AUX_BIENS]: 'dommages-aux-biens',
  [Famille.RENONCIATION_RECOURS]: 'renonciation-a-recours',
  [Famille.INDEMNITES]: 'indemnites',
  [Famille.SINISTRE_MAJEUR]: 'sinistre-majeur',
  [Famille.RESPONSABILITE_CIVILE]: 'responsabilite-civile',
  [Famille.RISQUES_PARTICULIERS]: 'risques-particuliers',
  [Famille.TRAVAUX]: 'travaux',
  [Famille.OBLIGATIONS_FORMELLES]: 'obligations-formelles',
  [Famille.ARTICULATION_CONTRACTUELLE]: 'articulation-contractuelle',
}

export const FAMILLE_PAR_SLUG: ReadonlyMap<string, Famille> = new Map(
  Object.entries(SLUG_FAMILLE).map(([famille, slug]) => [slug, famille as Famille]),
)

export const PAGES: readonly Page[] = [
  { chemin: '/', titre: 'Le bail promet, la police suit-elle ?', priorite: 1, rubrique: 'produit' },
  { chemin: '/methode', titre: 'La méthode', nav: 'Méthode', priorite: 0.9, rubrique: 'produit' },
  {
    chemin: '/controles',
    // Dérivé, jamais recopié : le référentiel grandit, et une page qui
    // annonce un chiffre que le produit n'applique plus est un mensonge.
    titre: `Les ${NOMBRE_CONTROLES} contrôles`,
    nav: 'Contrôles',
    priorite: 0.9,
    rubrique: 'produit',
  },
  ...Object.values(Famille).map((famille) => ({
    chemin: `/controles/${SLUG_FAMILLE[famille]}`,
    titre: LIBELLE_FAMILLE[famille],
    priorite: 0.8,
    rubrique: 'produit' as const,
  })),
  { chemin: '/livrable', titre: 'Le livrable', nav: 'Livrable', priorite: 0.9, rubrique: 'produit' },
  { chemin: '/securite', titre: 'Sécurité', nav: 'Sécurité', priorite: 0.9, rubrique: 'preuve' },
  { chemin: '/tarifs', titre: 'Tarifs', nav: 'Tarifs', priorite: 0.9, rubrique: 'produit' },
  { chemin: '/faq', titre: 'Questions fréquentes', nav: 'FAQ', priorite: 0.7, rubrique: 'contenu' },
  { chemin: '/blog', titre: 'Le carnet', nav: 'Carnet', priorite: 0.7, rubrique: 'contenu' },
  { chemin: '/demo', titre: 'Réserver une démonstration', priorite: 0.6, rubrique: 'produit' },
  { chemin: '/mentions-legales', titre: 'Mentions légales', priorite: 0.3, rubrique: 'legal' },
  { chemin: '/cgu', titre: 'Conditions générales', priorite: 0.3, rubrique: 'legal' },
  { chemin: '/confidentialite', titre: 'Politique de confidentialité', priorite: 0.3, rubrique: 'legal' },
  { chemin: '/dpa', titre: 'Accord de traitement des données', priorite: 0.3, rubrique: 'legal' },
]

export const NAVIGATION: readonly Page[] = PAGES.filter((page) => page.nav !== undefined)

export const PAGES_LEGALES: readonly Page[] = PAGES.filter((page) => page.rubrique === 'legal')

/**
 * L'application elle-meme n'est pas indexee : c'est un outil de travail, pas
 * une page de contenu, et rien n'y est lisible sans dossier ouvert.
 */
export const CHEMINS_NON_INDEXES: readonly string[] = ['/dossier']
