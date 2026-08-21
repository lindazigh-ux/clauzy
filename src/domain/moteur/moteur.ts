/**
 * Moteur d'analyse (brief §5.2, §5.3).
 *
 * Deux garanties structurelles, dans cet ordre d'importance :
 *
 * 1. AUCUN CONTROLE NE DISPARAIT. Le moteur part de `squeletteResultats()`,
 *    qui fixe la longueur du tableau AVANT toute lecture de document, et se
 *    contente de faire evoluer les statuts. La disparition d'un controle est
 *    impossible par construction, pas par discipline.
 *
 * 2. LE MOTEUR NE DEVINE JAMAIS. Sous le seuil de conclusion, un controle
 *    ressort NON_DETECTE avec le motif de son indecision. Un faux negatif
 *    silencieux est le pire mode de defaillance d'un outil qui touche au devoir
 *    de conseil ; un « a verifier manuellement » explicite n'en est pas un.
 *
 * Le statut depend de la NATURE du controle, parce que toutes les pieces ne
 * demontrent pas la meme chose :
 *
 *   Nature          rien trouve      trouve, sans piece   trouve, piece muette  trouve, piece probante
 *   CROISEMENT      ABSENT_DU_BAIL   NON_DETECTE          ECART                 CONFORME
 *   DOUBLE          ABSENT_DU_BAIL   ECART                ECART                 CONFORME
 *   TRANSFERT_BAIL  ABSENT_DU_BAIL   ECART                ECART                 ECART
 *   FORMALISME      ABSENT_DU_BAIL   ECART                ECART                 ECART
 *
 * CROISEMENT est le seul cas ou l'absence de piece interdit de conclure :
 * l'ecart n'apparait qu'en confrontant l'obligation a la couverture. Sur un
 * TRANSFERT_BAIL ou un FORMALISME, le defaut vient de la redaction — aucune
 * police ne rend souhaitable un transfert desequilibre, et le controle se
 * conclut sur le document source seul.
 */
import {
  Nature,
  Origine,
  REFERENTIEL,
  Statut,
  estVerifiableParPiece,
  squeletteResultats,
  type Controle,
  type Extrait,
  type ResultatControle,
} from '../controles'

import { SEUIL_CONCLUSION, SEUIL_SIGNAL, evaluer, type Correspondance, type Evaluation } from './confiance'
import {
  NiveauPreuve,
  appuiPourControle,
  rapprocher,
  type AppuiGarantie,
  type Rapprochement,
} from './rapprochement'
import { enMois, extraireValeurs, type ValeurExtraite } from './extracteurs'
import { segmenter, type Segment } from './segmentation'

export type RoleDocument = 'OBLIGATION' | 'COUVERTURE' | 'ATTESTATION'

/** Du cote de l'assurance : la piece probante et la piece declarative. */
const COTE_COUVERTURE: readonly RoleDocument[] = ['COUVERTURE', 'ATTESTATION']

/**
 * Un document soumis au moteur. Le nom du fichier n'y figure pas : le moteur
 * n'en a pas besoin, et ce qui n'existe pas ne peut pas fuir (brief §2).
 */
export type DocumentAnalyse = {
  readonly id: string
  readonly role: RoleDocument
  readonly texte: string
}

/** Pourquoi ce statut — lisible par le praticien, factuel, jamais juridique. */
export type Diagnostic = {
  readonly confianceObligation: number
  readonly confianceCouverture: number
  readonly motif: string
  readonly signaux: readonly string[]
}

export type ResultatMoteur = ResultatControle & {
  readonly diagnostic: Diagnostic
}

export type Synthese = {
  readonly total: number
  readonly ecarts: number
  readonly conformes: number
  readonly sansObjet: number
  readonly aVerifier: number
  /** « 45 contrôles appliqués — 6 écarts, 21 conformes, 4 sans objet, 14 à vérifier manuellement. » */
  readonly phrase: string
}

export type Analyse = {
  readonly resultats: readonly ResultatMoteur[]
  readonly synthese: Synthese
  readonly pieceCouvertureFournie: boolean
  /** Le rapprochement risque par risque, independamment des controles. */
  readonly rapprochements: readonly Rapprochement[]
  readonly dureeMs: number
}

const enExtrait = (correspondance: Correspondance): Extrait => ({
  texte: correspondance.texte,
  documentId: correspondance.segment.documentId,
  debut: correspondance.debut,
  fin: correspondance.fin,
})

type Bande = 'CONCLUANT' | 'INDICE' | 'ABSENT'

const bande = (confiance: number): Bande => {
  if (confiance >= SEUIL_CONCLUSION) return 'CONCLUANT'
  if (confiance >= SEUIL_SIGNAL) return 'INDICE'
  return 'ABSENT'
}

