'use client'

import { useRef, useState } from 'react'

import { REFERENTIEL } from '@/domain/controles'
import type { CoteRattachement, Rattachement } from '@/domain/dossier'
import type { DocumentImporte } from '@/lib/import'

import styles from '../dossier.module.css'

/**
 * Lecteur de document et rattachement manuel (brief §6).
 *
 * Le geste central du poste de travail : la praticienne selectionne un passage
 * et le relie a un controle que le moteur n'a pas trouve. Il regle l'essentiel
 * du probleme des baux atypiques SANS toucher au moteur — ce qui vaut
 * infiniment mieux que d'elargir un motif et de recolter des faux positifs sur
 * tous les autres dossiers.
 *
 * Les offsets sont calcules par rapport au texte d'origine, pas au rendu : ce
 * sont eux qui porteront l'ancrage des commentaires Word (§7).
 */
export type LecteurDocumentProps = {
  readonly documents: readonly DocumentImporte[]
  readonly controleSuggere: string | null
  readonly onRattacher: (controleId: string, rattachement: Rattachement) => void
}

type SelectionTexte = {
  readonly documentId: string
  readonly debut: number
  readonly fin: number
  readonly texte: string
}

export function LecteurDocument({
  documents,
  controleSuggere,
  onRattacher,
}: LecteurDocumentProps) {
  const [documentActif, setDocumentActif] = useState(documents[0]?.id ?? '')
  const [selection, setSelection] = useState<SelectionTexte | null>(null)
  const [cible, setCible] = useState(controleSuggere ?? REFERENTIEL[0]?.id ?? '')
  const [cote, setCote] = useState<CoteRattachement>('OBLIGATION')
  const conteneur = useRef<HTMLDivElement>(null)

  const courant = documents.find((d) => d.id === documentActif) ?? documents[0] ?? null

  if (courant === null) {
    return (
      <section className={styles.carte} aria-labelledby="titre-lecteur">
        <h2 id="titre-lecteur">Rattacher une clause</h2>
        <p className={styles.vide}>
          Importez une pièce pour pouvoir relier un passage à un contrôle que le moteur n’a pas su
          trancher.
        </p>
      </section>
    )
  }

  /**
   * Convertit la selection du navigateur en offsets absolus dans le texte
   * source. On mesure la distance depuis le debut du conteneur plutot que de se
   * fier a l'offset du noeud : le rendu peut couper le texte en plusieurs
   * noeuds sans prevenir.
   */
  const releverSelection = () => {
    const zone = conteneur.current
    const selectionDom = typeof window === 'undefined' ? null : window.getSelection()
    if (zone === null || selectionDom === null || selectionDom.isCollapsed) return
    if (selectionDom.rangeCount === 0) return

    const plage = selectionDom.getRangeAt(0)
    if (!zone.contains(plage.commonAncestorContainer)) return

    const avant = plage.cloneRange()
    avant.selectNodeContents(zone)
    avant.setEnd(plage.startContainer, plage.startOffset)

    const debut = avant.toString().length
    const texte = plage.toString()
    if (texte.trim().length === 0) return

    setSelection({ documentId: courant.id, debut, fin: debut + texte.length, texte })
  }

  const rattacher = () => {
    if (selection === null || cible.length === 0) return
    onRattacher(cible, {
      documentId: selection.documentId,
      debut: selection.debut,
      fin: selection.fin,
      texte: selection.texte,
      cote,
    })
    setSelection(null)
  }

  return (
    <section className={styles.carte} aria-labelledby="titre-lecteur">
      <h2 id="titre-lecteur">Rattacher une clause</h2>

      {documents.length > 1 && (
        <div className={styles.rangee} style={{ marginBottom: 'calc(var(--pas) * 3)' }}>
          <select
            className={styles.roleSelect}
            value={courant.id}
            aria-label="Pièce à lire"
            onChange={(e) => {
              setDocumentActif(e.target.value)
              setSelection(null)
            }}
          >
            {documents.map((document) => (
              <option key={document.id} value={document.id}>
                {document.nom}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className={styles.vide} style={{ marginBottom: 'calc(var(--pas) * 3)' }}>
        Sélectionnez un passage — à la souris ou au clavier — puis reliez-le au contrôle concerné.
      </p>

      <div
        ref={conteneur}
        className={styles.lecteur}
        tabIndex={0}
        role="document"
        aria-label={`Texte de ${courant.nom}`}
        onMouseUp={releverSelection}
        onKeyUp={releverSelection}
      >
        {courant.texte}
      </div>

      {selection !== null && (
        <div className={styles.selection}>
          <span className={styles.selectionExtrait}>« {selection.texte} »</span>

          <div className={styles.rangee}>
            <select
              className={styles.roleSelect}
              value={cible}
              aria-label="Contrôle à rattacher"
              onChange={(e) => setCible(e.target.value)}
            >
              {REFERENTIEL.map((controle) => (
                <option key={controle.id} value={controle.id}>
                  {controle.id} — {controle.titre}
                </option>
              ))}
            </select>

            <select
              className={styles.roleSelect}
              value={cote}
              aria-label="Côté du rattachement"
              onChange={(e) => setCote(e.target.value as CoteRattachement)}
            >
              <option value="OBLIGATION">Ce que le bail exige</option>
              <option value="COUVERTURE">Ce que la pièce démontre</option>
            </select>

            <button type="button" className={styles.boutonPrimaire} onClick={rattacher}>
              Rattacher ce passage
            </button>
            <button
              type="button"
              className={styles.boutonDiscret}
              onClick={() => setSelection(null)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
