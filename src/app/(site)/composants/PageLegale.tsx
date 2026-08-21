import { MAJ_LEGALE, MAJ_LEGALE_FR } from '@/contenu/editeur'

import styles from '../site.module.css'
import propres from './legal.module.css'

/**
 * Gabarit des pages legales (brief §10).
 *
 * Une mise en page de document, pas de page marketing : numerotation d'article
 * visible, mesure courte, date de mise a jour en tete. Ces textes sont faits
 * pour etre cites et compares d'une version a l'autre.
 */
export function PageLegale({
  titre,
  chapo,
  children,
}: {
  titre: string
  chapo?: string
  children: React.ReactNode
}) {
  return (
    <main className="page">
      <span className={styles.surtitre}>Informations légales</span>
      <h1>{titre}</h1>
      {chapo !== undefined && <p className={styles.chapo}>{chapo}</p>}
      <p className={propres.maj}>
        Dernière mise à jour : <time dateTime={MAJ_LEGALE}>{MAJ_LEGALE_FR}</time>
      </p>
      <div className={propres.corps}>{children}</div>
    </main>
  )
}

export function Article({
  numero,
  titre,
  children,
}: {
  numero: string
  titre: string
  children: React.ReactNode
}) {
  return (
    <section className={propres.article}>
      <h2 className={propres.articleTitre}>
        <span className={propres.articleNumero}>{numero}</span>
        {titre}
      </h2>
      {children}
    </section>
  )
}

/** Tableau a deux colonnes : intitule / valeur. Sert aux identites et aux DPA. */
export function Definitions({
  lignes,
}: {
  lignes: readonly { readonly terme: string; readonly valeur: React.ReactNode }[]
}) {
  return (
    <dl className={propres.definitions}>
      {lignes.map((ligne) => (
        <div key={ligne.terme} className={propres.definition}>
          <dt>{ligne.terme}</dt>
          <dd>{ligne.valeur}</dd>
        </div>
      ))}
    </dl>
  )
}