type Decision = { readonly statut: Statut; readonly motif: string }

const decider = (
  controle: Controle,
  obligation: Evaluation,
  couverture: Evaluation,
  pieceFournie: boolean,
  chiffrage: Chiffrage | null,
  appui: AppuiGarantie | null,
): Decision => {
  const cote = bande(obligation.confiance)

  if (cote === 'ABSENT') {
    return {
      statut: Statut.ABSENT_DU_BAIL,
      motif: 'Aucune stipulation correspondante n’a été trouvée dans le document source.',
    }
  }

  if (cote === 'INDICE') {
    return {
      statut: Statut.NON_DETECTE,
      motif:
        `Une stipulation approchante a été repérée, sans certitude suffisante ` +
        `(confiance ${obligation.confiance} sur un seuil de ${SEUIL_CONCLUSION}).`,
    }
  }

  if (!estVerifiableParPiece(controle)) {
    const raison =
      controle.nature === Nature.FORMALISME
        ? 'il s’agit d’une obligation de procédure, qu’aucune police ne couvre'
        : 'le défaut vient de la rédaction, qu’aucune police ne corrige'
    return {
      statut: Statut.ECART,
      motif: `Stipulation trouvée dans le document source ; ${raison}.`,
    }
  }

  if (!pieceFournie) {
    if (controle.nature === Nature.DOUBLE) {
      return {
        statut: Statut.ECART,
        motif:
          'Le défaut est visible dans la rédaction elle-même. Une pièce d’assurance ' +
          'permettrait de dire s’il s’aggrave au croisement.',
      }
    }
    return {
      statut: Statut.NON_DETECTE,
      motif:
        'L’écart ne peut apparaître qu’en confrontant l’obligation à la couverture, ' +
        'et aucune pièce d’assurance n’a été fournie.',
    }
  }

  // Le rapprochement par GARANTIE prime sur les motifs du controle.
  //
  // C'est la correction de fond : le bail ecrit « assurer les locaux loués
  // contre l'incendie », la police ecrit « responsabilité locative ». Chercher
  // « incendie » dans la police et conclure a un ecart etait un faux positif
  // affirme a 100 % — le defaut le plus couteux qu'un outil de conseil puisse
  // produire, puisqu'il envoie negocier une garantie deja acquise.
  if (appui !== null) {
    if (appui.niveau === NiveauPreuve.ETABLIE || appui.niveau === NiveauPreuve.PROBABLE) {
      if (chiffrage !== null && chiffrage.insuffisant) {
        return {
          statut: Statut.ECART,
          motif:
            `La garantie attendue est portée par les pièces, mais en deçà de ce que le ` +
            `document source exige (${chiffrage.resume}).`,
        }
      }
      return {
        statut: appui.niveau === NiveauPreuve.ETABLIE ? Statut.CONFORME : Statut.NON_DETECTE,
        motif: appui.conclusion,
      }
    }
    if (appui.niveau === NiveauPreuve.ECART_CONFIRME && bande(couverture.confiance) === 'ABSENT') {
      return { statut: Statut.ECART, motif: appui.conclusion }
    }
  }

  const cotePiece = bande(couverture.confiance)

  if (cotePiece === 'CONCLUANT') {
    if (chiffrage !== null && chiffrage.insuffisant) {
      return {
        statut: Statut.ECART,
        motif:
          `La pièce couvre le sujet, mais en deçà de ce que le document source exige ` +
          `(${chiffrage.resume}).`,
      }
    }
    return {
      statut: Statut.CONFORME,
      motif: 'Une pièce d’assurance identifiée soutient l’obligation.',
    }
  }

  if (cotePiece === 'INDICE') {
    return {
      statut: Statut.NON_DETECTE,
      motif:
        `Les pièces mentionnent le sujet sans permettre de conclure ` +
        `(confiance ${couverture.confiance} sur un seuil de ${SEUIL_CONCLUSION}).`,
    }
  }

  return {
    statut: Statut.ECART,
    motif: 'Obligation trouvée dans le document source, non soutenue par les pièces produites.',
  }
}

/**
 * Fenetre de lecture d'une correspondance : la stipulation qui la porte.
 *
 * Chercher les chiffres dans l'article entier ne marche pas : une page de
 * conditions particulieres aligne dix montants, dont un seul concerne le
 * controle. On se limite donc a la phrase — bornee par un retour a la ligne,
 * un point ou un point-virgule. Les deux-points ne bornent pas : ils separent
 * justement le libelle de la garantie de son montant.
 */
