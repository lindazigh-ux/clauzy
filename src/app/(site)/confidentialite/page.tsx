import type { Metadata } from 'next'
import Link from 'next/link'

import { Article, PageLegale } from '../composants/PageLegale'
import { EDITEUR } from '@/contenu/editeur'
import { partage } from '@/contenu/site'
import { CATALOGUE_ENDPOINTS } from '@/lib/net'

import styles from '../site.module.css'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Quelles données nous traitons, lesquelles ne nous parviennent jamais, combien de temps nous les conservons, et comment exercer vos droits.',
  ...partage({
    titre: 'Politique de confidentialité — Clauzy',
    description:
      'Quelles données nous traitons, lesquelles ne nous parviennent jamais, et comment exercer vos droits.',
    chemin: '/confidentialite',
    type: 'article',
  }),
  robots: { index: true, follow: false },
}

/**
 * Politique de confidentialite (brief §10).
 *
 * Le tableau des donnees sortantes est genere depuis le catalogue reseau reel.
 * Une politique de confidentialite recopiee a la main se desynchronise du code
 * en quelques mois ; celle-ci ne le peut pas. Ajouter un champ sortant, c'est
 * le publier ici le meme jour.
 */
export default function Confidentialite() {
  const champs = Object.entries(CATALOGUE_ENDPOINTS).flatMap(([nom, definition]) =>
    Object.entries(definition.champs).map(([champ, spec]) => ({
      nom,
      champ,
      justification: spec.justification,
    })),
  )

  return (
    <PageLegale
      titre="Politique de confidentialité"
      chapo="La partie la plus importante de ce texte tient en une phrase : les documents que vous analysez ne nous parviennent pas. Le reste précise ce que nous traitons effectivement."
    >
      <Article numero="1" titre="Ce qui ne nous parvient jamais">
        <p>
          Le texte des baux, des conditions générales et particulières, des avenants, des
          attestations et des courriels que vous importez est lu, découpé et analysé par votre
          navigateur. Il n’est ni transmis, ni stocké, ni journalisé par nos serveurs.
        </p>
        <p>
          Il en va de même des extraits de clauses, des citations, des rédactions proposées, des
          rapports exportés, du nom de vos clients et du nom de vos fichiers. Ce n’est pas un
          engagement de politique : la couche réseau du produit refuse ces champs, et son catalogue
          est publié sur la <Link href="/securite">page sécurité</Link>.
        </p>
      </Article>

      <Article numero="2" titre="Responsable de traitement">
        <p>
          {EDITEUR.denomination} est responsable des traitements décrits ci-après. Pour les données
          contenues dans les documents que vous analysez, la question ne se pose pas : elles ne
          nous sont pas transmises. Lorsque vous agissez pour le compte de vos clients, l’
          <Link href="/dpa">accord de traitement des données</Link> précise les rôles.
        </p>
        <p>
          Contact : <a href={`mailto:${EDITEUR.courrielDpo}`}>{EDITEUR.courrielDpo}</a>.
        </p>
      </Article>

      <Article numero="3" titre="Données traitées, finalités et bases légales">
        <div className={styles.tableauEnveloppe}>
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th scope="col">Données</th>
                <th scope="col">Finalité</th>
                <th scope="col">Base légale</th>
                <th scope="col">Conservation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Identité et adresse électronique</th>
                <td>Création et gestion du compte, authentification</td>
                <td>Exécution du contrat</td>
                <td>Durée du compte, puis 3 ans</td>
              </tr>
              <tr>
                <th scope="row">Organisation, plan, quotas</th>
                <td>Gestion de l’abonnement et des droits</td>
                <td>Exécution du contrat</td>
                <td>Durée du compte, puis 3 ans</td>
              </tr>
              <tr>
                <th scope="row">Données de facturation</th>
                <td>Émission des factures et obligations comptables</td>
                <td>Obligation légale</td>
                <td>10 ans</td>
              </tr>
              <tr>
                <th scope="row">Référence et statut de dossier</th>
                <td>Suivi de vos dossiers, saisis à la main par vous</td>
                <td>Exécution du contrat</td>
                <td>Durée du compte</td>
              </tr>
              <tr>
                <th scope="row">Statistiques d’usage anonymes</th>
                <td>
                  Amélioration du référentiel : type d’événement, identifiant de contrôle, durée
                </td>
                <td>Intérêt légitime</td>
                <td>25 mois</td>
              </tr>
              <tr>
                <th scope="row">Demandes de démonstration</th>
                <td>Réponse à votre demande et suivi commercial</td>
                <td>Mesures précontractuelles</td>
                <td>3 ans à compter du dernier contact</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Aucune de ces catégories ne contient de donnée issue d’un document analysé. La
          statistique d’usage porte l’identifiant d’un contrôle — « IND-02 » — jamais son contenu.
        </p>
      </Article>

      <Article numero="4" titre="Le catalogue exhaustif de ce qui sort de votre navigateur">
        <p>
          Voici la liste complète des champs que l’application est techniquement autorisée à
          transmettre. Elle est générée depuis le code lui-même : elle ne peut pas être incomplète.
        </p>
        <div className={styles.tableauEnveloppe}>
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th scope="col">Appel</th>
                <th scope="col">Champ</th>
                <th scope="col">Pourquoi il est autorisé</th>
              </tr>
            </thead>
            <tbody>
              {champs.map((entree) => (
                <tr key={`${entree.nom}.${entree.champ}`}>
                  <td className={styles.reference}>{entree.nom}</td>
                  <td className={styles.reference}>{entree.champ}</td>
                  <td>{entree.justification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Article>

      <Article numero="5" titre="Destinataires et sous-traitants">
        <p>
          Les données sont accessibles aux seules personnes de {EDITEUR.denomination} qui en ont
          besoin. Nous recourons à un hébergeur situé dans l’Union européenne et à un prestataire
          de paiement agréé, qui traite seul les données de carte bancaire — nous n’y avons pas
          accès.
        </p>
        <p>
          Aucun transfert hors de l’Union européenne n’est réalisé pour les traitements décrits
          ici. Aucun service tiers n’intervient dans la lecture ou l’analyse d’un document.
        </p>
      </Article>

      <Article numero="6" titre="Mesure d’audience et cookies">
        <p>
          Le site n’utilise ni cookie publicitaire, ni traceur tiers. La politique de sécurité du
          navigateur que nous imposons interdit d’ailleurs toute connexion vers un autre domaine
          que le nôtre : un script d’analyse tiers ne pourrait pas fonctionner, quand bien même il
          serait ajouté par erreur.
        </p>
        <p>
          Les seuls cookies déposés sont strictement nécessaires au fonctionnement : maintien de la
          session authentifiée. Ils ne requièrent pas de consentement préalable.
        </p>
      </Article>

      <Article numero="7" titre="Vos droits">
        <p>
          Vous disposez des droits d’accès, de rectification, d’effacement, de limitation,
          d’opposition et de portabilité, ainsi que du droit de définir des directives relatives au
          sort de vos données après votre décès.
        </p>
        <p>
          Ces droits s’exercent auprès de{' '}
          <a href={`mailto:${EDITEUR.courrielDpo}`}>{EDITEUR.courrielDpo}</a>. Nous répondons sous
          un mois. Vous pouvez introduire une réclamation auprès de la Commission nationale de
          l’informatique et des libertés (CNIL), 3 place de Fontenoy, 75007 Paris.
        </p>
      </Article>

      <Article numero="8" titre="Sécurité">
        <p>
          Chiffrement des échanges, politique de sécurité de contenu stricte, cloisonnement de la
          couche réseau, et absence pure et simple des documents sur nos serveurs — la mesure de
          sécurité la plus efficace restant de ne pas détenir la donnée. Le détail technique figure
          sur la <Link href="/securite">page sécurité</Link>.
        </p>
        <p>
          Les fichiers de dossier que vous enregistrez sont chiffrés sur votre poste par un mot de
          passe que vous choisissez et que nous ne connaissons pas. Nous ne pouvons ni les lire, ni
          les restaurer.
        </p>
      </Article>
    </PageLegale>
  )
}
