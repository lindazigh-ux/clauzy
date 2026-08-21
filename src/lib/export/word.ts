/**
 * Export Word annote (brief §7, §14).
 *
 * Fonction signature du produit : les commentaires sont ancres nativement au
 * passage original du bail. Le client ouvre le fichier dans Word, voit la
 * clause encadree et le conseil en marge — comme si un confrere l'avait relu.
 *
 * `docx` est charge en import DYNAMIQUE : il n'a rien a faire dans le bundle
 * initial (§13), et le budget de performance echouerait s'il s'y trouvait.
 *
 * La page de garde est aux couleurs du CABINET, pas a celles de Clauzy : le
 * client achete une analyse, pas un abonnement (§7). La marque Clauzy tient en
 * pied de page.
 */
import { LIBELLE_STATUT, NOMBRE_CONTROLES } from '@/domain/controles'
import {
  MENTION_LIMITE,
  calendrier,
  enFrancais,
  formulerProchaineAction,
  preconisations,
  resultatsAffiches,
  synthetiser,
  type Dossier,
  type LigneRapport,
} from '@/domain/dossier'

import { planifierAnnotations, type Element, type PlanAnnotation } from './annotations'

const GRIS = '696A74'
const ENCRE = '15151A'

const dateLongue = (iso: string): string =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

type Docx = typeof import('docx')

const titre = (d: Docx, texte: string, niveau: 1 | 2) =>
  new d.Paragraph({
    heading: niveau === 1 ? d.HeadingLevel.HEADING_1 : d.HeadingLevel.HEADING_2,
    spacing: { before: niveau === 1 ? 480 : 320, after: 160 },
    children: [new d.TextRun({ text: texte, color: ENCRE })],
  })

const texteSimple = (d: Docx, texte: string, options: { gris?: boolean; petit?: boolean } = {}) =>
  new d.Paragraph({
    spacing: { after: 120 },
    children: [
      new d.TextRun({
        text: texte,
        color: options.gris === true ? GRIS : ENCRE,
        size: options.petit === true ? 18 : 22,
      }),
    ],
  })

const puce = (d: Docx, texte: string) =>
  new d.Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [new d.TextRun({ text: texte, size: 22 })] })

// ---------------------------------------------------------------------------
// 1. Page de garde (§7)
// ---------------------------------------------------------------------------

const pageDeGarde = (d: Docx, dossier: Dossier): InstanceType<Docx['Paragraph']>[] => {
  const cabinet = dossier.cabinet
  const lignes: InstanceType<Docx['Paragraph']>[] = []

  lignes.push(
    new d.Paragraph({
      spacing: { before: 1200, after: 240 },
      children: [
        new d.TextRun({
          text: cabinet.nom.trim().length > 0 ? cabinet.nom : 'Note de conseil',
          bold: true,
          size: 44,
          color: cabinet.couleur,
        }),
      ],
    }),
    new d.Paragraph({
      spacing: { after: 720 },
      border: { bottom: { style: d.BorderStyle.SINGLE, size: 12, color: cabinet.couleur, space: 8 } },
      children: [
        new d.TextRun({
          text: 'Analyse des obligations d’assurance du bail',
          size: 28,
          color: ENCRE,
        }),
      ],
    }),
  )

  const champ = (libelle: string, valeur: string) =>
    new d.Paragraph({
      spacing: { after: 120 },
      children: [
        new d.TextRun({ text: `${libelle} `, size: 20, color: GRIS }),
        new d.TextRun({ text: valeur, size: 22, bold: true }),
      ],
    })

  if (dossier.client.raisonSociale.trim().length > 0) {
    lignes.push(champ('Client', dossier.client.raisonSociale))
  }
  if (dossier.client.adresse.trim().length > 0) lignes.push(champ('Adresse', dossier.client.adresse))
  if (dossier.client.activite.trim().length > 0) lignes.push(champ('Activité', dossier.client.activite))
  if (dossier.reference.trim().length > 0) lignes.push(champ('Référence', dossier.reference))
  if (cabinet.praticien.trim().length > 0) {
    lignes.push(champ('Établie par', `${cabinet.praticien}${cabinet.qualite.trim().length > 0 ? `, ${cabinet.qualite}` : ''}`))
  }
  lignes.push(champ('Date', dateLongue(dossier.majLe)))

  return lignes
}

// ---------------------------------------------------------------------------
// 2. Perimetre et limites (§7) — la page qui protege
// ---------------------------------------------------------------------------

