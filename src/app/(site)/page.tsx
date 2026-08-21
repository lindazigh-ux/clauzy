import type { Metadata } from 'next'
import Link from 'next/link'

import { LogicielStructure } from './composants/DonneesStructurees'
import { CaptureRapport } from './composants/CaptureRapport'
import { PLANS } from '@/contenu/tarifs'
import { SLUG_FAMILLE, partage } from '@/contenu/site'
import {
  Famille,
  LIBELLE_FAMILLE,
  NOMBRE_CONTROLES,
  REFERENTIEL,
  aUnRepliAssurance,
  parFamille,
} from '@/domain/controles'

import styles from './site.module.css'
import propres from './accueil.module.css'

export const metadata: Metadata = {
  description:
    'Clauzy confronte les obligations d’assurance d’un bail commercial aux couvertures réellement souscrites, et produit une note de conseil opposable. Vos documents ne quittent jamais votre navigateur.',
  ...partage({
    titre: 'Clauzy — le bail promet, la police suit-elle ?',
    description:
      'Quarante contrôles, écart par écart, montant par montant. L’analyse se fait dans votre navigateur : aucun document n’est transmis.',
    chemin: '/',
  }),
}

/**
 * Accueil (brief §9).
 *
 * L'ordre des sections est celui que le brief impose, et il n'est pas
 * decoratif : nommer le probleme, prouver la confidentialite AU-DESSUS de la
 * ligne de flottaison, montrer un ecart reel, detailler les controles,
 * repondre a l'objection de l'assistant generaliste, afficher les tarifs,
 * capturer l'email.
 *
 * Tous les chiffres sont derives du referentiel : la page ne peut pas annoncer
 * autre chose que ce que le produit applique reellement. Le jour ou un
 * controle est ajoute, l'accueil le sait le meme jour.
 */
