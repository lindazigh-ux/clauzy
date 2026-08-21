import type { Metadata } from 'next'
import Link from 'next/link'

import { partage } from '@/contenu/site'
import { MENTION_LIMITE } from '@/domain/dossier/types'
import { NOMBRE_CONTROLES } from '@/domain/controles'
import { JALONS } from '@/domain/dossier/suivi'

import styles from '../site.module.css'
import propres from './livrable.module.css'

export const metadata: Metadata = {
  title: 'Le livrable',
  description:
    'Ce que vous remettez : une note Word dont chaque commentaire est ancré à la clause visée, un rapport client PDF à vos couleurs, et un calendrier de relance exportable.',
  ...partage({
    titre: 'Le livrable — Clauzy',
    description:
      'Note Word annotée, rapport client PDF à vos couleurs, calendrier de relance. Le rapport sort à votre nom.',
    chemin: '/livrable',
    type: 'article',
  }),
}

export default function Livrable() {
  return (
    <main className="page">
      <span className={styles.surtitre}>Le livrable</span>
      <h1>
        Ce que vous remettez, <span className={styles.accroche}>à votre nom.</span>
      </h1>
      <p className={styles.chapo}>
        Une analyse n’a de valeur que si elle est présentable en rendez-vous et opposable après
        coup. Trois pièces sortent du poste de travail, et aucune ne porte notre marque ailleurs
        qu’en pied de page.
      </p>

      <div className={propres.pieces}>
        <article className={propres.piece}>
          <span className={propres.pieceFormat}>.docx</span>
          <h2>La note annotée</h2>
          <p>
            Le bail lui-même, rendu avec un commentaire Word par écart — <strong>ancré à la
            clause visée</strong>, pas en tête de page. Le destinataire ouvre le document, clique
            sur le commentaire, et lit la clause en cause à l’endroit exact où elle se trouve.
          </p>
          <ul className={styles.listeCochee}>
            <li>Un commentaire par écart, avec sa gravité et sa référence de contrôle</li>
            <li>La rédaction de remplacement, prête à être proposée en négociation</li>
            <li>Les passages que vous avez rattachés à la main, au caractère près</li>
          </ul>
        </article>

        <article className={propres.piece}>
          <span className={propres.pieceFormat}>.pdf</span>
          <h2>Le rapport client</h2>
          <p>
            Page de garde à la couleur de votre cabinet, synthèse hiérarchisée par enjeu chiffré,
            matrice des {NOMBRE_CONTROLES} contrôles, périmètre et limites. C’est la pièce qui se
            pose sur la table.
          </p>
          <ul className={styles.listeCochee}>
            <li>Les écarts critiques en tête, avec leur montant quand il est calculable</li>
            <li>La correction contractuelle en premier, le repli d’assurance en second</li>
            <li>Les contrôles à vérifier manuellement, listés et non masqués</li>
            <li>Les pièces reçues, les pièces manquantes, les hypothèses retenues</li>
          </ul>
        </article>

        <article className={propres.piece}>
          <span className={propres.pieceFormat}>.ics</span>
          <h2>Le calendrier de relance</h2>
          <p>
            Obtenir une attestation conforme n’est pas un événement, c’est une relance. Les{' '}
            {JALONS.length} jalons s’exportent vers votre agenda, chacun avec l’action à mener et
            la preuve à verser au dossier.
          </p>
          <ul className={styles.listeCochee}>
            {JALONS.map((jalon) => (
              <li key={jalon.id}>
                {jalon.libelle} — {jalon.jours === 0 ? 'à l’envoi' : `J+${jalon.jours}`}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <section className={styles.section}>
        <span className={styles.surtitre}>La page qui protège</span>
        <h2>Périmètre et limites</h2>
        <p>
          C’est la page qui distingue un livrable d’une sortie machine. Elle dit quelles pièces ont
          été reçues, lesquelles manquaient, quels contrôles ont été déclarés sans objet pour ce
          dossier et sous quelles hypothèses l’analyse a été conduite.
        </p>
        <p>
          Elle se remplit à la main, et c’est volontaire : le moteur ne sait pas ce qu’on ne lui a
          pas donné. Un rapport qui ne dit pas ce qu’il n’a pas vu est un rapport qui se retourne
          contre celui qui l’a signé.
        </p>
        <div className={propres.mention}>
          <span className={propres.mentionEtiquette}>Mention portée sur chaque livrable</span>
          <p>{MENTION_LIMITE}</p>
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.surtitre}>Ce que le rapport ne fait jamais</span>
        <h2>Trois refus, tenus par le code</h2>
        <div className={styles.grilleLarge}>
          <article className={styles.carte}>
            <h3>Masquer une ligne</h3>
            <p>
              Les {NOMBRE_CONTROLES} contrôles figurent au rapport, y compris ceux que le moteur
              n’a pas su trancher. Il n’existe aucune option pour les cacher.
            </p>
          </article>
          <article className={styles.carte}>
            <h3>Inverser l’ordre des corrections</h3>
            <p>
              La correction du bail précède l’adaptation de la police, partout. Quand aucun repli
              d’assurance n’existe, le rapport l’écrit au lieu de laisser la case vide.
            </p>
          </article>
          <article className={styles.carte}>
            <h3>Modifier une ligne sans trace</h3>
            <p>
              Forcer un statut ou écarter un faux positif exige un motif. Le rapport peut dire
              précisément ce qui a été repris à la main, et pourquoi.
            </p>
          </article>
        </div>

        <div className={styles.appels}>
          <Link href="/dossier" className={styles.boutonPrimaire}>
            Produire un livrable d’exemple
          </Link>
          <Link href="/tarifs" className={styles.boutonSecondaire}>
            Voir les tarifs
          </Link>
        </div>
      </section>
    </main>
  )
}
