'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Gravite, Statut } from '@/domain/controles'
import {
  ajouterDocument,
  ajouterObservation,
  detacher,
  dossierVierge,
  ecarter,
  enregistrerAnalyse,
  forcerGravite,
  forcerStatut,
  basculerJalon,
  majCabinet,
  majClient,
  majPerimetre,
  majReference,
  majSuivi,
  preconisations,
  rattacher,
  reecrire,
  reprendre,
  resultatsAffiches,
  retirerDocument,
  retirerObservation,
  synthetiser,
  type Cabinet,
  type Dossier,
  type FicheClient,
  type IdJalon,
  type Perimetre,
  type Rattachement,
  type Suivi as SuiviDossier,
} from '@/domain/dossier'
import { lancerAnalyse, lireFichier } from '@/lib/analyse/client'
import { documentsAnalysables, type DocumentImporte, type RoleDocument } from '@/lib/import'

import styles from './dossier.module.css'
import { EditeurLigne } from './composants/EditeurLigne'
import { LecteurDocument } from './composants/LecteurDocument'
import { Livrable } from './composants/Livrable'
import { Matrice, Synthese, type FiltreEtat } from './composants/Matrice'
import { PanneauObservations, PanneauPerimetre } from './composants/Perimetre'
import { RapportImprimable } from './composants/RapportImprimable'
import { Suivi } from './composants/Suivi'
import { Sauvegarde } from './composants/Sauvegarde'
import { ZoneImport } from './composants/ZoneImport'

/**
 * Poste de travail (brief §6).
 *
 * Clauzy n'est pas un pipeline automatique : c'est un outil que la
 * professionnelle reprend a la main avant de livrer. L'etat vit ici, en
 * memoire du navigateur, et n'en sort jamais — il n'existe aucun chemin de code
 * pour l'envoyer (§2).
 *
 * Toutes les transformations passent par les fonctions pures de
 * src/domain/dossier : ce composant ne fait qu'appeler et re-rendre.
 */
const AUTEUR_PAR_DEFAUT = 'Praticien'