const perimetreEtLimites = (d: Docx, dossier: Dossier, lignes: readonly LigneRapport[]) => {
  const blocs: InstanceType<Docx['Paragraph']>[] = [titre(d, 'Périmètre et limites', 1)]
  const perimetre = dossier.perimetre

  const liste = (intitule: string, valeurs: readonly string[], vide: string) => {
    blocs.push(titre(d, intitule, 2))
    if (valeurs.length === 0) blocs.push(texteSimple(d, vide, { gris: true }))
    else for (const valeur of valeurs) blocs.push(puce(d, valeur))
  }

  liste(
    'Pièces reçues',
    perimetre.piecesRecues.length > 0
      ? perimetre.piecesRecues
      : dossier.documents.map((document) => document.nom),
    'Aucune pièce recensée.',
  )
  liste('Pièces manquantes', perimetre.piecesManquantes, 'Aucune pièce déclarée manquante.')

  const sansObjet = lignes.filter((ligne) => ligne.sansObjet)
  liste(
    'Contrôles sans objet pour ce dossier',
    sansObjet.map((ligne) => `${ligne.controle.id} — ${ligne.controle.titre}`),
    'Aucun contrôle déclaré sans objet : les 40 ont été appliqués.',
  )

  const ecartes = lignes.filter((ligne) => ligne.ecarte)
  liste(
    'Contrôles écartés par le praticien',
    ecartes.map((ligne) => `${ligne.controle.id} — ${ligne.controle.titre} · ${ligne.motif}`),
    'Aucun contrôle écarté.',
  )

  liste('Hypothèses retenues', perimetre.hypotheses, 'Aucune hypothèse particulière.')

  blocs.push(titre(d, 'Portée du document', 2))
  blocs.push(texteSimple(d, MENTION_LIMITE, { gris: true }))

  return blocs
}

// ---------------------------------------------------------------------------
// 3. Synthese, autonome (§7)
// ---------------------------------------------------------------------------

const synthese = (d: Docx, dossier: Dossier) => {
  const resume = synthetiser(dossier)
  const blocs = [
    titre(d, 'Synthèse', 1),
    new d.Paragraph({
      spacing: { after: 240 },
      children: [new d.TextRun({ text: resume.phrase, size: 26, italics: true, color: ENCRE })],
    }),
  ]

  if (resume.mentionAjustement !== null) {
    blocs.push(texteSimple(d, resume.mentionAjustement, { gris: true }))
  }

  const chiffres = preconisations(dossier).filter((ligne) => ligne.resumeEcart !== null)
  if (chiffres.length > 0) {
    blocs.push(titre(d, 'Enjeux chiffrés', 2))
    for (const ligne of chiffres) {
      blocs.push(puce(d, `${ligne.controle.titre} — ${ligne.resumeEcart ?? ''}`))
    }
  }

  if (dossier.observations.length > 0) {
    blocs.push(titre(d, `Observations hors des ${NOMBRE_CONTROLES} contrôles`, 2))
    for (const observation of dossier.observations) {
      blocs.push(puce(d, `${observation.titre} — ${observation.texte}`))
    }
  }

  return blocs
}

// ---------------------------------------------------------------------------
// 4. Preconisations, hierarchisees par enjeu chiffre (§7)
// ---------------------------------------------------------------------------

const listePreconisations = (d: Docx, dossier: Dossier) => {
  const blocs = [titre(d, 'Préconisations', 1)]
  const liste = preconisations(dossier)

  if (liste.length === 0) {
    blocs.push(texteSimple(d, 'Aucun écart retenu à ce stade.', { gris: true }))
    return blocs
  }

  blocs.push(
    texteSimple(
      d,
      'Classées par enjeu chiffré, puis par gravité. La correction du bail est toujours ' +
        'prioritaire ; l’adaptation du programme d’assurance n’intervient qu’en second, si la ' +
        'négociation échoue.',
      { gris: true },
    ),
  )

  liste.forEach((ligne, index) => {
    blocs.push(
      new d.Paragraph({
        spacing: { before: 280, after: 80 },
        children: [
          new d.TextRun({ text: `${index + 1}. ${ligne.controle.titre} `, bold: true, size: 24 }),
          new d.TextRun({ text: `(${ligne.controle.id})`, size: 20, color: GRIS }),
        ],
      }),
    )
    if (ligne.resumeEcart !== null) {
      blocs.push(
        new d.Paragraph({
          spacing: { after: 80 },
          children: [
            new d.TextRun({ text: ligne.resumeEcart, bold: true, size: 22, color: 'C73F4B' }),
          ],
        }),
      )
    }
    if (ligne.analyse !== null && ligne.analyse.trim().length > 0) {
      blocs.push(texteSimple(d, ligne.analyse.trim()))
    }
    blocs.push(texteSimple(d, `Ce que risque le preneur : ${ligne.controle.consequence}`))
    blocs.push(texteSimple(d, `Correction du bail : ${ligne.controle.actionSource}`))
    blocs.push(
      texteSimple(
        d,
        `Rédaction proposée : ${ligne.redaction}`,
      ),
    )
    blocs.push(texteSimple(d, `Preuve de clôture : ${ligne.controle.preuveCloture}`, { gris: true }))
  })

  return blocs
}

