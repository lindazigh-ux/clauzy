import type { Metadata } from 'next'
import Link from 'next/link'

import { PLANS, remiseAnnuelle } from '@/contenu/tarifs'
import { partage } from '@/contenu/site'
import { NOMBRE_CONTROLES } from '@/domain/controles'

import styles from '../site.module.css'
import propres from './tarifs.module.css'

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    'Quatre plans : Essai gratuit, Praticien, Cabinet et Grands comptes. Les 40 contrôles sont inclus dans tous, y compris l’essai. Abonnement, jamais de facturation au dossier.',
  ...partage({
    titre: 'Tarifs — Clauzy',
    description:
      'Essai gratuit, Praticien, Cabinet, Grands comptes. Les 40 contrôles inclus partout.',
    chemin: '/tarifs',
  }),
}

const prix = (montant: number | null): string =>
  montant === null ? 'Sur devis' : montant === 0 ? 'Gratuit' : `${montant} €`

export default function Tarifs() {
  return (
    <main className="page">
      <span className={styles.surtitre}>Tarifs</span>
      <h1>
        Un abonnement, <span className={styles.accroche}>pas une facturation au dossier.</span>
      </h1>
      <p className={styles.chapo}>
        Facturer à l’analyse pousserait à en faire moins. Les {NOMBRE_CONTROLES} contrôles sont
        inclus dans tous les plans, y compris dans l’essai gratuit : ce qui se paie, c’est la
        livraison à votre nom, pas la vérification.
      </p>

      <div className={propres.plans}>
        {PLANS.map((plan) => {
          const remise = remiseAnnuelle(plan)
          return (
            <article
              key={plan.id}
              className={plan.misEnAvant === true ? propres.planMisEnAvant : propres.plan}
            >
              {plan.misEnAvant === true && <span className={propres.ruban}>Le plus courant</span>}

              <h2 className={propres.planNom}>{plan.nom}</h2>
              <p className={propres.pourQui}>{plan.pourQui}</p>

              <p className={propres.prix}>
                <strong>{prix(plan.mensuel)}</strong>
                {plan.mensuel !== null && plan.mensuel > 0 && (
                  <span className={propres.prixUnite}> HT / mois</span>
                )}
              </p>
              {remise !== null && remise > 0 && (
                <p className={propres.prixAnnuel}>
                  {plan.annuel} € HT / mois en engagement annuel — {remise} % d’économie
                </p>
              )}

              <ul className={styles.listeCochee}>
                {plan.inclus.map((ligne) => (
                  <li key={ligne}>{ligne}</li>
                ))}
              </ul>

              {plan.limites.length > 0 && (
                <ul className={styles.listeNiee}>
                  {plan.limites.map((ligne) => (
                    <li key={ligne}>{ligne}</li>
                  ))}
                </ul>
              )}

              <Link
                href={plan.cheminAppel}
                className={
                  plan.misEnAvant === true ? styles.boutonPrimaire : styles.boutonSecondaire
                }
              >
                {plan.appel}
              </Link>
            </article>
          )
        })}
      </div>

      <section className={styles.section}>
        <h2>Ce que tous les plans partagent</h2>
        <div className={styles.grilleLarge}>
          <article className={styles.carte}>
            <h3>Les {NOMBRE_CONTROLES} contrôles</h3>
            <p>
              Aucun plan ne bride le référentiel. Un contrôle réservé aux abonnés payants serait un
              contrôle manquant dans un rapport, et donc un faux négatif silencieux.
            </p>
          </article>
          <article className={styles.carte}>
            <h3>L’analyse locale</h3>
            <p>
              Vos documents restent dans votre navigateur, quel que soit le plan. La
              confidentialité n’est pas une option d’abonnement.
            </p>
          </article>
          <article className={styles.carte}>
            <h3>Dossiers illimités dès le plan Praticien</h3>
            <p>
              Seul l’essai est plafonné, à trois dossiers, avec un livrable en filigrane. Au-delà,
              rien ne se compte au dossier.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Les questions qui reviennent</h2>
        <dl className={propres.questions}>
          <dt>Pourquoi un abonnement plutôt qu’un paiement à l’analyse ?</dt>
          <dd>
            Parce qu’une facturation au dossier pousse à hésiter avant de lancer une vérification.
            C’est exactement le réflexe qu’un outil de conformité ne doit pas créer.
          </dd>
          <dt>Que devient mon travail si j’arrête l’abonnement ?</dt>
          <dd>
            Vos dossiers sont des fichiers sur votre poste, chiffrés par un mot de passe que vous
            choisissez. Ils ne sont pas chez nous, donc nous ne pouvons pas vous en priver. Les
            rapports déjà exportés restent des documents Word et PDF ordinaires.
          </dd>
          <dt>Comment vérifiez-vous mon abonnement si rien ne transite ?</dt>
          <dd>
            Par un jeton signé à durée courte, vérifié au démarrage de session. Sans lui,
            l’application se dégrade en mode démonstration — elle ne se bloque pas sur un dossier
            en cours.
          </dd>
          <dt>Les montants sont-ils négociables en grands comptes ?</dt>
          <dd>
            Oui, et le périmètre aussi : contrôles sur mesure versés à votre référentiel, revue
            d’architecture, DPA négocié.{' '}
            <Link href="/demo">Réservez une démonstration</Link> pour en parler.
          </dd>
        </dl>
      </section>

      <p className={propres.tva}>
        Montants hors taxes, TVA française applicable. Les tarifs affichés valent pour un
        engagement souscrit en ligne ; toute autre configuration passe par un devis.
      </p>
    </main>
  )
}