export function PosteDeTravail() {
  const [dossier, setDossier] = useState<Dossier>(() => dossierVierge())
  const [selection, setSelection] = useState<string | null>(null)
  const [filtre, setFiltre] = useState<FiltreEtat>('TOUS')
  const [lectureEnCours, setLectureEnCours] = useState(false)
  const [analyseEnCours, setAnalyseEnCours] = useState(false)
  const [erreursImport, setErreursImport] = useState<readonly string[]>([])
  const [erreurEdition, setErreurEdition] = useState<string | null>(null)
  const [enregistreLe, setEnregistreLe] = useState<string | null>(null)

  const travailNonEnregistre =
    dossier.documents.length > 0 && (enregistreLe === null || dossier.majLe > enregistreLe)

  /**
   * Garde-fou de fermeture (§4, lot L3).
   *
   * Le fichier .clauzy est la seule sauvegarde : fermer l'onglet sans
   * enregistrer perd deux heures de travail. Le navigateur impose son propre
   * libelle — on ne peut que declencher la question, pas la rediger.
   */
  useEffect(() => {
    if (!travailNonEnregistre) return
    const prevenir = (evenement: BeforeUnloadEvent) => {
      evenement.preventDefault()
    }
    window.addEventListener('beforeunload', prevenir)
    return () => window.removeEventListener('beforeunload', prevenir)
  }, [travailNonEnregistre])

  const lignes = useMemo(() => resultatsAffiches(dossier), [dossier])
  const synthese = useMemo(() => synthetiser(dossier), [dossier])
  // Les enjeux chiffres remontent en tete : un directeur immobilier reagit a un
  // euro, pas a « gravite 3 » (§7).
  const enjeux = useMemo(
    () => preconisations(dossier).filter((ligne) => ligne.resumeEcart !== null),
    [dossier],
  )
  const ligneActive = lignes.find((l) => l.controle.id === selection) ?? null

  /** Enveloppe les gestes qui peuvent refuser : le motif manquant remonte a l'ecran. */
  const tenter = useCallback((geste: () => Dossier) => {
    try {
      setDossier(geste())
      setErreurEdition(null)
    } catch (erreur) {
      setErreurEdition(
        erreur instanceof Error
          ? erreur.message
          : 'Le geste n’a pas pu être enregistré. Reformulez-le et réessayez.',
      )
    }
  }, [])

  const importer = useCallback(async (fichiers: readonly File[], role: RoleDocument) => {
    setLectureEnCours(true)
    setErreursImport([])
    const echecs: string[] = []

    for (const fichier of fichiers) {
      try {
        const donnees = await fichier.arrayBuffer()
        const { document } = await lireFichier(fichier.name, donnees, role)
        setDossier((courant) => ajouterDocument(courant, document))
      } catch (erreur) {
        echecs.push(
          erreur instanceof Error
            ? erreur.message
            : `« ${fichier.name} » n’a pas pu être lu. Réenregistrez-le, ou collez son texte.`,
        )
      }
    }

    setErreursImport(echecs)
    setLectureEnCours(false)
  }, [])

  const analyser = useCallback(async () => {
    setAnalyseEnCours(true)
    setErreurEdition(null)
    try {
      const { analyse } = await lancerAnalyse(documentsAnalysables(dossier.documents))
      setDossier((courant) => enregistrerAnalyse(courant, analyse))
    } catch (erreur) {
      setErreurEdition(
        erreur instanceof Error
          ? erreur.message
          : 'L’analyse s’est interrompue. Rechargez la page et relancez-la.',
      )
    } finally {
      setAnalyseEnCours(false)
    }
  }, [dossier.documents])

  /**
   * Jeu d'exemple : six baux et deux polices, ecrits de toutes pieces (§5.4).
   * Charge a la demande — le corpus n'a rien a faire dans le bundle initial.
   */
  const chargerExemple = useCallback(async () => {
    const { BAUX, PIECES } = await import('@/domain/corpus/baux')
    const bail = BAUX.find((b) => b.id === 'bail-cc')
    const piece = PIECES.find((p) => p.id === 'cp-lacunaire')
    if (bail === undefined || piece === undefined) return

    const enDocument = (
      id: string,
      nom: string,
      texte: string,
      role: RoleDocument,
    ): DocumentImporte => ({
      id,
      nom,
      format: 'texte',
      role,
      texte,
      taille: texte.length,
      pages: null,
      avertissements: [],
      courriel: null,
      piecesJointes: [],
    })

    setDossier((courant) => {
      const avecBail = ajouterDocument(
        majReference(courant, 'EXEMPLE-001'),
        enDocument(bail.id, `${bail.libelle} (exemple).txt`, bail.texte, 'OBLIGATION'),
      )
      return ajouterDocument(
        avecBail,
        enDocument(piece.id, `${piece.libelle} (exemple).txt`, piece.texte, 'COUVERTURE'),
      )
    })
  }, [])

  const aucunDocument = dossier.documents.length === 0

  return (
    <>
    <div className={styles.poste}>
      <header className={styles.barre}>
        <div className={styles.barreContenu}>
          <Link href="/" className={styles.marque}>
            Clauzy
          </Link>

          <div className={styles.champReference}>
            <label className={styles.champLabel} htmlFor="reference" style={{ margin: 0 }}>
              Référence
            </label>
            <input
              id="reference"
              className={styles.reference}
              value={dossier.reference}
              placeholder="D-2026-014"
              onChange={(e) => setDossier((courant) => majReference(courant, e.target.value))}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.bouton} onClick={chargerExemple}>
              Charger un dossier d’exemple
            </button>
            <button
              type="button"
              className={styles.boutonPrimaire}
              onClick={analyser}
              disabled={aucunDocument || analyseEnCours}
            >
              {analyseEnCours ? 'Analyse en cours…' : 'Analyser les pièces'}
            </button>
          </div>
        </div>
      </header>

      <main className={styles.corps}>
        <div className={styles.colonne}>
          <Sauvegarde
            dossier={dossier}
            enregistreLe={enregistreLe}
            onEnregistre={() => setEnregistreLe(new Date().toISOString())}
            onCharger={(charge) => {
              setDossier(charge)
              setEnregistreLe(charge.majLe)
              setSelection(null)
              setErreurEdition(null)
            }}
          />

          <ZoneImport
            documents={dossier.documents}
            enCours={lectureEnCours}
            erreurs={erreursImport}
            onImporter={(fichiers, role) => void importer(fichiers, role)}
            onRetirer={(id) => setDossier((courant) => retirerDocument(courant, id))}
          />

          <Synthese
            synthese={synthese}
            enjeux={enjeux}
            filtre={filtre}
            onFiltrer={setFiltre}
          />

          {dossier.analyse === null && (
            <p className={styles.avertissement}>
              Aucune analyse n’a encore tourné. Les 40 contrôles sont affichés « à vérifier
              manuellement » — c’est l’état exact du dossier, pas une absence de résultat.
            </p>
          )}

          <Matrice
            lignes={lignes}
            filtre={filtre}
            selection={selection}
            onSelectionner={(id) => setSelection(id === selection ? null : id)}
          />

          <LecteurDocument
            documents={dossier.documents}
            controleSuggere={selection}
            onRattacher={(controleId: string, rattachement: Rattachement) =>
              tenter(() => rattacher(dossier, controleId, AUTEUR_PAR_DEFAUT, rattachement))
            }
          />
        </div>

        <div className={`${styles.colonne} ${styles.colonneInspecteur}`}>
          {ligneActive === null ? (
            <section className={styles.carte}>
              <h2>Reprendre une ligne</h2>
              <p className={styles.vide}>
                Choisissez un contrôle dans la matrice pour reformuler son analyse, changer sa
                gravité, réécrire la rédaction proposée, ou l’écarter comme faux positif.
              </p>
            </section>
          ) : (
            <EditeurLigne
              key={ligneActive.controle.id}
              ligne={ligneActive}
              erreur={erreurEdition}
              onReecrire={(champs) =>
                tenter(() => reecrire(dossier, ligneActive.controle.id, AUTEUR_PAR_DEFAUT, champs))
              }
              onGravite={(gravite: Gravite) =>
                tenter(() =>
                  forcerGravite(dossier, ligneActive.controle.id, AUTEUR_PAR_DEFAUT, gravite),
                )
              }
              onEcarter={(motif) =>
                tenter(() => ecarter(dossier, ligneActive.controle.id, AUTEUR_PAR_DEFAUT, motif))
              }
              onReprendre={() =>
                tenter(() => reprendre(dossier, ligneActive.controle.id, AUTEUR_PAR_DEFAUT))
              }
              onForcerStatut={(statut: Statut, motif: string) =>
                tenter(() =>
                  forcerStatut(dossier, ligneActive.controle.id, AUTEUR_PAR_DEFAUT, statut, motif),
                )
              }
              onDetacher={(index) =>
                tenter(() =>
                  detacher(dossier, ligneActive.controle.id, AUTEUR_PAR_DEFAUT, index),
                )
              }
            />
          )}

          <Suivi
            dossier={dossier}
            onSuivi={(suivi: Partial<SuiviDossier>) =>
              setDossier((courant) => majSuivi(courant, suivi))
            }
            onBasculer={(jalon: IdJalon) => setDossier((courant) => basculerJalon(courant, jalon))}
          />

          <PanneauPerimetre
            perimetre={dossier.perimetre}
            onChanger={(modifications: Partial<Perimetre>) =>
              setDossier((courant) => majPerimetre(courant, modifications))
            }
          />

          <PanneauObservations
            observations={dossier.observations}
            onAjouter={(observation) =>
              setDossier((courant) => ajouterObservation(courant, observation))
            }
            onRetirer={(id) => setDossier((courant) => retirerObservation(courant, id))}
          />

          <Livrable
            dossier={dossier}
            onCabinet={(cabinet: Partial<Cabinet>) =>
              setDossier((courant) => majCabinet(courant, cabinet))
            }
            onClient={(client: Partial<FicheClient>) =>
              setDossier((courant) => majClient(courant, client))
            }
          />
        </div>
      </main>
    </div>

    {/*
      Frere du poste de travail, jamais son enfant : a l'impression le poste est
      masque, et un rapport range dedans disparaitrait avec lui.
    */}
    <RapportImprimable dossier={dossier} />
    </>
  )
}
