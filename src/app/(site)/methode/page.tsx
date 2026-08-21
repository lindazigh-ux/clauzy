import type { Metadata } from 'next'
import Link from 'next/link'

import { partage } from '@/contenu/site'
import { NOMBRE_CONTROLES, Nature, REFERENTIEL, aUnRepliAssurance } from '@/domain/controles'

import styles from '../site.module.css'
import propres from './methode.module.css'

export const metadata: Metadata = {
  title: 'La méthode',
  description:
    'Comment Clauzy tranche : segmentation du bail, détection en couches, croisement obligation/couverture, et une règle absolue — aucun contrôle ne disparaît du rapport.',
  ...partage({
    titre: 'La méthode — Clauzy',
    description:
      'Segmentation, détection en couches, croisement, et une règle absolue : aucun contrôle ne disparaît du rapport.',
    chemin: '/methode',
    type: 'article',
  }),
}

const ETAPES = [
  {
    numero: '01',
    titre: 'Vous importez, votre navigateur lit',
    texte:
      'Bail, conditions particulières et générales, avenants, attestations, courriels Outlook. Le format est déduit du contenu du fichier, pas de son extension. Les pièces jointes d’un courriel sont lues à leur tour — l’attestation arrive presque toujours agrafée à un mail.',
    detail:
      'Rien n’est téléversé. Les moteurs de lecture ne sont même pas chargés tant qu’aucun fichier du format concerné ne se présente.',
  },
  {
    numero: '02',
    titre: 'Le texte est découpé, positions comprises',
    texte:
      'Chaque article, chaque alinéa est repéré avec ses positions exactes dans le document d’origine. C’est ce qui permettra, à la fin, d’ancrer un commentaire Word sur la clause précise plutôt qu’en tête de page.',
    detail:
      'Un bail atypique, mal structuré ou converti d’un scan reste exploitable : la segmentation retombe sur les alinéas.',
  },
  {
    numero: '03',
    titre: 'Deux référentiels, pas un',
    texte:
      'D’un côté les obligations, extraites du document source. De l’autre les couvertures, extraites des pièces d’assurance. Le contrôle est un rapprochement entre les deux — jamais la lecture d’un seul document.',
    detail:
      'Ce vocabulaire n’est pas cosmétique : un contrat de sous-traitance ou un cahier des charges se branche sur les mêmes types, sans réécriture du moteur.',
  },
  {
    numero: '04',
    titre: 'Le moteur conclut, ou dit qu’il ne sait pas',
    texte:
      'Chaque contrôle reçoit un statut et un niveau de confiance. Sous le seuil, le statut bascule en « à vérifier manuellement » plutôt que d’affirmer. Le moteur refuse de conclure « conforme » quand la pièce couvre moins que ce qui est exigé.',
    detail:
      'Les signaux qui ont produit la conclusion sont consultables, côté bail et côté pièces, ligne par ligne.',
  },
  {
    numero: '05',
    titre: 'Vous reprenez la main, avec un motif',
    texte:
      'Écarter un faux positif, forcer un statut, réécrire une analyse : tout est possible, et tout exige un motif. Le rapport doit pouvoir dire pourquoi une ligne a été reprise à la main.',
    detail:
      'Vos ajustements sont rangés à part de la sortie du moteur : importer une pièce supplémentaire et relancer l’analyse n’efface jamais votre travail.',
  },
  {
    numero: '06',
    titre: 'Le livrable sort à votre nom',
    texte:
      'Une note Word dont chaque commentaire est ancré à la clause visée, et un rapport client PDF aux couleurs de votre cabinet, hiérarchisé par enjeu chiffré.',
    detail: 'Notre marque reste en pied de page. Votre client achète une analyse, pas un abonnement.',
  },
] as const

