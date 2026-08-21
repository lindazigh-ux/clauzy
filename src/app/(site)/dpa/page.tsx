import type { Metadata } from 'next'
import Link from 'next/link'

import { Article, Definitions, PageLegale } from '../composants/PageLegale'
import { EDITEUR } from '@/contenu/editeur'
import { partage } from '@/contenu/site'

import styles from '../site.module.css'

export const metadata: Metadata = {
  title: 'Accord de traitement des données',
  description:
    'DPA type au sens de l’article 28 du RGPD : périmètre, sous-traitants ultérieurs, sécurité, violations et fin du contrat. Le contenu documentaire n’entre pas dans le périmètre — il ne nous est pas transmis.',
  ...partage({
    titre: 'Accord de traitement des données — Clauzy',
    description:
      'DPA type au sens de l’article 28 du RGPD. Le contenu documentaire n’entre pas dans son périmètre.',
    chemin: '/dpa',
    type: 'article',
  }),
  robots: { index: true, follow: false },
}

/**
 * DPA type (brief §10).
 *
 * Sa particularite : le perimetre est etroit, et c'est l'argument. Un
 * sous-traitant qui n'heberge pas les documents de son client n'a pas a
 * negocier les clauses qui les concernent — il a a expliquer pourquoi elles
 * sont sans objet. L'article 2 le dit d'emblee.
 */
