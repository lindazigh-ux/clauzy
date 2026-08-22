'use client'

import type { Gravite, Statut } from '@/domain/controles'
import { LIBELLE_STATUT } from '@/domain/controles'
import {
  preconisations,
  resultatsAffiches,
  synthetiser,
  type Ajustement,
  type Dossier,
  type LigneRapport,
  type Rattachement,
} from '@/domain/dossier'

import styles from '../atelier.module.css'
import { EditeurLigne } from '../composants/EditeurLigne'
import { LecteurDocument } from '../composants/LecteurDocument'
import { Matrice, Synthese, type FiltreEtat } from '../composants/Matrice'

/**
 * Le mode expert (brief §39).
 *
 * Tout ce qui décrit l'OUTIL vit ici, et nulle part ailleurs : la matrice des
 * quarante-cinq contrôles, les identifiants, les scores de confiance, les
 * traces de détection, le rattachement manuel d'un passage à un contrôle.
 *
 * Rien n'a été supprimé de l'ancien poste — le praticien reste décisionnaire
 * (§39) et garde chaque geste. Ce qui change, c'est qu'il n'est plus obligé de
 * traverser quarante-cinq lignes pour travailler sur les cinq qui comptent.
 */

/**
 * Les ajustements du praticien, tels qu'ils survivront à la prochaine analyse.
 *
 * Le §39 impose de les tracer : auteur, date, ancien état, nouvel état, motif.
 * L'ancien état est celui du MOTEUR — c'est lui que l'ajustement contredit, et
 * sans lui la trace ne dit pas ce qui a été décidé.
 */
function Ajustements({
  lignes,
  ajustements,
}: {
  readonly lignes: readonly LigneRapport[]
  readonly ajustements: Readonly<Record<string, Ajustement>>
}) {
  const touchees = lignes.filter((ligne) => ligne.ajustee)
  if (touchees.length === 0) return null

  /** Ce qui a changé, et depuis quoi. L'ancien état est celui du MOTEUR. */
  const changement = (ligne: LigneRapport, ajustement: Ajustement): string => {
    const avant = ligne.resultatMoteur?.statut ?? null
    const morceaux: string[] = []
    if (ajustement.ecarte) morceaux.push('écarté comme faux positif')
    if (ajustement.statutForce !== null) {
      morceaux.push(
        `${avant === null ? 'sans conclusion' : LIBELLE_STATUT[avant]} → ${LIBELLE_STATUT[ajustement.statutForce]}`,
      )
    }
    if (ajustement.graviteForcee !== null) {
      morceaux.push(`gravité ${ligne.controle.gravite} → ${ajustement.graviteForcee}`)
    }
    if (ajustement.analyseReecrite !== null) morceaux.push('analyse réécrite')
    if (ajustement.redactionReecrite !== null) morceaux.push('rédaction réécrite')
    if (ajustement.rattachements.length > 0) {
      const n = ajustement.rattachements.length
      morceaux.push(`${n} passage${n > 1 ? 's' : ''} rattaché${n > 1 ? 's' : ''} à la main`)
    }
    return morceaux.length === 0 ? 'ligne reprise' : morceaux.join(' · ')
  }

  const quand = (horodatage: string): string =>
    new Date(horodatage).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <section>
      <h2 className={styles.titreBloc}>Ajustements du praticien</h2>
      <p className={styles.avertissementExpert}>
        Ces décisions survivent à une nouvelle analyse : relancer le moteur ne les efface pas.
      </p>
      <ul className={styles.ajustements}>
        {touchees.map((ligne) => {
          const ajustement = ajustements[ligne.controle.id]
          if (ajustement === undefined) return null
          return (
            <li key={ligne.controle.id} className={styles.ajustement}>
              <span className={styles.ajustementQuoi}>
                <code>{ligne.controle.id}</code> — {changement(ligne, ajustement)}
              </span>
              {ajustement.motif.trim().length > 0 && (
                <span className={styles.ajustementQuoi}>« {ajustement.motif} »</span>
              )}
              <span className={styles.ajustementQui}>
                {ajustement.auteur} · {quand(ajustement.horodatage)}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function EcranControles({
  dossier,
  filtre,
  selection,
  erreur,
  onFiltrer,
  onSelectionner,
  onReecrire,
  onGravite,
  onEcarter,
  onReprendre,
  onForcerStatut,
  onDetacher,
  onRattacher,
}: {
  readonly dossier: Dossier
  readonly filtre: FiltreEtat
  readonly selection: string | null
  readonly erreur: string | null
  readonly onFiltrer: (filtre: FiltreEtat) => void
  readonly onSelectionner: (id: string) => void
  readonly onReecrire: (id: string, champs: { analyse?: string; redaction?: string }) => void
  readonly onGravite: (id: string, gravite: Gravite) => void
  readonly onEcarter: (id: string, motif: string) => void
  readonly onReprendre: (id: string) => void
  readonly onForcerStatut: (id: string, statut: Statut, motif: string) => void
  readonly onDetacher: (id: string, index: number) => void
  readonly onRattacher: (controleId: string, rattachement: Rattachement) => void
}) {
  const lignes = resultatsAffiches(dossier)
  const synthese = synthetiser(dossier)
  const enjeux = preconisations(dossier).filter((ligne) => ligne.resumeEcart !== null)
  const ligneActive = lignes.find((l) => l.controle.id === selection) ?? null

  return (
    <>
      <p className={styles.avertissementExpert}>
        Cet écran montre le travail du moteur : chaque contrôle du référentiel, son identifiant, sa
        confiance et ce qui l’a déclenché. C’est ici qu’on reprend une ligne à la main — et une
        ligne reprise n’est jamais effacée par une nouvelle analyse.
      </p>

      <div className={styles.heritage}>
        <Synthese synthese={synthese} enjeux={enjeux} filtre={filtre} onFiltrer={onFiltrer} />

        <Matrice
          lignes={lignes}
          filtre={filtre}
          selection={selection}
          onSelectionner={onSelectionner}
        />

        {ligneActive !== null && (
          <EditeurLigne
            key={ligneActive.controle.id}
            ligne={ligneActive}
            erreur={erreur}
            onReecrire={(champs) => onReecrire(ligneActive.controle.id, champs)}
            onGravite={(gravite) => onGravite(ligneActive.controle.id, gravite)}
            onEcarter={(motif) => onEcarter(ligneActive.controle.id, motif)}
            onReprendre={() => onReprendre(ligneActive.controle.id)}
            onForcerStatut={(statut, motif) =>
              onForcerStatut(ligneActive.controle.id, statut, motif)
            }
            onDetacher={(index) => onDetacher(ligneActive.controle.id, index)}
          />
        )}

        <LecteurDocument
          documents={dossier.documents}
          controleSuggere={selection}
          onRattacher={onRattacher}
        />

        <Ajustements lignes={lignes} ajustements={dossier.ajustements} />
      </div>
    </>
  )
}
