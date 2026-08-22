'use client'

import type { Dossier } from '@/domain/dossier'
import type { DocumentImporte, RoleDocument } from '@/lib/import'

import styles from '../atelier.module.css'
import { Repliable } from './Repliable'
import { Sauvegarde } from '../composants/Sauvegarde'
import { ZoneImport } from '../composants/ZoneImport'

/**
 * Les pièces — ce que j'ai reçu, et dans quel rôle (§17-39).
 *
 * « Séparé des résultats », dit le brief, et c'est le point : l'ancien poste
 * mêlait le dépôt des fichiers, la sauvegarde du dossier et le rattachement
 * manuel d'un passage à un contrôle dans la même colonne que la matrice. Trois
 * gestes de nature différente, dont un seul est du travail d'analyse.
 *
 * Ici : ce qui est entré, dans quel rôle, avec quel avertissement de lecture.
 * Le rattachement manuel, qui est un geste d'expert sur un contrôle nommé, a
 * rejoint l'écran des contrôles.
 */

const LIBELLE_ROLE: Record<RoleDocument, string> = {
  OBLIGATION: 'Bail',
  COUVERTURE: 'Contrat',
  ATTESTATION: 'Attestation',
}

const taille = (octets: number): string =>
  octets < 1024 ? `${octets} o` : `${Math.round(octets / 1024)} Ko`

function Piece({
  document,
  onRetirer,
}: {
  readonly document: DocumentImporte
  readonly onRetirer: () => void
}) {
  const details = [
    document.format.toUpperCase(),
    taille(document.taille),
    document.pages === null ? null : `${document.pages} page${document.pages > 1 ? 's' : ''}`,
    document.piecesJointes.length > 0
      ? `${document.piecesJointes.length} pièce${document.piecesJointes.length > 1 ? 's' : ''} jointe${document.piecesJointes.length > 1 ? 's' : ''}`
      : null,
  ].filter((d): d is string => d !== null)

  return (
    <li className={styles.piece}>
      <div>
        <div className={styles.pieceNom}>{document.nom}</div>
        <div className={styles.pieceDetail}>{details.join(' · ')}</div>
        {document.avertissements.map((avertissement) => (
          <p key={avertissement} className={styles.pieceAvertissement}>
            {avertissement}
          </p>
        ))}
      </div>
      <div className={styles.actions}>
        <span className={styles.pieceRole}>{LIBELLE_ROLE[document.role]}</span>
        <button type="button" className={styles.retirer} onClick={onRetirer}>
          Retirer
        </button>
      </div>
    </li>
  )
}

export function EcranPieces({
  dossier,
  lectureEnCours,
  erreursImport,
  enregistreLe,
  onImporter,
  onRetirer,
  onEnregistre,
  onCharger,
}: {
  readonly dossier: Dossier
  readonly lectureEnCours: boolean
  readonly erreursImport: readonly string[]
  readonly enregistreLe: string | null
  readonly onImporter: (fichiers: readonly File[], role: RoleDocument) => void
  readonly onRetirer: (id: string) => void
  readonly onEnregistre: () => void
  readonly onCharger: (dossier: Dossier) => void
}) {
  const manquants = (['OBLIGATION', 'COUVERTURE', 'ATTESTATION'] as const).filter(
    (role) => !dossier.documents.some((d) => d.role === role),
  )

  return (
    <>
      {dossier.documents.length > 0 && (
        <>
          <h2 className={styles.titreBloc}>Au dossier</h2>
          <ul className={styles.pieces}>
            {dossier.documents.map((document) => (
              <Piece
                key={document.id}
                document={document}
                onRetirer={() => onRetirer(document.id)}
              />
            ))}
          </ul>
          {manquants.length > 0 && (
            <p className={styles.reste} style={{ marginBottom: 'calc(var(--pas) * 8)' }}>
              {/*
                Ce n'est pas un reproche : un dossier sans contrat s'analyse
                très bien, il conclut simplement « non démontré » plutôt que
                « écart ». L'écran le dit, il ne le déplore pas.
              */}
              Aucun{manquants.length > 1 ? 'e pièce des rôles' : ' document du rôle'}{' '}
              {manquants.map((role) => LIBELLE_ROLE[role].toLowerCase()).join(', ')} n’a été
              importé. Sans contrat, aucune absence de couverture ne peut être établie.
            </p>
          )}
        </>
      )}

      <div className={styles.heritage}>
        <ZoneImport
          documents={dossier.documents}
          enCours={lectureEnCours}
          erreurs={erreursImport}
          onImporter={onImporter}
        />
        <Repliable
          titre="Sauvegarde du dossier"
          note={
            enregistreLe === null
              ? 'jamais enregistré — le fichier .clauzy est la seule sauvegarde'
              : dossier.majLe > enregistreLe
                ? 'modifications non enregistrées'
                : 'à jour'
          }
        >
          <Sauvegarde
            dossier={dossier}
            enregistreLe={enregistreLe}
            onEnregistre={onEnregistre}
            onCharger={onCharger}
          />
        </Repliable>
      </div>
    </>
  )
}