const stipulationAutour = (
  correspondance: Correspondance,
): { readonly texte: string; readonly decalage: number } => {
  const { segment } = correspondance
  const relDebut = correspondance.debut - segment.debut
  const relFin = correspondance.fin - segment.debut

  const avant = Math.max(
    segment.texte.lastIndexOf('\n', relDebut),
    segment.texte.lastIndexOf('.', relDebut),
    segment.texte.lastIndexOf(';', relDebut),
  )
  const debut = avant === -1 ? 0 : avant + 1

  const candidats = ['\n', '.', ';']
    .map((borne) => segment.texte.indexOf(borne, relFin))
    .filter((index) => index !== -1)
  const fin = candidats.length === 0 ? segment.texte.length : Math.min(...candidats)

  return { texte: segment.texte.slice(debut, fin), decalage: segment.debut + debut }
}

/** Valeur comparable isolee autour des correspondances — ou rien, en cas d'ambiguite. */
const valeurComparable = (
  correspondances: readonly Correspondance[],
  nature: ValeurExtraite['nature'],
): ValeurExtraite | null => {
  const fenetres = new Map<number, { texte: string; decalage: number }>()
  for (const correspondance of correspondances) {
    const fenetre = stipulationAutour(correspondance)
    fenetres.set(fenetre.decalage, fenetre)
  }

  const trouvees: ValeurExtraite[] = []
  for (const fenetre of fenetres.values()) {
    for (const valeur of extraireValeurs(fenetre.texte, fenetre.decalage)) {
      if (valeur.nature === nature) trouvees.push(valeur)
    }
  }

  // Dans le doute, on ne chiffre pas : plusieurs valeurs discordantes rendraient
  // l'ecart arbitraire (brief §5.3).
  if (trouvees.length === 0) return null
  const premiere = trouvees[0]
  if (premiere === undefined) return null
  const memeValeur = trouvees.every((v) =>
    v.nature === 'duree' && premiere.nature === 'duree'
      ? v.valeur === premiere.valeur && v.unite === premiere.unite
      : 'valeur' in v && 'valeur' in premiere && v.valeur === premiere.valeur,
  )
  return memeValeur ? premiere : null
}

const decrire = (valeur: ValeurExtraite): string => {
  switch (valeur.nature) {
    case 'duree': {
      const unites: Record<string, string> = { jour: 'jour', semaine: 'semaine', mois: 'mois', annee: 'an' }
      const unite = unites[valeur.unite] ?? valeur.unite
      const pluriel = valeur.valeur > 1 && unite !== 'mois' ? 's' : ''
      return `${valeur.valeur} ${unite}${pluriel}`
    }
    case 'montant_eur':
      return `${valeur.valeur.toLocaleString('fr-FR')} €`
    case 'pourcentage':
      return `${valeur.valeur} %`
    case 'date':
      return valeur.iso
  }
}

export type Chiffrage = {
  /** « 24 mois exigés · 12 mois soutenus » — c'est ce chiffre qui hierarchise le rapport (§7). */
  readonly resume: string
  /**
   * La piece couvre le sujet, mais en deca de ce que le document source exige.
   *
   * C'est le cas que le brief §7 prend en exemple : « RC plafonnee 3 M€ contre
   * 8 M€ exiges ». Sans cette comparaison, le controle ressortirait CONFORME au
   * seul motif que la police mentionne la garantie — un faux positif de
   * conformite, aussi grave qu'un faux negatif.
   */
  readonly insuffisant: boolean
}

/**
 * Compare la valeur exigee par le document source a celle que la piece demontre.
 *
 * L'insuffisance n'est retenue que sur les durees et les montants, ou « plus »
 * est sans ambiguite « mieux » pour le preneur. Un pourcentage est ambigu — une
 * franchise faible est favorable, un taux de garantie eleve aussi — donc l'ecart
 * est signale sans jamais renverser le statut.
 */
const chiffrer = (obligation: Evaluation, couverture: Evaluation): Chiffrage | null => {
  for (const nature of ['duree', 'montant_eur', 'pourcentage'] as const) {
    const exige = valeurComparable(obligation.correspondances, nature)
    const demontre = valeurComparable(couverture.correspondances, nature)
    if (exige === null || demontre === null) continue
    if (decrire(exige) === decrire(demontre)) continue

    const comparable =
      exige.nature === 'duree' && demontre.nature === 'duree'
        ? { gauche: enMois(exige.valeur, exige.unite), droite: enMois(demontre.valeur, demontre.unite) }
        : exige.nature === 'montant_eur' && demontre.nature === 'montant_eur'
          ? { gauche: exige.valeur, droite: demontre.valeur }
          : null

    return {
      resume: `${decrire(exige)} exigés · ${decrire(demontre)} soutenus`,
      insuffisant: comparable !== null && comparable.droite < comparable.gauche,
    }
  }
  return null
}

