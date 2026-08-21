'use client'

import { useId, useRef, useState } from 'react'

import type { DocumentImporte, RoleDocument } from '@/lib/import'

import styles from '../dossier.module.css'

/**
 * Import local des pieces (brief §3, §6).
 *
 * Les fichiers sont lus dans le navigateur, jamais televerses. Le libelle le
 * dit explicitement : c'est la premiere chose qu'un directeur juridique
 * verifie, et il ne doit pas avoir a lire la page /securite pour en etre sur.
 */
export type ZoneImportProps = {
  readonly documents: readonly DocumentImporte[]
  readonly enCours: boolean
  readonly erreurs: readonly string[]
  readonly onImporter: (fichiers: readonly File[], role: RoleDocument) => void
  readonly onRetirer: (documentId: string) => void
}

/**
 * Trois natures de piece, et la distinction compte : une attestation prouve
 * qu'un contrat existe, pas ce qu'il couvre. Ranger l'une pour l'autre fausse
 * le niveau de preuve du rapport.
 */
const LIBELLE_ROLE: Record<RoleDocument, string> = {
  OBLIGATION: 'Bail et avenants',
  COUVERTURE: 'Contrat d’assurance — conditions particulières et générales',
  ATTESTATION: 'Attestation d’assurance ou courriel',
}

const poids = (octets: number): string =>
  octets < 1024 * 1024
    ? `${Math.max(1, Math.round(octets / 1024))} Ko`
    : `${(octets / (1024 * 1024)).toFixed(1)} Mo`

export function ZoneImport({
  documents,
  enCours,
  erreurs,
  onImporter,
  onRetirer,
}: ZoneImportProps) {
  const [role, setRole] = useState<RoleDocument>('OBLIGATION')
  const [survol, setSurvol] = useState(false)
  const entree = useRef<HTMLInputElement>(null)
  const idRole = useId()

  const deposer = (fichiers: FileList | null) => {
    if (fichiers === null || fichiers.length === 0) return
    onImporter(Array.from(fichiers), role)
  }

  return (
    <section className={styles.carte} aria-labelledby="titre-import">
      <h2 id="titre-import">
        Pièces du dossier
        <span className={styles.compteur}>{documents.length} importée{documents.length > 1 ? 's' : ''}</span>
      </h2>

      <div className={styles.rangee} style={{ marginBottom: 'calc(var(--pas) * 4)' }}>
        <label className={styles.champLabel} htmlFor={idRole}>
          Nature de la pièce
        </label>
        <select
          id={idRole}
          className={styles.roleSelect}
          value={role}
          onChange={(e) => setRole(e.target.value as RoleDocument)}
        >
          {(Object.keys(LIBELLE_ROLE) as RoleDocument[]).map((valeur) => (
            <option key={valeur} value={valeur}>
              {LIBELLE_ROLE[valeur]}
            </option>
          ))}
        </select>
      </div>

      <div
        className={`${styles.zoneDepot} ${survol ? styles.zoneDepotActive : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setSurvol(true)
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault()
          setSurvol(false)
          deposer(e.dataTransfer.files)
        }}
      >
        <p>
          Déposez le bail, les conditions particulières et générales, les avenants, les
          attestations. PDF, Word et courriels Outlook sont lus <strong>sur votre poste</strong> :
          aucun fichier n’est transmis.
        </p>
        <button
          type="button"
          className={styles.boutonPrimaire}
          onClick={() => entree.current?.click()}
          disabled={enCours}
        >
          {enCours ? 'Lecture en cours…' : 'Choisir des fichiers'}
        </button>
        <input
          ref={entree}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.msg,.txt,.md"
          hidden
          onChange={(e) => {
            deposer(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {erreurs.map((erreur) => (
        <p key={erreur} className={styles.erreur} role="alert">
          {erreur}
        </p>
      ))}

      {documents.length > 0 && (
        <ul className={styles.listeDocuments}>
          {documents.map((document) => (
            <li key={document.id} className={styles.document}>
              <span className={styles.documentNom}>
                {document.nom}
                <span className={styles.documentMeta}>
                  {' '}
                  · {LIBELLE_ROLE[document.role]} · {poids(document.taille)}
                  {document.pages === null ? '' : ` · ${document.pages} page${document.pages > 1 ? 's' : ''}`}
                  {document.piecesJointes.length > 0
                    ? ` · ${document.piecesJointes.length} pièce${document.piecesJointes.length > 1 ? 's' : ''} jointe${document.piecesJointes.length > 1 ? 's' : ''}`
                    : ''}
                </span>
              </span>
              <button
                type="button"
                className={styles.boutonDiscret}
                onClick={() => onRetirer(document.id)}
              >
                Retirer du dossier
              </button>
              {document.avertissements.map((avertissement) => (
                <p key={avertissement} className={styles.avertissement} style={{ flexBasis: '100%' }}>
                  {avertissement}
                </p>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
