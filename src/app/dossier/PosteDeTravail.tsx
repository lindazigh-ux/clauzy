'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { NOMBRE_CONTROLES, type Gravite, type Statut } from '@/domain/controles'
import { StatutAffiche } from '@/domain/garanties/axes'
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
import atelier from './atelier.module.css'
import { EcranBail } from './ecrans/EcranBail'
import { EcranConfrontation } from './ecrans/EcranConfrontation'
import { EcranSynthese, aTraiter } from './ecrans/EcranSynthese'
import { LIBELLE_SECTION, Rail, type Section } from './ecrans/Rail'
import { EditeurLigne } from './composants/EditeurLigne'
import { LecteurDocument } from './composants/LecteurDocument'
import { Livrable } from './composants/Livrable'
import { Matrice, Synthese, type FiltreEtat } from './composants/Matrice'
import { PanneauObservations, PanneauPerimetre } from './composants/Perimetre'
import { PanneauCoherence } from './composants/Coherence'
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
  const [section, setSection] = useState<Section>('SYNTHESE')
  /**
   * Mode expert (§39).
   *
   * Ce qui décrit l'OUTIL — la matrice des 45 contrôles, les identifiants, les
   * scores de confiance, les lectures écartées — sort de l'expérience
   * principale et vit ici. Rien n'est supprimé : le praticien garde la main sur
   * chaque ligne, mais il n'est plus obligé de la voir pour travailler.
   */
  const [expert, setExpert] = useState(false)

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
   * Jeu d'exemple : six baux, deux polices et une attestation, ecrits de toutes
   * pieces (§5.4). Charge a la demande — le corpus n'a rien a faire dans le
   * bundle initial.
   *
   * Les trois sources sont chargees a dessein. L'attestation mentionne une
   * garantie que les conditions particulieres ne portent pas : le dossier
   * d'exemple montre ainsi les trois niveaux de preuve — etablie, probable
   * (connue par la seule attestation, qui ne prouve pas l'etendue) et ecart
   * confirme.
   */
  const chargerExemple = useCallback(async () => {
    const { BAUX, PIECES, ATTESTATIONS } = await import('@/domain/corpus/baux')
    const bail = BAUX.find((b) => b.id === 'bail-cc')
    const piece = PIECES.find((p) => p.id === 'cp-lacunaire')
    const attestation = ATTESTATIONS.find((a) => a.id === 'att-partielle')
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
      const avecContrat = ajouterDocument(
        avecBail,
        enDocument(piece.id, `${piece.libelle} (exemple).txt`, piece.texte, 'COUVERTURE'),
      )
      // Trois sources, pas deux : l'attestation d'exemple omet volontairement
      // une garantie que le contrat porte. C'est le cas le plus frequent en
      // pratique, et celui que l'outil doit savoir nommer.
      if (attestation === undefined) return avecContrat
      return ajouterDocument(
        avecContrat,
        enDocument(
          attestation.id,
          `${attestation.libelle} (exemple).txt`,
          attestation.texte,
          'ATTESTATION',
        ),
      )
    })
  }, [])

  const aucunDocument = dossier.documents.length === 0

  /**
   * Les compteurs de la barre disent ce qui APPELLE une action.
   *
   * Jamais l'inventaire : « 45 contrôles » n'apparaît pas ici, et « 0 » ne
   * s'affiche pas non plus — un badge à zéro est du bruit (§43).
   */
  const compteurs = useMemo(() => {
    const points = aTraiter(dossier)
    const critiques = points.filter((r) => r.statut === StatutAffiche.CRITIQUE).length
    return {
      SYNTHESE: { valeur: points.length, alerte: critiques > 0 },
      CONFRONTATION: { valeur: points.length, alerte: critiques > 0 },
      CONTRADICTIONS: {
        valeur: dossier.analyse?.incoherences.length ?? 0,
        alerte: false,
      },
      PIECES: { valeur: dossier.documents.length, alerte: false },
    }
  }, [dossier])

  return (
    <>
      <div className={atelier.atelier}>
        <Rail
          active={section}
          compteurs={compteurs}
          client={dossier.client.raisonSociale}
          reference={dossier.reference}
          expert={expert}
          onSection={setSection}
          onExpert={setExpert}
        />

        <main className={atelier.scene}>
          <div className={atelier.enTete}>
            <div>
              <h1 className={atelier.titreEcran}>{LIBELLE_SECTION[section]}</h1>
              {/*
                « 45 contrôles appliqués — 16 écarts, 3 conformes… » décrit
                l'outil, pas le dossier (§43). Elle reste dans le rapport, où
                elle prouve l'étendue du travail, et en mode expert. Pas ici.
              */}
              {expert && dossier.analyse !== null && (
                <p className={atelier.sousTitre}>{synthese.phrase}</p>
              )}
            </div>

            <div className={atelier.actions}>
              <button type="button" className={atelier.bouton} onClick={chargerExemple}>
                Charger un dossier d’exemple
              </button>
              <button
                type="button"
                className={atelier.boutonPrimaire}
                onClick={analyser}
                disabled={aucunDocument || analyseEnCours}
              >
                {analyseEnCours ? 'Analyse en cours…' : 'Analyser les pièces'}
              </button>
            </div>
          </div>

          {erreurEdition !== null && <p className={atelier.alerte}>{erreurEdition}</p>}

          {section === 'SYNTHESE' && (
            <EcranSynthese
              dossier={dossier}
              analyseEnCours={analyseEnCours}
              onAnalyser={() => void analyser()}
              onPieces={() => setSection('PIECES')}
              onTout={() => setSection('CONFRONTATION')}
            />
          )}

          {section === 'BAIL' && (
            <EcranBail dossier={dossier} expert={expert} onPieces={() => setSection('PIECES')} />
          )}

          {section === 'CONFRONTATION' && (
            <EcranConfrontation dossier={dossier} onPieces={() => setSection('PIECES')} />
          )}

          {/*
            Trois écrans attendent encore leur refonte (phase 2 du §17-39). Ils
            portent les composants existants tels quels : le produit reste
            entier, et la refonte n'a pas à tout casser d'un coup.
          */}
          {section === 'CONTRADICTIONS' && (
            <div className={atelier.heritage}>
              <PanneauCoherence incoherences={dossier.analyse?.incoherences ?? []} />
            </div>
          )}

          {section === 'PIECES' && (
            <div className={atelier.heritage}>
              <ZoneImport
                documents={dossier.documents}
                enCours={lectureEnCours}
                erreurs={erreursImport}
                onImporter={(fichiers, role) => void importer(fichiers, role)}
                onRetirer={(id) => setDossier((courant) => retirerDocument(courant, id))}
              />
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
              <LecteurDocument
                documents={dossier.documents}
                controleSuggere={selection}
                onRattacher={(controleId: string, rattachement: Rattachement) =>
                  tenter(() => rattacher(dossier, controleId, AUTEUR_PAR_DEFAUT, rattachement))
                }
              />
            </div>
          )}

          {section === 'RAPPORT' && (
            <div className={atelier.heritage}>
              <Livrable
                dossier={dossier}
                onCabinet={(cabinet: Cabinet | Partial<Cabinet>) =>
                  setDossier((courant) => majCabinet(courant, cabinet))
                }
                onClient={(client: Partial<FicheClient>) =>
                  setDossier((courant) => majClient(courant, client))
                }
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
              <Suivi
                dossier={dossier}
                onSuivi={(suivi: Partial<SuiviDossier>) =>
                  setDossier((courant) => majSuivi(courant, suivi))
                }
                onBasculer={(jalon: IdJalon) =>
                  setDossier((courant) => basculerJalon(courant, jalon))
                }
              />
            </div>
          )}

          {/*
            Le mode expert n'est pas un septième écran : il AJOUTE au bas de
            celui qu'on regarde ce que le moteur a produit, ligne par ligne, et
            de quoi le reprendre à la main. Le praticien reste décisionnaire
            (§39) — mais il ne travaille plus dans la matrice.
          */}
          {expert && (
            <div className={atelier.heritage}>
              <hr />
              {dossier.analyse === null && (
                <p className={styles.avertissement}>
                  Aucune analyse n’a encore tourné. Les {NOMBRE_CONTROLES} contrôles sont affichés
                  « à vérifier manuellement » — c’est l’état exact du dossier, pas une absence de
                  résultat.
                </p>
              )}
              <Synthese synthese={synthese} enjeux={enjeux} filtre={filtre} onFiltrer={setFiltre} />
              <Matrice
                lignes={lignes}
                filtre={filtre}
                selection={selection}
                onSelectionner={(id) => setSelection(id === selection ? null : id)}
              />
              {ligneActive !== null && (
                <EditeurLigne
                  key={ligneActive.controle.id}
                  ligne={ligneActive}
                  erreur={erreurEdition}
                  onReecrire={(champs) =>
                    tenter(() =>
                      reecrire(dossier, ligneActive.controle.id, AUTEUR_PAR_DEFAUT, champs),
                    )
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
                      forcerStatut(
                        dossier,
                        ligneActive.controle.id,
                        AUTEUR_PAR_DEFAUT,
                        statut,
                        motif,
                      ),
                    )
                  }
                  onDetacher={(index) =>
                    tenter(() =>
                      detacher(dossier, ligneActive.controle.id, AUTEUR_PAR_DEFAUT, index),
                    )
                  }
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/*
        Frere du poste de travail, jamais son enfant : a l'impression le poste
        est masque, et un rapport range dedans disparaitrait avec lui.
      */}
    <RapportImprimable dossier={dossier} />
    </>
  )
}