export default function Accueil() {
  const familles = Object.values(Famille).map((famille) => ({
    famille,
    libelle: LIBELLE_FAMILLE[famille],
    effectif: parFamille(famille).length,
  }))

  const sansRepliAssurance = REFERENTIEL.filter((controle) => !aUnRepliAssurance(controle)).length
  const praticien = PLANS.find((plan) => plan.id === 'PRATICIEN')

  return (
    <main className="page">
      <LogicielStructure />

      {/* 1 — nommer le probleme */}
      <h1>
        Le bail promet, <span className={styles.accroche}>la police ne suit pas.</span>
      </h1>
      <p className={styles.chapo}>
        Un bail commercial impose des garanties d’assurance. Une police en souscrit d’autres.
        L’écart entre les deux ne se voit ni à la lecture de l’un, ni à la lecture de l’autre —
        il n’apparaît qu’en les mettant côte à côte. Clauzy fait ce croisement, écart par écart,
        montant par montant, et en tire une note de conseil opposable.
      </p>

      {/* Deux entrees de conversion, pas une (brief §9). */}
      <div className={styles.appels}>
        <Link href="/dossier" className={styles.boutonPrimaire}>
          Essayer sur un dossier d’exemple
        </Link>
        <Link href="/demo" className={styles.boutonSecondaire}>
          Réserver une démonstration
        </Link>
      </div>
      <p className={styles.souscrit}>
        Sans compte, sans carte. Le jeu d’exemple produit un livrable complet en deux minutes,
        sans qu’aucune pièce client ne soit importée.
      </p>

      {/* 2 — la confidentialite, au-dessus de la ligne de flottaison */}
      <section className={propres.preuve}>
        <span className={styles.surtitre}>Ce que vos clients vous demanderont d’abord</span>
        <h2>Vos documents ne quittent pas votre navigateur</h2>
        <p>
          Le texte du bail, des conditions particulières et générales, des avenants et des
          courriels importés est lu, découpé et analysé sur votre poste. Aucun extrait, aucun nom
          de client, aucun nom de fichier n’est transmis. Ce n’est pas une politique de
          confidentialité : c’est une impossibilité technique.
        </p>
        <ul className={styles.listeCochee}>
          <li>Une seule couche du code sait ouvrir une connexion, et son catalogue est publié.</li>
          <li>Un test d’architecture échoue si un module d’analyse tente seulement de l’importer.</li>
          <li>
            La politique de sécurité du navigateur interdit toute connexion hors de notre domaine.
          </li>
          <li>Aucune fonctionnalité ne dépend d’un service tiers pour lire un document.</li>
        </ul>
        <p>
          <Link href="/securite">Comment nous le prouvons, ligne par ligne</Link>
        </p>
      </section>

      {/* 3 — montrer un ecart reel */}
      <section className={styles.section}>
        <span className={styles.surtitre}>Un écart, tel qu’il sort</span>
        <h2>Le loyer court vingt-quatre mois, l’indemnité s’arrête à douze</h2>
        <p>
          Chaque document, pris isolément, est irréprochable. C’est la confrontation qui fait
          apparaître le défaut — et le chiffre.
        </p>

        <div className={propres.confrontation}>
          <article className={propres.cote}>
            <span className={propres.coteEtiquette}>Ce que le bail exige</span>
            <p className="clause">
              « Le loyer restera intégralement dû pendant toute la durée des travaux de
              reconstruction. Le Preneur ne pourra résilier qu’au-delà de vingt-quatre (24) mois
              d’inutilisabilité. »
            </p>
            <p className={propres.coteNote}>Rédaction synthétique, représentative.</p>
          </article>

          <article className={propres.cote}>
            <span className={propres.coteEtiquette}>Ce que la police soutient</span>
            <p className="clause">
              « Perte d’exploitation — période d’indemnisation : douze (12) mois. Franchise : trois
              (3) jours ouvrés. »
            </p>
            <p className={propres.coteNote}>Conditions particulières, extrait synthétique.</p>
          </article>
        </div>

        <div className={propres.verdict}>
          <span className={propres.verdictEtiquette}>SIN-01 · Écart détecté · Critique</span>
          <p className={propres.verdictChiffre}>
            24 mois de loyer dû · 12 mois indemnisés · <strong>12 mois d’exposition</strong>
          </p>
          <p>
            Sur un loyer de 8 000 € par mois, l’écart pèse 96 000 €. La correction se négocie
            d’abord dans le bail : obtenir la suspension du loyer pendant l’inutilisabilité se
            paie une fois, étendre la période d’indemnisation se paie chaque année.
          </p>
        </div>
      </section>

      {/* 4 — detailler les 40 controles */}
      <section className={styles.section}>
        <span className={styles.surtitre}>Le référentiel</span>
        <h2>
          {NOMBRE_CONTROLES} contrôles, {familles.length} familles, appliqués à chaque dossier
        </h2>
        <p>
          Aucun contrôle n’est sauté, aucun n’est masqué. Celui que le moteur ne sait pas trancher
          ressort « à vérifier manuellement », avec sa gravité et sa place dans la matrice — parce
          qu’une ligne absente d’un rapport se lit comme « pas de problème », ce qui est faux.
        </p>

        <div className={styles.grille}>
          {familles.map(({ famille, libelle, effectif }) => (
            <Link
              key={famille}
              href={`/controles/${SLUG_FAMILLE[famille]}`}
              className={styles.carteLien}
            >
              <span className={styles.carteMeta}>
                {effectif} contrôle{effectif > 1 ? 's' : ''}
              </span>
              <h3>{libelle}</h3>
            </Link>
          ))}
        </div>

        <div className={styles.encadre}>
          <h3>On corrige le bail d’abord</h3>
          <p>
            Sur {sansRepliAssurance} de ces {NOMBRE_CONTROLES} contrôles, aucune police ne rattrape
            la rédaction : le transfert de risque est déséquilibré, ou la clause est de pure
            procédure. Le rapport l’écrit noir sur blanc au lieu de laisser la case vide.
            L’adaptation du programme d’assurance n’arrive qu’en second, si la négociation
            contractuelle échoue.
          </p>
        </div>
      </section>

      {/* 5 — pourquoi pas un assistant IA generaliste */}
      <section className={styles.section}>
        <span className={styles.surtitre}>L’objection</span>
        <h2>Pourquoi pas un assistant IA généraliste ?</h2>
        <div className={styles.grilleLarge}>
          <article className={styles.carte}>
            <h3>Il répond à ce qu’on lui demande</h3>
            <p>
              Et il se tait sur ce qu’on ne lui a pas demandé. C’est exactement le mode de
              défaillance qu’un devoir de conseil ne pardonne pas : le point manquant ne se
              signale jamais de lui-même.
            </p>
          </article>
          <article className={styles.carte}>
            <h3>Il ne rend pas deux fois le même travail</h3>
            <p>
              Clauzy applique les mêmes {NOMBRE_CONTROLES} contrôles, dans le même ordre, à chaque
              dossier — et rend {NOMBRE_CONTROLES} résultats, y compris ceux qu’il n’a pas su
              trancher.
            </p>
          </article>
          <article className={styles.carte}>
            <h3>Il faut lui envoyer le bail</h3>
            <p>
              Confier le bail commercial et le programme d’assurance d’un client à un service
              tiers est une décision que peu de directions juridiques prennent à la légère. Ici,
              la question ne se pose pas.
            </p>
          </article>
        </div>
        <p>
          <Link href="/methode">La méthode, en détail</Link>
        </p>
      </section>

      {/* 6 — les tarifs */}
      <section className={styles.section}>
        <span className={styles.surtitre}>Tarifs</span>
        <h2>Un abonnement, pas une facturation au dossier</h2>
        <p>
          Le plan Praticien couvre l’essentiel du besoin d’un courtier, d’un avocat ou d’un juriste
          qui livre en son nom
          {praticien?.mensuel === null || praticien === undefined
            ? '.'
            : ` — ${praticien.mensuel} € HT par mois, ${praticien.annuel} € en engagement annuel.`}{' '}
          L’essai est gratuit, sans compte, et donne accès aux {NOMBRE_CONTROLES} contrôles.
        </p>
        <div className={styles.appels}>
          <Link href="/tarifs" className={styles.boutonSecondaire}>
            Voir les quatre plans
          </Link>
        </div>
      </section>

      {/* 7 — capturer l'email contre un rapport d'exemple */}
      <CaptureRapport />
    </main>
  )
}