// ---------------------------------------------------------------------------
// 5. Matrice complete des 40 controles, tous etats confondus (§7)
// ---------------------------------------------------------------------------

const matrice = (d: Docx, lignes: readonly LigneRapport[]) => {
  const cellule = (texte: string, options: { entete?: boolean; largeur: number }) =>
    new d.TableCell({
      width: { size: options.largeur, type: d.WidthType.PERCENTAGE },
      shading: options.entete === true ? { fill: 'F1F0F7' } : undefined,
      children: [
        new d.Paragraph({
          spacing: { before: 40, after: 40 },
          children: [new d.TextRun({ text: texte, size: 18, bold: options.entete === true })],
        }),
      ],
    })

  const enTete = new d.TableRow({
    tableHeader: true,
    children: [
      cellule('Réf.', { entete: true, largeur: 10 }),
      cellule('Contrôle', { entete: true, largeur: 45 }),
      cellule('État', { entete: true, largeur: 25 }),
      cellule('Enjeu chiffré', { entete: true, largeur: 20 }),
    ],
  })

  const corps = lignes.map(
    (ligne) =>
      new d.TableRow({
        children: [
          cellule(ligne.controle.id, { largeur: 10 }),
          cellule(ligne.controle.titre, { largeur: 45 }),
          cellule(
            ligne.ecarte ? 'Écarté par le praticien' : LIBELLE_STATUT[ligne.statut],
            { largeur: 25 },
          ),
          cellule(ligne.resumeEcart ?? '—', { largeur: 20 }),
        ],
      }),
  )

  return [
    titre(d, 'Matrice des contrôles', 1),
    texteSimple(
      d,
      `Les ${lignes.length} contrôles figurent ci-dessous, quel que soit leur état. Un contrôle ` +
        'que le moteur n’a pas su trancher est signalé « à vérifier manuellement » : c’est une ' +
        'ligne à examiner, pas un contrôle absent.',
      { gris: true },
    ),
    new d.Table({
      width: { size: 100, type: d.WidthType.PERCENTAGE },
      rows: [enTete, ...corps],
    }),
  ]
}

// ---------------------------------------------------------------------------
// 6. Suivi d'attestation (§7)
// ---------------------------------------------------------------------------

const suiviAttestation = (d: Docx, dossier: Dossier) => {
  const courriels = dossier.documents.filter((document) => document.courriel !== null)
  const jalons = calendrier(dossier.suivi)
  const blocs = [titre(d, 'Suivi d’attestation', 1)]

  // La prochaine action datee, en tete : c'est ce que le §7 demande de porter.
  blocs.push(
    new d.Paragraph({
      spacing: { after: 200 },
      children: [
        new d.TextRun({ text: formulerProchaineAction(dossier.suivi), bold: true, size: 22 }),
      ],
    }),
  )

  if (dossier.suivi.destinataire.trim().length > 0) {
    blocs.push(texteSimple(d, `Demande adressée à ${dossier.suivi.destinataire}.`, { gris: true }))
  }

  if (jalons.length > 0) {
    blocs.push(titre(d, 'Calendrier de relance', 2))
    for (const entree of jalons) {
      const etat =
        entree.etat === 'FAIT' ? ' — fait' : entree.etat === 'EN_RETARD' ? ' — en retard' : ''
      blocs.push(puce(d, `${enFrancais(entree.echeance)} · ${entree.jalon.libelle}${etat}`))
    }
  }

  if (courriels.length === 0) {
    blocs.push(
      texteSimple(
        d,
        'Aucun courriel d’attestation n’a été versé au dossier.',
        { gris: true },
      ),
    )
    return blocs
  }

  blocs.push(titre(d, 'Courriels versés au dossier', 2))
  for (const document of courriels) {
    const courriel = document.courriel
    if (courriel === null) continue
    blocs.push(
      puce(
        d,
        `${courriel.objet ?? 'Objet non renseigné'} — ${
          courriel.envoyeLe === null
            ? 'date d’envoi illisible, à saisir à la main'
            : `envoyé le ${dateLongue(courriel.envoyeLe)}`
        }`,
      ),
    )
  }

  return blocs
}

