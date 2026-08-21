import type { Metadata } from 'next'
import Link from 'next/link'

import { FilStructure } from '../composants/DonneesStructurees'
import { SLUG_FAMILLE, partage } from '@/contenu/site'
import {
  Famille,
  LIBELLE_FAMILLE,
  NOMBRE_CONTROLES,
  Nature,
  REFERENTIEL,
  aUnRepliAssurance,
  parFamille,
} from '@/domain/controles'

import styles from '../site.module.css'
import propres from './controles.module.css'

export const metadata: Metadata = {
  title: `Les ${NOMBRE_CONTROLES} contrôles`,
  description:
    `Le référentiel complet appliqué à chaque bail commercial : ${NOMBRE_CONTROLES} contrôles, ${Object.values(Famille).length} familles, des risques locatifs aux obligations formelles. Chacun avec sa conséquence, sa correction et sa rédaction de remplacement.`,
  ...partage({
    titre: `Les ${NOMBRE_CONTROLES} contrôles — Clauzy`,
    description:
      'Le référentiel complet, famille par famille : ce que chaque clause doit faire, ce qu’on risque, et la rédaction de remplacement.',
    chemin: '/controles',
  }),
}

/**
 * Index du referentiel (brief §9).
 *
 * Le brief designe cette rubrique comme le contenu SEO a forte valeur. Elle
 * est generee depuis le referentiel lui-meme : elle ne peut pas annoncer un
 * controle que le produit n'applique pas, ni en oublier un.
 */
export default function IndexControles() {
  const familles = Object.values(Famille).map((famille) => {
    const controles = parFamille(famille)
    return {
      famille,
      libelle: LIBELLE_FAMILLE[famille],
      controles,
      critiques: controles.filter((c) => c.gravite === 3).length,
    }
  })

  const critiques = REFERENTIEL.filter((c) => c.gravite === 3).length
  const croisements = REFERENTIEL.filter(
    (c) => c.nature === Nature.CROISEMENT || c.nature === Nature.DOUBLE,
  ).length
  const sansRepli = REFERENTIEL.filter((c) => !aUnRepliAssurance(c)).length

  return (
    <main className="page">
      <FilStructure
        etapes={[
          { nom: 'Accueil', chemin: '/' },
          { nom: `Les ${NOMBRE_CONTROLES} contrôles`, chemin: '/controles' },
        ]}
      />

      <span className={styles.surtitre}>Le référentiel</span>
      <h1>Les {NOMBRE_CONTROLES} contrôles, en entier</h1>
      <p className={styles.chapo}>
        Ce référentiel est appliqué intégralement à chaque dossier. Il est publié ici tel qu’il est
        exécuté : même intitulé, même gravité, même rédaction de remplacement. Rien n’est réécrit
        pour la vitrine.
      </p>

      <div className={styles.tableauEnveloppe}>
        <table className={styles.tableau}>
          <caption className="visuallyHidden">Répartition du référentiel</caption>
          <thead>
            <tr>
              <th scope="col">Lecture</th>
              <th scope="col">Nombre</th>
              <th scope="col">Ce que cela veut dire</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Contrôles</th>
              <td>{NOMBRE_CONTROLES}</td>
              <td>Appliqués à chaque dossier, sans exception, y compris sans réponse.</td>
            </tr>
            <tr>
              <th scope="row">Critiques</th>
              <td>{critiques}</td>
              <td>Un défaut qui expose directement le preneur ou le bailleur.</td>
            </tr>
            <tr>
              <th scope="row">Croisements</th>
              <td>{croisements}</td>
              <td>
                Ne se tranchent qu’avec les pièces d’assurance. Sans elles, le contrôle reste « à
                vérifier manuellement ».
              </td>
            </tr>
            <tr>
              <th scope="row">Sans repli d’assurance</th>
              <td>{sansRepli}</td>
              <td>Aucune police ne rattrape la rédaction : la correction est contractuelle.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Les {familles.length} familles</h2>
      <div className={propres.sommaire}>
        {familles.map(({ famille, libelle, controles, critiques: nbCritiques }) => (
          <Link
            key={famille}
            href={`/controles/${SLUG_FAMILLE[famille]}`}
            className={propres.familleCarte}
          >
            <span className={propres.familleReferences}>
              {controles.map((c) => c.id).join(' · ')}
            </span>
            <h3 className={propres.familleTitre}>{libelle}</h3>
            <p className={propres.familleResume}>
              {controles.length} contrôle{controles.length > 1 ? 's' : ''}
              {nbCritiques > 0 ? `, dont ${nbCritiques} critique${nbCritiques > 1 ? 's' : ''}` : ''}.
            </p>
          </Link>
        ))}
      </div>

      <section className={styles.section}>
        <h2>Un contrôle ne disparaît jamais</h2>
        <p>
          Le moteur rend {NOMBRE_CONTROLES} résultats, toujours. Celui qu’il ne sait pas trancher
          ressort « à vérifier manuellement », avec sa gravité et sa place dans la matrice — jamais
          masqué, jamais silencieusement classé conforme.
        </p>
        <p>
          C’est la règle la plus stricte du produit. Une ligne absente d’un rapport se lit comme
          « pas de problème sur ce point », ce qui est faux : la clause n’a simplement pas été
          trouvée. C’est un faux négatif silencieux, et c’est le pire mode de défaillance possible
          sur un outil qui touche au devoir de conseil.
        </p>
        <div className={styles.appels}>
          <Link href="/dossier" className={styles.boutonPrimaire}>
            Appliquer les {NOMBRE_CONTROLES} contrôles à un bail
          </Link>
          <Link href="/methode" className={styles.boutonSecondaire}>
            Comment le moteur tranche
          </Link>
        </div>
      </section>
    </main>
  )
}