export default function Methode() {
  const croisements = REFERENTIEL.filter((c) => c.nature === Nature.CROISEMENT).length
  const doubles = REFERENTIEL.filter((c) => c.nature === Nature.DOUBLE).length
  const transferts = REFERENTIEL.filter((c) => c.nature === Nature.TRANSFERT_BAIL).length
  const formalisme = REFERENTIEL.filter((c) => c.nature === Nature.FORMALISME).length
  const sansRepli = REFERENTIEL.filter((c) => !aUnRepliAssurance(c)).length

  return (
    <main className="page">
      <span className={styles.surtitre}>La méthode</span>
      <h1>
        Un croisement, pas une relecture{' '}
        <span className={styles.accroche}>— et jamais une ligne muette.</span>
      </h1>
      <p className={styles.chapo}>
        Relire un bail ne suffit pas : les écarts d’assurance ne sont visibles ni dans le bail seul,
        ni dans la police seule. Voici comment le produit s’y prend, et où il s’arrête.
      </p>

      <ol className={propres.etapes}>
        {ETAPES.map((etape) => (
          <li key={etape.numero} className={propres.etape}>
            <span className={propres.numero}>{etape.numero}</span>
            <div>
              <h2 className={propres.etapeTitre}>{etape.titre}</h2>
              <p>{etape.texte}</p>
              <p className={propres.detail}>{etape.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className={styles.section}>
        <span className={styles.surtitre}>La règle absolue</span>
        <h2>Aucun contrôle ne disparaît du rapport</h2>
        <p>
          Le moteur rend {NOMBRE_CONTROLES} résultats. Toujours. Un contrôle qui n’a pas trouvé sa
          clause ressort « à vérifier manuellement », avec sa gravité et sa place dans la matrice.
        </p>
        <p>
          Une ligne absente se lit comme « pas de problème sur ce point ». C’est faux : la clause
          n’a simplement pas été trouvée. Ce faux négatif silencieux est le pire mode de
          défaillance possible sur un outil qui touche au devoir de conseil, et c’est la seule
          règle du produit qui n’a jamais souffert d’exception.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.surtitre}>Quatre natures de défaut</span>
        <h2>Ce qu’une pièce d’assurance peut, et ne peut pas, démontrer</h2>
        <p>
          Tous les contrôles ne se tranchent pas de la même façon. Cette distinction commande
          l’ordre des recommandations — et interdit de proposer une extension de garantie là où
          seule la rédaction est en cause.
        </p>

        <div className={styles.tableauEnveloppe}>
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th scope="col">Nature</th>
                <th scope="col">Nombre</th>
                <th scope="col">Ce que cela implique</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Croisement</th>
                <td>{croisements}</td>
                <td>
                  L’écart n’apparaît qu’en confrontant les deux documents. Sans pièce d’assurance,
                  le contrôle reste à vérifier.
                </td>
              </tr>
              <tr>
                <th scope="row">Double</th>
                <td>{doubles}</td>
                <td>
                  Visible dans la rédaction, et aggravé au croisement. Les deux corrections se
                  cumulent.
                </td>
              </tr>
              <tr>
                <th scope="row">Transfert de bail</th>
                <td>{transferts}</td>
                <td>
                  Le défaut vient de la rédaction elle-même. Aucune police ne rend souhaitable un
                  transfert déséquilibré.
                </td>
              </tr>
              <tr>
                <th scope="row">Formalisme</th>
                <td>{formalisme}</td>
                <td>Procédure, délais, sanctions. Aucune pièce d’assurance ne répond au point.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.surtitre}>L’ordre des corrections</span>
        <h2>Le bail d’abord, la police ensuite</h2>
        <p>
          Sur {sansRepli} des {NOMBRE_CONTROLES} contrôles, il n’existe aucun repli d’assurance :
          le rapport le dit en toutes lettres au lieu de laisser la case vide. Sur les autres, la
          correction contractuelle est toujours proposée en premier, et l’adaptation du programme
          en second.
        </p>
        <p>
          Ce n’est pas une préférence de style. Une extension de garantie se paie chaque année ;
          une clause renégociée se paie une fois. Présenter les choses dans l’autre sens
          reviendrait à faire financer par le client une rédaction qu’il n’aurait pas dû accepter.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.surtitre}>Ce que la méthode ne fait pas</span>
        <h2>Les limites, écrites avant que vous ne les rencontriez</h2>
        <ul className={styles.listeNiee}>
          <li>
            Elle ne rend pas d’avis juridique et ne garantit aucune couverture. Le rapport porte
            cette mention, et il sort sous votre nom.
          </li>
          <li>
            Elle ne lit pas un scan sans couche texte : l’outil le signale page par page plutôt que
            de rendre un rapport vide qui aurait l’air complet.
          </li>
          <li>
            Elle ne dispense pas de l’examen des conditions générales et particulières des polices.
          </li>
          <li>
            Elle ne devine jamais une date : une relance calculée sur une date fausse est pire
            qu’une relance non calculée.
          </li>
        </ul>
        <div className={styles.appels}>
          <Link href="/controles" className={styles.boutonPrimaire}>
            Voir les {NOMBRE_CONTROLES} contrôles
          </Link>
          <Link href="/livrable" className={styles.boutonSecondaire}>
            Ce que vous remettez au client
          </Link>
        </div>
      </section>
    </main>
  )
}
