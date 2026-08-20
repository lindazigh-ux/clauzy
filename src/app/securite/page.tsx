import type { Metadata } from 'next'
import Link from 'next/link'

import { EMPREINTE_BUILD } from '@/lib/build-info'
import { CATALOGUE_ENDPOINTS, CLES_INTERDITES } from '@/lib/net'

import styles from './securite.module.css'

export const metadata: Metadata = {
  title: 'Sécurité',
  description:
    'Ce qui reste dans votre navigateur, ce qui peut en sortir, et comment Clauzy le garantit techniquement.',
}

/**
 * Page /securite (brief §2).
 *
 * Elle est generee a partir du catalogue reel de la couche reseau : elle ne
 * peut pas se desynchroniser du code. Ajouter un champ sortant, c'est le
 * publier ici le meme jour.
 */
export default function Securite() {
  const endpoints = Object.entries(CATALOGUE_ENDPOINTS)
  const champsSortants = endpoints.flatMap(([nom, def]) =>
    Object.entries(def.champs).map(([champ, spec]) => ({
      nom,
      chemin: def.chemin,
      champ,
      justification: spec.justification,
    })),
  )

  return (
    <main className="page">
      <Link href="/" className={styles.retour}>
        Retour à l’accueil
      </Link>

      <h1>Vos documents ne quittent pas votre navigateur</h1>
      <p className={styles.chapo}>
        Clauzy analyse des baux et des polices d’assurance. Ce sont des documents que l’on ne
        confie pas à un service en ligne. Nous avons donc conçu le produit pour qu’il n’en ait pas
        besoin : l’analyse se fait entièrement sur votre poste, dans votre navigateur.
      </p>

      <div className={styles.colonnes}>
        <section className={`${styles.bloc} ${styles.reste}`}>
          <h2>Ce qui reste chez vous</h2>
          <ul>
            <li>
              Le texte intégral du bail, des conditions particulières et générales, des avenants
            </li>
            <li>Le contenu des mails Outlook importés</li>
            <li>Les extraits de clauses, les citations, les rédactions proposées</li>
            <li>La génération des exports Word et PDF</li>
            <li>Le fichier de sauvegarde de votre dossier</li>
          </ul>
          <p className={styles.jamais}>
            Rien de tout cela n’est transmis, ni stocké, ni journalisé.
          </p>
        </section>

        <section className={`${styles.bloc} ${styles.transite}`}>
          <h2>Ce qui peut transiter</h2>
          <ul>
            <li>Votre identité, votre organisation, votre abonnement et vos quotas</li>
            <li>
              Les métadonnées de dossier que vous saisissez à la main : référence, date, statut
            </li>
            <li>
              Des statistiques strictement anonymes : identifiant du contrôle déclenché, gravité,
              durée d’analyse
            </li>
          </ul>
          <p className={styles.jamais}>
            Jamais un extrait de texte, jamais un nom de client, jamais un nom de fichier.
          </p>
        </section>
      </div>

      <h2>Le détail, champ par champ</h2>
      <p>
        Voici l’intégralité de ce que l’application est capable d’envoyer. Cette liste est générée
        depuis le code qui exécute les appels : elle ne peut pas être incomplète.
      </p>

      <div className={styles.tableauEnveloppe}>
        <table className={styles.tableau}>
          <caption className={styles.legende}>
            {champsSortants.length} champs sortants déclarés, sur {endpoints.length} appels
            possibles.
          </caption>
          <thead>
            <tr>
              <th scope="col">Appel</th>
              <th scope="col">Champ</th>
              <th scope="col">Pourquoi il sort</th>
            </tr>
          </thead>
          <tbody>
            {champsSortants.map((ligne) => (
              <tr key={`${ligne.nom}-${ligne.champ}`}>
                <td>
                  <code>{ligne.chemin}</code>
                </td>
                <td>
                  <code>{ligne.champ}</code>
                </td>
                <td>{ligne.justification}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Comment nous le garantissons</h2>
      <ol className={styles.garanties}>
        <li>
          <strong>Un seul point de sortie.</strong> Tous les appels réseau passent par une couche
          unique. Un test d’architecture échoue si un appel réseau apparaît ailleurs dans le code.
        </li>
        <li>
          <strong>Une liste d’autorisation, pas une liste d’interdiction.</strong> Un champ qui ne
          figure pas dans le tableau ci-dessus est refusé — même anodin, même vide. Aucune
          imbrication n’est autorisée : seules des valeurs simples peuvent sortir.
        </li>
        <li>
          <strong>Un test anti-fuite qui bloque la mise en production.</strong> Il vérifie que{' '}
          {CLES_INTERDITES.length} familles de noms de champs — texte, clause, extrait, citation,
          nom de fichier et leurs variantes — sont rejetées à n’importe quelle profondeur, ainsi
          que toute valeur trop longue ou contenant un retour à la ligne. Il s’exécute à chaque
          intégration continue.
        </li>
        <li>
          <strong>Une politique de sécurité du contenu stricte.</strong> Le navigateur lui-même
          interdit à la page d’ouvrir une connexion vers un domaine autre que celui de Clauzy
          (<code>connect-src &apos;self&apos;</code>). Même un défaut de notre code ne pourrait pas
          envoyer un extrait ailleurs.
        </li>
        <li>
          <strong>Aucune dépendance à un service tiers pour lire un document.</strong> Les moteurs
          de lecture PDF, Word et Outlook s’exécutent dans votre navigateur.
        </li>
      </ol>

      <section className={styles.limite}>
        <h2>Une limite que nous préférons écrire</h2>
        <p>
          À ce stade, notre politique de sécurité du contenu autorise encore les scripts en ligne
          (<code>script-src &apos;unsafe-inline&apos;</code>), ce qu’exige le script d’amorçage du
          framework tant que nous n’avons pas mis en place les nonces. La directive qui protège vos
          documents, <code>connect-src</code>, est en revanche déjà stricte. Le passage aux nonces
          est prévu ; cette page sera mise à jour le jour où ce sera fait.
        </p>
      </section>

      <section className={styles.empreinte}>
        <h2>Empreinte de cette version</h2>
        <p>Cette page décrit exactement le code que vous exécutez en ce moment. Son empreinte :</p>
        <p>
          <strong>{EMPREINTE_BUILD}</strong>
        </p>
        <p>
          Communiquez-la à votre direction des systèmes d’information ou à votre délégué à la
          protection des données : elle identifie la version auditée.
        </p>
      </section>
    </main>
  )
}
