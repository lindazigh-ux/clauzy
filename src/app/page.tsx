import Link from 'next/link'

import { LIBELLES_FAMILLES, NOMBRE_TOTAL_CONTROLES, REPARTITION_ATTENDUE } from '@/domain/controles/types'
import type { Famille } from '@/domain/controles/types'

import styles from './accueil.module.css'

/**
 * Accueil — version minimale du lot L0.
 *
 * Le site marketing complet est le lot L7 (brief §9). Cette page tient
 * volontairement l'ordre impose par le brief — nommer le probleme, prouver la
 * confidentialite au-dessus de la ligne de flottaison — sans anticiper le
 * reste, qui merite d'etre ecrit pour de vrai.
 */
export default function Accueil() {
  const familles = Object.entries(REPARTITION_ATTENDUE) as [Famille, number][]

  return (
    <>
      <header className={styles.entete}>
        <div className={styles.enteteContenu}>
          <Link href="/" className={styles.marque}>
            Clauzy
          </Link>
          <nav>
            <Link href="/securite">Sécurité</Link>
          </nav>
        </div>
      </header>

      <main className="page">
        <h1>
          Le bail promet, <span className={styles.accroche}>la police ne suit pas.</span>
        </h1>
        <p className={styles.chapo}>
          Clauzy confronte les obligations d’assurance d’un bail commercial aux couvertures
          réellement souscrites, et produit une note de conseil opposable — écart par écart,
          montant par montant.
        </p>

        <div className={styles.encadre}>
          <h2>Vos documents ne quittent pas votre navigateur</h2>
          <p>
            Le texte du bail, des conditions particulières et générales, des avenants et des mails
            importés est lu, segmenté et analysé sur votre poste. Aucun extrait, aucun nom de
            client, aucun nom de fichier n’est transmis à nos serveurs — l’architecture le rend
            impossible, pas seulement notre politique.
          </p>
          <p>
            <Link href="/securite">Comment nous le prouvons</Link>
          </p>
        </div>

        <h2>{NOMBRE_TOTAL_CONTROLES} contrôles, sept familles</h2>
        <p>
          Chaque analyse applique les {NOMBRE_TOTAL_CONTROLES} contrôles, sans exception. Un
          contrôle que le moteur ne sait pas trancher n’est jamais masqué : il apparaît « à
          vérifier manuellement ». Une checklist exhaustive vaut mieux qu’un rapport qui se tait.
        </p>

        <div className={styles.grille}>
          {familles.map(([famille, effectif]) => (
            <article key={famille} className={styles.carte}>
              <h3>{LIBELLES_FAMILLES[famille]}</h3>
              <p>
                {effectif} contrôle{effectif > 1 ? 's' : ''}
              </p>
            </article>
          ))}
        </div>

        <div className={styles.chantier}>
          <p>
            Cette page est le squelette du lot L0. Le site marketing, les pages par famille de
            contrôles et les parcours d’essai arrivent au lot L7.
          </p>
        </div>
      </main>

      <footer className={styles.pied}>
        Clauzy — outil d’aide au conseil. Ni avis juridique, ni garantie de couverture.
      </footer>
    </>
  )
}