const formulerSynthese = (resultats: readonly ResultatMoteur[]): Synthese => {
  const compter = (statut: Statut) => resultats.filter((r) => r.statut === statut).length
  const ecarts = compter(Statut.ECART)
  const conformes = compter(Statut.CONFORME)
  const sansObjet = compter(Statut.ABSENT_DU_BAIL)
  const aVerifier = compter(Statut.NON_DETECTE)

  return {
    total: resultats.length,
    ecarts,
    conformes,
    sansObjet,
    aVerifier,
    phrase:
      `${resultats.length} contrôles appliqués — ${ecarts} écart${ecarts > 1 ? 's' : ''}, ` +
      `${conformes} conforme${conformes > 1 ? 's' : ''}, ${sansObjet} sans objet, ` +
      `${aVerifier} à vérifier manuellement.`,
  }
}

/**
 * Analyse un jeu de documents et renvoie systematiquement un resultat par
 * controle du referentiel.
 */
export function analyser(documents: readonly DocumentAnalyse[]): Analyse {
  const depart = performance.now()

  const segmentsObligation: Segment[] = []
  const segmentsCouverture: Segment[] = []

  for (const document of documents) {
    const segments = segmenter(document.id, document.texte)
    if (document.role === 'OBLIGATION') segmentsObligation.push(...segments)
    else segmentsCouverture.push(...segments)
  }

  // Une attestation compte comme piece d'assurance : elle ne prouve pas
  // l'etendue de la couverture, mais elle empeche de dire « aucune piece ».
  const pieceCouvertureFournie = documents.some((d) => COTE_COUVERTURE.includes(d.role))

  // Le rapprochement par garantie se calcule UNE fois pour tout le dossier :
  // il ne depend pas du controle, mais des risques que les documents portent.
  const texte = (role: RoleDocument) =>
    documents.filter((d) => d.role === role).map((d) => d.texte).join('\n')
  const rapprochements = rapprocher({
    obligation: texte('OBLIGATION'),
    contrat: texte('COUVERTURE'),
    attestation: texte('ATTESTATION'),
  })

  // Le squelette fixe la longueur du tableau avant toute lecture : c'est la
  // garantie mecanique qu'aucun controle ne peut disparaitre (brief §5.2).
  const resultats: ResultatMoteur[] = squeletteResultats().map((vierge) => {
    const controle = REFERENTIEL.find((c) => c.id === vierge.controleId)
    if (controle === undefined) {
      throw new Error(`Contrôle inconnu dans le squelette : ${vierge.controleId}`)
    }

    const obligation = evaluer(controle.detecteursObligation, segmentsObligation, controle.famille)
    const couverture = pieceCouvertureFournie
      ? evaluer(controle.detecteursCouverture, segmentsCouverture, controle.famille)
      : { confiance: 0, correspondances: [], base: 0, signaux: [] }

    const chiffrage = chiffrer(obligation, couverture)
    const appui = appuiPourControle(controle.id, rapprochements)
    const { statut, motif } = decider(
      controle,
      obligation,
      couverture,
      pieceCouvertureFournie,
      chiffrage,
      appui,
    )

    const confiance =
      statut === Statut.CONFORME
        ? Math.min(obligation.confiance, couverture.confiance)
        : obligation.confiance

    return {
      controleId: controle.id,
      statut,
      origine: Origine.MOTEUR,
      confiance,
      extraitsObligation: obligation.correspondances.map(enExtrait),
      extraitsCouverture: couverture.correspondances.map(enExtrait),
      resumeEcart: statut === Statut.ECART ? (chiffrage?.resume ?? undefined) : undefined,
      diagnostic: {
        confianceObligation: obligation.confiance,
        confianceCouverture: couverture.confiance,
        motif,
        // Les deux cotes sont nommes : sans cela, « la clause a ete trouvee
        // dans un article dont l'intitule correspond » et « le document ne
        // porte pas d'intitules » se suivent et paraissent se contredire.
        signaux: [
          ...obligation.signaux.map((s) => `Côté bail — ${s.libelle} : ${s.explication}`),
          ...couverture.signaux.map((s) => `Côté pièces — ${s.libelle} : ${s.explication}`),
          // La trace du raisonnement par garantie : ce qui a ete cherche, et
          // ce qui a ete conclu. Le praticien doit pouvoir le controler.
          ...(appui === null ? [] : [`Garantie — ${appui.conclusion}`]),
        ],
      },
    }
  })

  return {
    resultats,
    synthese: formulerSynthese(resultats),
    pieceCouvertureFournie,
    rapprochements,
    dureeMs: Math.round(performance.now() - depart),
  }
}
