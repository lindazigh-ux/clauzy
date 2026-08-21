import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { FilStructure } from '../../composants/DonneesStructurees'
import { FicheControle, LIBELLE_GRAVITE } from '../FicheControle'
import { FAMILLE_PAR_SLUG, SLUG_FAMILLE, partage } from '@/contenu/site'
import { ARTICLES } from '@/contenu/blog'
import {
  Famille,
  LIBELLE_FAMILLE,
  NOMBRE_CONTROLES,
  aUnRepliAssurance,
  parFamille,
} from '@/domain/controles'

import styles from '../../site.module.css'
import propres from '../controles.module.css'

/**
 * Une page par famille de controles (brief §9).
 *
 * C'est le contenu SEO a forte valeur du produit, et il est integralement
 * derive du referentiel : intitules, gravites, consequences, corrections et
 * redactions de remplacement viennent du meme fichier que celui que le moteur
 * execute. Une page ne peut donc pas survivre a un controle qui a change, ni
 * decrire un controle qui n'existe pas.
 *
 * Les pages sont pre-rendues : dix familles connues a l'avance, aucune raison
 * de les calculer a la demande.
 */
type Parametres = { params: Promise<{ famille: string }> }

export function generateStaticParams() {
  return Object.values(Famille).map((famille) => ({ famille: SLUG_FAMILLE[famille] }))
}

/**
 * Presentation de chaque famille : ce que le lecteur doit comprendre avant
 * d'attaquer les fiches. Une famille sans introduction n'est qu'une liste.
 */
const INTRODUCTION: Record<Famille, string> = {
  [Famille.PERIMETRE_DOCUMENTAIRE]:
    'Avant toute comparaison de garanties, il faut s’assurer que le bail et la police parlent du même preneur, du même local et de la même activité. Une police souscrite au nom d’une filiale, sur une adresse ancienne, ou pour une activité qui a évolué, ne couvre pas ce que le bail exige — et personne ne s’en aperçoit avant le sinistre.',
  [Famille.DOMMAGES_AUX_BIENS]:
    'Le cœur du transfert de risque : qui assure quoi, à quelle valeur, avec quelles extensions. C’est la famille où les écarts se chiffrent le plus directement, parce qu’une valeur assurée se compare à une valeur exigée.',
  [Famille.RENONCIATION_RECOURS]:
    'La renonciation à recours n’a de valeur que si les deux moitiés existent : celle des parties, qui vit dans le bail, et celle des assureurs, qui vit dans les polices. Le bail ne peut pas créer la seconde. C’est le contrôle de croisement par excellence.',
  [Famille.INDEMNITES]:
    'À qui l’indemnité est-elle acquise ? Une garantie souscrite dont l’indemnité est captée par le bailleur ne finance pas la reprise d’activité du preneur. La question du bénéficiaire est aussi décisive que celle du montant.',
  [Famille.SINISTRE_MAJEUR]:
    'Ce qui se passe quand le local devient inutilisable : le loyer reste-t-il dû, pendant combien de temps, et l’indemnité suit-elle ? C’est là que se logent les écarts de durée les plus coûteux, invisibles tant qu’on ne confronte pas deux calendriers.',
  [Famille.RESPONSABILITE_CIVILE]:
    'La responsabilité du preneur envers le bailleur, les voisins et les tiers. Les montants exigés par le bail et les montants souscrits divergent souvent, et les sous-limites — voisins et tiers, notamment — sont rarement lues.',
  [Famille.RISQUES_PARTICULIERS]:
    'Les risques que le local ou l’activité rendent spécifiques, et que la police standard n’a pas prévus. Une clause générale du bail ne dispense pas de vérifier que la garantie correspondante a bien été souscrite.',
  [Famille.TRAVAUX]:
    'Aménagements, embellissements, travaux du preneur : qui les assure, à quelle valeur, et à qui reviennent-ils en fin de bail. Une famille où la rédaction du bail décide de tout, et où l’assurance ne fait que suivre.',
  [Famille.OBLIGATIONS_FORMELLES]:
    'Délais, attestations, sanctions, souscriptions d’office. Aucune police ne répond à ces points : ils se règlent dans la rédaction et dans la diligence. C’est pourtant sur eux que se perdent les résiliations de plein droit.',
  [Famille.ARTICULATION_CONTRACTUELLE]:
    'La cohérence de l’ensemble : ce qui prime sur quoi, ce que les annexes ajoutent, et comment les clauses d’assurance se combinent avec le reste du bail. Un défaut ici contamine toutes les autres familles.',
}

const famille = (slug: string): Famille | undefined => FAMILLE_PAR_SLUG.get(slug)

