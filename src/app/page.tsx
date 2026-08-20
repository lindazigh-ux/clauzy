import Link from 'next/link'

import {
  Famille,
  LIBELLE_FAMILLE,
  NOMBRE_CONTROLES,
  REFERENTIEL,
  aUnRepliAssurance,
  parFamille,
} from '@/domain/controles'

import styles from './accueil.module.css'

/**
 * Accueil — version minimale du lot L0.
 *
 * Le site marketing complet est le lot L7 (brief §9). Cette page tient
 * volontairement l'ordre impose par le brief — nommer le probleme, prouver la
 * confidentialite au-dessus de la ligne de flottaison — sans anticiper le
 * reste, qui merite d'etre ecrit pour de vrai.
 *
 * Tous les chiffres affiches sont derives du referentiel : la page ne peut pas
 * annoncer autre chose que ce que le produit applique reellement.
 */
export default function Accueil() {
  const familles = Object.values(Famille).map((famille) => ({
    famille,
    libelle: LIBELLE_FAMILLE[famille],
    effectif: parFamille(famille).length,
  }))

  const sansRepliAssurance = REFERENTIEL.filter((controle) => !aUnRepliAssurance(controle)).length

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

        <h2>
          {NOMBRE_CONTROLES} contrôles, {familles.length} familles
        </h2>
        <p>
          Chaque analyse applique les {NOMBRE_CONTROLES} contrôles, sans exception. Un contrôle que
          le moteur ne sait pas trancher n’est jamais masqué : il ressort « à vérifier
          manuellement ». Une checklist exhaustive vaut mieux qu’un rapport qui se tait.
        </p>

        <div className={styles.grille}>
          {familles.map(({ famille, libelle, effectif }) => (
            <article key={famille} className={styles.carte}>
              <h3>{libelle}</h3>
              <p>
                {effectif} contrôle{effectif > 1 ? 's' : ''}
              </p>
            </article>
          ))}
        </div>

        <h2>On corrige le bail d’abord</h2>
        <p>
          Sur {sansRepliAssurance} de ces {NOMBRE_CONTROLES} contrôles, aucune police ne rattrape la
          rédaction : le transfert est déséquilibré, ou la clause est de pure procédure. Le rapport
          le dit explicitement plutôt que de laisser la ligne vide. L’adaptation du programme
          d’assurance n’arrive qu’en second, si la négociation contractuelle échoue.
        </p>

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