// ---------------------------------------------------------------------------
// 7. Le document source annote — la fonction signature
// ---------------------------------------------------------------------------

const enfantsDuParagraphe = (d: Docx, elements: readonly Element[]) =>
  elements.flatMap((element) => {
    if (element.type === 'texte') return [new d.TextRun({ text: element.texte, size: 20 })]
    if (element.type === 'debut') return [new d.CommentRangeStart(element.id)]
    if (element.type === 'fin') return [new d.CommentRangeEnd(element.id)]
    return [new d.TextRun({ children: [new d.CommentReference(element.id)] })]
  })

const documentAnnote = (d: Docx, nom: string, plan: PlanAnnotation) => [
  titre(d, `Document annoté — ${nom}`, 1),
  texteSimple(
    d,
    `${plan.annotations.length} commentaires sont ancrés aux passages concernés. Ouvrez le volet ` +
      'de révision de Word pour les lire en regard du texte.',
    { gris: true },
  ),
  ...plan.paragraphes.map(
    (paragraphe) =>
      new d.Paragraph({
        spacing: { after: 60 },
        children: enfantsDuParagraphe(d, paragraphe.elements),
      }),
  ),
]

// ---------------------------------------------------------------------------
// Assemblage
// ---------------------------------------------------------------------------

export type RapportWord = {
  readonly donnees: Blob
  readonly nomFichier: string
  readonly nombreCommentaires: number
}

export async function exporterWord(dossier: Dossier): Promise<RapportWord> {
  const d = await import('docx')
  const lignes = resultatsAffiches(dossier)
  const auteur =
    dossier.cabinet.praticien.trim().length > 0 ? dossier.cabinet.praticien : 'Praticien'

  const sources = dossier.documents.filter(
    (document) => document.role === 'OBLIGATION' && document.texte.trim().length > 0,
  )

  const plans = sources.map((document) =>
    planifierAnnotations(dossier, lignes, document.id, document.texte, auteur),
  )

  // Les identifiants de commentaire sont globaux au document Word : on decale
  // ceux de chaque piece pour qu'ils ne se telescopent pas.
  let decalage = 0
  const plansDecales = plans.map((plan) => {
    const decale: PlanAnnotation = {
      documentId: plan.documentId,
      annotations: plan.annotations.map((a) => ({ ...a, id: a.id + decalage })),
      paragraphes: plan.paragraphes.map((paragraphe) => ({
        elements: paragraphe.elements.map((element) =>
          element.type === 'texte' ? element : { ...element, id: element.id + decalage },
        ),
      })),
    }
    decalage += plan.annotations.length
    return decale
  })

  const commentaires = plansDecales.flatMap((plan) =>
    plan.annotations.map((annotation) => ({
      id: annotation.id,
      author: annotation.auteur,
      date: new Date(dossier.majLe),
      children: annotation.corps.map(
        (paragraphe) =>
          new d.Paragraph({ children: [new d.TextRun({ text: paragraphe, size: 18 })] }),
      ),
    })),
  )

  const corps = [
    ...pageDeGarde(d, dossier),
    ...perimetreEtLimites(d, dossier, lignes),
    ...synthese(d, dossier),
    ...listePreconisations(d, dossier),
    ...matrice(d, lignes),
    ...suiviAttestation(d, dossier),
    ...plansDecales.flatMap((plan, index) =>
      documentAnnote(d, sources[index]?.nom ?? 'document', plan),
    ),
  ]

  const document = new d.Document({
    creator: auteur,
    title: `Analyse des obligations d’assurance — ${dossier.reference}`,
    comments: { children: commentaires },
    sections: [
      {
        properties: {},
        footers: {
          default: new d.Footer({
            children: [
              new d.Paragraph({
                alignment: d.AlignmentType.CENTER,
                children: [
                  new d.TextRun({
                    // Marque discrete, en pied de page : le client achete une
                    // analyse, pas un abonnement (§7).
                    text: 'Analyse préparée avec Clauzy — outil d’aide au conseil',
                    size: 14,
                    color: GRIS,
                  }),
                ],
              }),
            ],
          }),
        },
        children: corps,
      },
    ],
  })

  const donnees = await d.Packer.toBlob(document)
  const reference = dossier.reference.trim().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '')

  return {
    donnees,
    nomFichier: `${reference.length === 0 ? 'note-de-conseil' : reference}-note-de-conseil.docx`,
    nombreCommentaires: commentaires.length,
  }
}