export async function generateMetadata({ params }: Parametres): Promise<Metadata> {
  const { famille: slug } = await params
  const valeur = famille(slug)
  if (valeur === undefined) return {}

  const controles = parFamille(valeur)
  const libelle = LIBELLE_FAMILLE[valeur]
  const description = `${controles.length} contrôles d’assurance de bail commercial sur ${libelle.toLowerCase()} : ${controles
    .map((c) => c.titre.toLowerCase())
    .join(', ')}. Conséquence, correction et rédaction de remplacement pour chacun.`

  return {
    title: libelle,
    description: description.slice(0, 300),
    ...partage({
      titre: `${libelle} — les contrôles`,
      description: INTRODUCTION[valeur],
      chemin: `/controles/${slug}`,
      type: 'article',
    }),
  }
}

export default async function PageFamille({ params }: Parametres) {
  const { famille: slug } = await params
  const valeur = famille(slug)
  if (valeur === undefined) notFound()

  const controles = parFamille(valeur)
  const libelle = LIBELLE_FAMILLE[valeur]
  const sansRepli = controles.filter((c) => !aUnRepliAssurance(c))
  const articles = ARTICLES.filter((a) => a.controles.some((id) => controles.some((c) => c.id === id)))

  const voisines = Object.values(Famille).filter((autre) => autre !== valeur)

  return (
    <main className="page">
      <FilStructure
        etapes={[
          { nom: 'Accueil', chemin: '/' },
          { nom: 'Les 40 contrôles', chemin: '/controles' },
          { nom: libelle, chemin: `/controles/${slug}` },
        ]}
      />

      <p className={styles.fil}>
        <Link href="/controles">Les {NOMBRE_CONTROLES} contrôles</Link> · {libelle}
      </p>

      <span className={styles.surtitre}>
        {controles.length} contrôle{controles.length > 1 ? 's' : ''} ·{' '}
        {controles.map((c) => c.id).join(' · ')}
      </span>
      <h1>{libelle}</h1>
      <p className={styles.chapo}>{INTRODUCTION[valeur]}</p>

      {sansRepli.length > 0 && (
        <div className={styles.encadre}>
          <h2>
            {sansRepli.length} de ces {controles.length} contrôles ne se corrigent que dans le bail
          </h2>
          <p>
            Sur {sansRepli.map((c) => c.id).join(', ')}, aucune police ne rattrape la rédaction. Le
            rapport l’écrit explicitement plutôt que de laisser la case vide, et propose la
            rédaction de remplacement. Le programme d’assurance n’intervient qu’en second, si la
            négociation échoue.
          </p>
        </div>
      )}

      <section className={styles.sectionSerree}>
        <h2>Les contrôles, un par un</h2>
        {controles.map((controle) => (
          <FicheControle key={controle.id} controle={controle} />
        ))}
      </section>

      <section className={styles.section}>
        <h2>Comment lire une gravité</h2>
        <div className={styles.tableauEnveloppe}>
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th scope="col">Gravité</th>
                <th scope="col">Ce que cela déclenche</th>
                <th scope="col">Dans cette famille</th>
              </tr>
            </thead>
            <tbody>
              {([3, 2, 1] as const).map((gravite) => (
                <tr key={gravite}>
                  <th scope="row">{LIBELLE_GRAVITE[gravite]}</th>
                  <td>
                    {gravite === 3
                      ? 'Remonte en tête de synthèse, avec son enjeu chiffré quand il est calculable.'
                      : gravite === 2
                        ? 'Rejoint la liste des points à porter en négociation.'
                        : 'Signalé au rapport, sans remonter en synthèse.'}
                  </td>
                  <td>
                    {controles.filter((c) => c.gravite === gravite).map((c) => c.id).join(', ') ||
                      '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {articles.length > 0 && (
        <section className={styles.section}>
          <h2>À lire sur cette famille</h2>
          <div className={styles.grille}>
            {articles.map((entree) => (
              <Link key={entree.slug} href={`/blog/${entree.slug}`} className={styles.carteLien}>
                <span className={styles.carteMeta}>{entree.minutes} min de lecture</span>
                <h3>{entree.titre}</h3>
                <p>{entree.chapo}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2>Les autres familles</h2>
        <div className={styles.grille}>
          {voisines.map((autre) => (
            <Link
              key={autre}
              href={`/controles/${SLUG_FAMILLE[autre]}`}
              className={propres.familleCarte}
            >
              <span className={propres.familleReferences}>
                {parFamille(autre).length} contrôle{parFamille(autre).length > 1 ? 's' : ''}
              </span>
              <h3 className={propres.familleTitre}>{LIBELLE_FAMILLE[autre]}</h3>
            </Link>
          ))}
        </div>

        <div className={styles.appels}>
          <Link href="/dossier" className={styles.boutonPrimaire}>
            Appliquer ces contrôles à un bail
          </Link>
        </div>
      </section>
    </main>
  )
}