export default function Dpa() {
  return (
    <PageLegale
      titre="Accord de traitement des données"
      chapo="Cet accord vaut clauses contractuelles au sens de l’article 28 du RGPD. Sa particularité tient en une ligne : le contenu des documents analysés n’entre pas dans son périmètre, faute de nous être transmis."
    >
      <Article numero="1" titre="Parties et objet">
        <p>
          Le présent accord est conclu entre l’Utilisateur, <strong>responsable de traitement</strong>,
          et {EDITEUR.denomination}, <strong>sous-traitant</strong>, pour les traitements réalisés
          pour le compte du premier dans le cadre de l’utilisation du Service.
        </p>
        <p>
          Il complète les <Link href="/cgu">conditions générales</Link> et prévaut sur elles en cas
          de contradiction portant sur la protection des données à caractère personnel.
        </p>
      </Article>

      <Article numero="2" titre="Périmètre — ce qui n’est pas traité">
        <p>
          Le contenu des documents soumis à l’analyse — baux, polices, avenants, attestations,
          courriels — <strong>n’est pas transmis à {EDITEUR.denomination}</strong>. Le traitement
          s’effectue intégralement dans le navigateur de l’Utilisateur, sur son poste.
        </p>
        <p>
          En conséquence, {EDITEUR.denomination} n’est ni destinataire, ni détenteur, ni
          sous-traitant des données personnelles que ces documents peuvent contenir. Les
          stipulations qui suivent portent exclusivement sur les données de compte, d’abonnement et
          de suivi énumérées à l’article 3.
        </p>
        <p>
          Cette architecture est vérifiable : la <Link href="/securite">page sécurité</Link> publie
          le catalogue exhaustif des champs que l’application peut transmettre.
        </p>
      </Article>

      <Article numero="3" titre="Nature des traitements confiés">
        <Definitions
          lignes={[
            {
              terme: 'Objet',
              valeur: 'Hébergement et gestion d’un compte professionnel donnant accès au Service.',
            },
            {
              terme: 'Durée',
              valeur: 'La durée de l’abonnement, augmentée des délais de conservation légaux.',
            },
            {
              terme: 'Nature des opérations',
              valeur: 'Collecte, enregistrement, conservation, consultation, effacement.',
            },
            {
              terme: 'Catégories de personnes',
              valeur:
                'Les utilisateurs désignés par le responsable de traitement — ses collaborateurs, non ses clients.',
            },
            {
              terme: 'Catégories de données',
              valeur:
                'Identité professionnelle, adresse électronique, organisation, plan et quotas, références de dossier saisies à la main, statistiques d’usage anonymes.',
            },
            {
              terme: 'Données exclues',
              valeur:
                'Tout contenu documentaire, tout extrait de clause, tout nom de client final, tout nom de fichier.',
            },
          ]}
        />
      </Article>

      <Article numero="4" titre="Obligations du sous-traitant">
        <ul>
          <li>
            Ne traiter les données que sur instruction documentée du responsable de traitement, y
            compris pour un transfert hors Union européenne — aucun transfert de ce type n’est
            aujourd’hui réalisé.
          </li>
          <li>
            Garantir la confidentialité des données et n’y donner accès qu’aux personnes qui en ont
            besoin, soumises à une obligation de confidentialité.
          </li>
          <li>
            Mettre en œuvre les mesures techniques et organisationnelles de l’article 6 et aider le
            responsable de traitement à répondre aux demandes d’exercice de droits.
          </li>
          <li>
            Assister le responsable de traitement pour les analyses d’impact et la notification des
            violations.
          </li>
          <li>
            Mettre à disposition les informations nécessaires pour démontrer le respect de
            l’article 28 et permettre les audits prévus à l’article 8.
          </li>
        </ul>
      </Article>

      <Article numero="5" titre="Sous-traitants ultérieurs">
        <p>
          Le responsable de traitement autorise {EDITEUR.denomination} à recourir aux sous-traitants
          ultérieurs suivants :
        </p>
        <div className={styles.tableauEnveloppe}>
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th scope="col">Rôle</th>
                <th scope="col">Données concernées</th>
                <th scope="col">Localisation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Hébergement applicatif</th>
                <td>Compte, abonnement, références de dossier</td>
                <td>Union européenne</td>
              </tr>
              <tr>
                <th scope="row">Prestataire de paiement</th>
                <td>Facturation. Les données de carte ne transitent pas par nous.</td>
                <td>Union européenne</td>
              </tr>
              <tr>
                <th scope="row">Envoi de courriels transactionnels</th>
                <td>Adresse électronique et contenu du message de service</td>
                <td>Union européenne</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Toute adjonction ou remplacement est notifié trente jours à l’avance, période pendant
          laquelle le responsable de traitement peut s’y opposer et, à défaut d’accord, résilier
          sans pénalité.
        </p>
      </Article>

      <Article numero="6" titre="Sécurité">
        <ul>
          <li>Chiffrement des échanges en transit et des données au repos.</li>
          <li>
            Politique de sécurité de contenu interdisant au navigateur toute connexion vers un
            domaine tiers.
          </li>
          <li>
            Cloisonnement de la couche réseau : une allowlist explicite, refusant tout champ non
            déclaré, appliquée au départ comme à l’arrivée.
          </li>
          <li>Journalisation des accès administratifs et authentification renforcée.</li>
          <li>
            Minimisation par construction : la mesure la plus efficace reste de ne pas détenir la
            donnée.
          </li>
        </ul>
      </Article>

      <Article numero="7" titre="Violation de données">
        <p>
          {EDITEUR.denomination} notifie au responsable de traitement toute violation de données à
          caractère personnel dans les meilleurs délais, et au plus tard{' '}
          <strong>quarante-huit heures</strong> après en avoir pris connaissance, en précisant la
          nature de la violation, les catégories et le volume approximatif de données concernées,
          les conséquences probables et les mesures prises.
        </p>
        <p>
          Le périmètre d’une telle violation ne peut, par construction, comprendre le contenu des
          documents analysés.
        </p>
      </Article>

      <Article numero="8" titre="Audit">
        <p>
          Le responsable de traitement peut demander, une fois par an et moyennant un préavis de
          trente jours, la communication des éléments démontrant la conformité du sous-traitant, ou
          diligenter un audit par un tiers indépendant soumis à confidentialité. L’audit s’exerce
          pendant les heures ouvrées et sans perturber l’exploitation.
        </p>
      </Article>

      <Article numero="9" titre="Sort des données en fin de contrat">
        <p>
          À l’expiration du contrat, {EDITEUR.denomination} supprime les données de compte dans un
          délai de trente jours, sous réserve des obligations légales de conservation, notamment
          comptables.
        </p>
        <p>
          Les dossiers de travail et les rapports ne sont pas concernés : ils se trouvent sur les
          postes du responsable de traitement, et n’ont jamais été détenus par{' '}
          {EDITEUR.denomination}. Aucune opération de restitution n’est donc nécessaire — ni
          possible.
        </p>
      </Article>

      <Article numero="10" titre="Signature">
        <p>
          Cet accord est réputé accepté lors de la souscription de l’abonnement. Un exemplaire
          signé, ou un accord négocié, peut être demandé à{' '}
          <a href={`mailto:${EDITEUR.courrielDpo}`}>{EDITEUR.courrielDpo}</a> — c’est l’usage pour
          les comptes grands comptes.
        </p>
      </Article>
    </PageLegale>
  )
}
