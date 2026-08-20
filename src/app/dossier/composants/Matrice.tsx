'use client'

import { Statut } from '@/domain/controles'
import type { LigneRapport, SyntheseDossier } from '@/domain/dossier'

import styles from '../dossier.module.css'
import { Etiquette } from './etiquettes'

/**
 * Synthese et matrice des 40 controles (brief §5.2, §7).
 *
 * Le resume passe devant le detail : la phrase de tete, les compteurs, puis les
 * enjeux chiffres — un directeur immobilier reagit a un euro, pas a « gravite 3 ».
 *
 * Le filtre ne masque JAMAIS un controle du rapport : il ne filtre que
 * l'affichage de travail, et le compteur reste sur 40. Un controle absent d'un
 * rapport se lit « pas de probleme », ce qui est faux.
 */
export type FiltreEtat = Statut | 'TOUS' | 'ECARTES'

type Compteur = {
  readonly filtre: FiltreEtat
  readonly libelle: string
  readonly classe: string
}

const COMPTEURS: readonly Compteur[] = [
  { filtre: 'TOUS', libelle: 'contrôles', classe: '' },
  { filtre: Statut.ECART, libelle: 'écarts', classe: styles.compteurEcart ?? '' },
  { filtre: Statut.CONFORME, libelle: 'conformes', classe: styles.compteurConforme ?? '' },
  { filtre: Statut.ABSENT_DU_BAIL, libelle: 'sans objet', classe: styles.compteurAbsent ?? '' },
  { filtre: Statut.NON_DETECTE, libelle: 'à vérifier', classe: styles.compteurVerifier ?? '' },
  { filtre: 'ECARTES', libelle: 'écartés', classe: '' },
]

const valeur = (synthese: SyntheseDossier, filtre: FiltreEtat): number => {
  switch (filtre) {
    case 'TOUS':
      return synthese.total
    case 'ECARTES':
      return synthese.ecartes
    case Statut.ECART:
      return synthese.ecarts
    case Statut.CONFORME:
      return synthese.conformes
    case Statut.ABSENT_DU_BAIL:
      return synthese.sansObjet
    case Statut.NON_DETECTE:
      return synthese.aVerifier
  }
}

export function Synthese({
  synthese,
  enjeux,
  filtre,
  onFiltrer,
}: {
  readonly synthese: SyntheseDossier
  readonly enjeux: readonly LigneRapport[]
  readonly filtre: FiltreEtat
  readonly onFiltrer: (filtre: FiltreEtat) => void
}) {
  return (
    <section className={styles.carte} aria-labelledby="titre-synthese">
      <h2 id="titre-synthese">Synthèse</h2>
      <p className={styles.phrase}>{synthese.phrase}</p>

      <div className={styles.compteurs}>
        {COMPTEURS.map(({ filtre: valeurFiltre, libelle, classe }) => (
          <button
            key={String(valeurFiltre)}
            type="button"
            className={`${styles.compteurCase} ${classe}`}
            aria-pressed={filtre === valeurFiltre}
            onClick={() => onFiltrer(valeurFiltre)}
          >
            <span className={styles.compteurValeur}>{valeur(synthese, valeurFiltre)}</span>
            <span className={styles.compteurLibelle}>{libelle}</span>
          </button>
        ))}
      </div>

      {enjeux.length > 0 && (
        <ul className={styles.enjeux}>
          {enjeux.map((ligne) => (
            <li key={ligne.controle.id} className={styles.enjeu}>
              <span className={styles.enjeuChiffre}>{ligne.resumeEcart}</span>
              <span className={styles.enjeuTitre}>{ligne.controle.titre}</span>
            </li>
          ))}
        </ul>
      )}

      {synthese.mentionAjustement !== null && (
        <p className={styles.mention}>{synthese.mentionAjustement}</p>
      )}
    </section>
  )
}

/** Le lisere qui porte l'etat, avant meme la lecture du titre. */
const lisere = (ligne: LigneRapport): string => {
  if (ligne.ecarte) return styles.lisereEcarte ?? ''
  if (ligne.statut === Statut.ECART) {
    return (ligne.gravite === 3 ? styles.lisereEcart : styles.lisereEcartMineur) ?? ''
  }
  if (ligne.statut === Statut.CONFORME) return styles.lisereConforme ?? ''
  if (ligne.statut === Statut.NON_DETECTE) return styles.lisereVerifier ?? ''
  return ''
}

export function Matrice({
  lignes,
  filtre,
  selection,
  onSelectionner,
}: {
  readonly lignes: readonly LigneRapport[]
  readonly filtre: FiltreEtat
  readonly selection: string | null
  readonly onSelectionner: (controleId: string) => void
}) {
  const visibles = lignes.filter((ligne) => {
    if (filtre === 'TOUS') return true
    if (filtre === 'ECARTES') return ligne.ecarte
    return !ligne.ecarte && ligne.statut === filtre
  })

  return (
    <section className={styles.carte} aria-labelledby="titre-matrice">
      <h2 id="titre-matrice">
        Matrice des contrôles
        <span className={styles.compteur}>
          {visibles.length} affiché{visibles.length > 1 ? 's' : ''} sur {lignes.length}
        </span>
      </h2>

      {visibles.length === 0 ? (
        <p className={styles.vide}>
          Aucun contrôle dans cet état. Choisissez un autre compteur pour revenir à la matrice
          complète.
        </p>
      ) : (
        <ul className={styles.matrice}>
          {visibles.map((ligne) => (
            <li key={ligne.controle.id}>
              <button
                type="button"
                className={[
                  styles.ligne,
                  lisere(ligne),
                  ligne.ecarte ? styles.ligneEcartee : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={selection === ligne.controle.id}
                onClick={() => onSelectionner(ligne.controle.id)}
              >
                <span className={styles.identifiant}>{ligne.controle.id}</span>
                <span className={styles.titreLigne}>
                  {ligne.controle.titre}
                  {ligne.ajustee && <span className={styles.marqueAjustee}>ajusté</span>}
                  <span className={styles.sousTitre}>
                    {ligne.resumeEcart !== null ? (
                      <span className={styles.chiffre}>{ligne.resumeEcart}</span>
                    ) : (
                      ligne.controle.obligation
                    )}
                  </span>
                </span>
                <Etiquette statut={ligne.statut} gravite={ligne.gravite} ecarte={ligne.ecarte} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
