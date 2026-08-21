import { describe, expect, it } from 'vitest'

import { LIBELLE_STATUT, NOMBRE_CONTROLES, Statut } from '../controles'
import { garantiesRattachees, verifierRattachements } from '../garanties/rattachement'
import { GARANTIE_PAR_ID } from '../garanties/nomenclature'
import { analyser } from './moteur'
import { NiveauPreuve, appuiPourControle, rapprocher } from './rapprochement'

/**
 * Le defaut fondateur, teste AU NIVEAU DU MOTEUR.
 *
 * La batterie metier verifie que la nomenclature reconnait les bons risques.
 * Ici on verifie que le moteur en tire les bonnes conclusions — c'est une
 * autre affaire, et c'est celle qui se voit dans un rapport client.
 */

const BAIL_ORDINAIRE = `Article 14 — Assurances
Le Preneur devra assurer les locaux loués contre l’incendie, l’explosion et les dégâts des eaux,
ainsi que les recours des voisins et des tiers.`

const POLICE_QUI_REPOND = `Conditions particulières
Garantie responsabilité locative (risques locatifs) : 1 500 000 € par sinistre.
Recours des voisins et des tiers : 1 500 000 € par sinistre.
Responsabilité civile exploitation : 8 000 000 € par sinistre.`

/** Les documents, tels que le moteur les reçoit désormais. */
const sources = (o: { obligation: string; contrat?: string; attestation?: string }) => [
  { id: 'bail', role: 'OBLIGATION' as const, texte: o.obligation },
  ...(o.contrat === undefined || o.contrat === ''
    ? []
    : [{ id: 'cp', role: 'COUVERTURE' as const, texte: o.contrat }]),
  ...(o.attestation === undefined || o.attestation === ''
    ? []
    : [{ id: 'att', role: 'ATTESTATION' as const, texte: o.attestation }]),
]

const analyse = (bail: string, police: string | null) =>
  analyser([
    { id: 'bail', role: 'OBLIGATION' as const, texte: bail },
    ...(police === null ? [] : [{ id: 'police', role: 'COUVERTURE' as const, texte: police }]),
  ])

describe('le faux positif des risques locatifs', () => {
  it('ne conclut plus à un écart quand la police répond en vocabulaire d’assureur', () => {
    // Regression exacte : l'ancien moteur cherchait « incendie » dans la
    // police, ne l'y trouvait pas, et affirmait un ECART a 100 % de confiance.
    const resultat = analyse(BAIL_ORDINAIRE, POLICE_QUI_REPOND).resultats.find(
      (r) => r.controleId === 'DAB-03',
    )
    expect(resultat?.statut, LIBELLE_STATUT[resultat?.statut ?? Statut.NON_DETECTE]).toBe(
      Statut.CONFORME,
    )
  })

  it('conclut toujours à un écart quand la garantie manque réellement', () => {
    const sansRisquesLocatifs = `Conditions particulières
Responsabilité civile exploitation : 8 000 000 € par sinistre.
Pertes d’exploitation : douze mois.`
    const resultat = analyse(BAIL_ORDINAIRE, sansRisquesLocatifs).resultats.find(
      (r) => r.controleId === 'DAB-03',
    )
    expect(resultat?.statut).toBe(Statut.ECART)
    expect(resultat?.diagnostic.motif).toMatch(/Recherche effectuée sur/)
  })

  it('accepte une RC occupant, en le disant plutôt qu’en l’affirmant', () => {
    const rcOccupant = 'Responsabilité civile occupant : 3 000 000 € par sinistre.'
    const rapprochements = rapprocher(sources({ obligation: BAIL_ORDINAIRE, contrat: rcOccupant, attestation: '' }))
    const locatifs = rapprochements.find((r) => r.garantieId === 'RISQUES_LOCATIFS')

    // Une garantie englobante repond, mais ce n'est pas la ligne exacte : le
    // moteur le signale au lieu d'affirmer une equivalence.
    expect(locatifs?.niveau).toBe(NiveauPreuve.PROBABLE)
    expect(locatifs?.satisfaitePar).toBe('RC_OCCUPANT')
    expect(locatifs?.conclusion).toMatch(/À confirmer aux conditions particulières/)
  })
})

describe('« absent » n’est pas « non démontré »', () => {
  it('sans pièce d’assurance, ne conclut pas à une absence de couverture', () => {
    const rapprochements = rapprocher(sources({ obligation: BAIL_ORDINAIRE, contrat: '', attestation: '' }))
    for (const rapprochement of rapprochements) {
      expect(rapprochement.niveau, rapprochement.garantieId).toBe(NiveauPreuve.NON_DEMONTREE)
      expect(rapprochement.conclusion).toMatch(/Aucune pièce d’assurance n’a été fournie/)
    }
  })

  it('avec les pièces et une garantie manquante, confirme l’écart', () => {
    const rapprochements = rapprocher(sources({ obligation: BAIL_ORDINAIRE, contrat: 'Responsabilité civile exploitation : 8 000 000 €.', attestation: '' }))
    const locatifs = rapprochements.find((r) => r.garantieId === 'RISQUES_LOCATIFS')
    expect(locatifs?.niveau).toBe(NiveauPreuve.ECART_CONFIRME)
  })
})

describe('la trace du raisonnement', () => {
  it('dit ce qui a été cherché dans les pièces', () => {
    const locatifs = rapprocher(sources({ obligation: BAIL_ORDINAIRE, contrat: POLICE_QUI_REPOND, attestation: '' })).find(
      (r) => r.garantieId === 'RISQUES_LOCATIFS',
    )
    // Le praticien doit pouvoir controler le raisonnement, pas le croire.
    expect(locatifs?.recherche).toContain('Risques locatifs')
    expect(locatifs?.recherche).toContain('Responsabilité civile occupant')
  })

  it('cite la stipulation exacte, des deux côtés', () => {
    const locatifs = rapprocher(sources({ obligation: BAIL_ORDINAIRE, contrat: POLICE_QUI_REPOND, attestation: '' })).find(
      (r) => r.garantieId === 'RISQUES_LOCATIFS',
    )
    expect(locatifs?.exigence?.stipulation.texte).toMatch(/locaux loués/)
    expect(locatifs?.couverture?.stipulation.texte).toMatch(/responsabilité locative/i)
  })

  it('remonte jusqu’au diagnostic du contrôle', () => {
    const resultat = analyse(BAIL_ORDINAIRE, POLICE_QUI_REPOND).resultats.find(
      (r) => r.controleId === 'DAB-03',
    )
    expect(resultat?.diagnostic.signaux.some((s) => s.startsWith('Garantie —'))).toBe(true)
  })

  it('nomme le bénéficiaire réel, qui n’est pas celui qui souscrit', () => {
    const rapprochements = rapprocher(sources({ obligation: BAIL_ORDINAIRE, contrat: POLICE_QUI_REPOND, attestation: '' }))
    // Le preneur souscrit, le bailleur est protege : c'est ce decalage qui
    // fait l'interet de l'analyse.
    expect(rapprochements.find((r) => r.garantieId === 'RISQUES_LOCATIFS')?.beneficiaire).toBe(
      'BAILLEUR',
    )
  })
})

describe('le vrai transfert reste détecté', () => {
  it('signale une obligation d’assurer l’immeuble du bailleur', () => {
    const bail = `Article 14 — Le Preneur assurera l’immeuble appartenant au Bailleur,
en ce compris la structure, le clos et le couvert, pour sa valeur de reconstruction.`
    const rapprochements = rapprocher(sources({ obligation: bail, contrat: POLICE_QUI_REPOND, attestation: '' }))
    const ids = rapprochements.map((r) => r.garantieId)
    expect(ids).toContain('ASSURANCE_IMMEUBLE_BAILLEUR')
    // Et ne le confond pas avec une simple responsabilité locative.
    expect(ids).not.toContain('RISQUES_LOCATIFS')
  })
})

describe('le rattachement des contrôles aux garanties', () => {
  it('ne renvoie jamais vers une garantie inconnue', () => {
    expect(() => verifierRattachements()).not.toThrow()
    for (const id of garantiesRattachees()) {
      expect(GARANTIE_PAR_ID.has(id), id).toBe(true)
    }
  })

  it('laisse sans garantie les contrôles qu’aucune pièce ne démontre', () => {
    // Un delai d'attestation, une identite, une hierarchie contractuelle : ces
    // points se tranchent sur le document source seul.
    const rapprochements = rapprocher(sources({ obligation: BAIL_ORDINAIRE, contrat: POLICE_QUI_REPOND, attestation: '' }))
    const sansObjet = ['FOR-01', 'DOC-01', 'ART-01']
    for (const controleId of sansObjet) {
      expect(appuiPourControle(controleId, rapprochements), controleId).toBeNull()
    }
  })
})

describe('l’analyse expose le rapprochement', () => {
  it('le rend au dossier, risque par risque', () => {
    const resultat = analyse(BAIL_ORDINAIRE, POLICE_QUI_REPOND)
    expect(resultat.rapprochements.length).toBeGreaterThan(0)
    expect(resultat.rapprochements.every((r) => r.conclusion.length > 20)).toBe(true)
  })

  it('rend toujours un résultat par contrôle, quoi qu’il arrive au rapprochement', () => {
    // La regle du §5.2 ne cede devant aucune amelioration du moteur.
    expect(analyse(BAIL_ORDINAIRE, POLICE_QUI_REPOND).resultats).toHaveLength(NOMBRE_CONTROLES)
    expect(analyse('', null).resultats).toHaveLength(NOMBRE_CONTROLES)
  })
})

describe('l’attestation, troisième source', () => {
  const CONTRAT = `Conditions particulières
Garantie responsabilité locative (risques locatifs) : 1 500 000 € par sinistre.
Recours des voisins et des tiers : 1 500 000 € par sinistre.`

  const trouver = (o: { obligation: string; contrat?: string; attestation?: string }, id: string) =>
    rapprocher(sources(o)).find((r) => r.garantieId === id)

  it('signale une garantie au contrat, absente de l’attestation', () => {
    // Le cas le plus frequent, et le plus mal traite : la couverture existe,
    // mais le bailleur ne peut pas s'en assurer sur la piece qu'on lui remet.
    const attestation =
      'Attestation d’assurance — Responsabilité civile exploitation : 8 000 000 €.'
    const resultat = trouver(
      { obligation: BAIL_ORDINAIRE, contrat: CONTRAT, attestation },
      'RISQUES_LOCATIFS',
    )
    expect(resultat?.niveau).toBe(NiveauPreuve.JUSTIFICATION_INSUFFISANTE)
    expect(resultat?.conclusion).toMatch(/pas sur l’attestation produite/)
    // Ce n'est pas un écart : la correction est un courrier, pas un avenant.
    expect(resultat?.conclusion).toMatch(/Demander une attestation/)
  })

  it('conclut à la conformité quand l’attestation confirme le contrat', () => {
    const attestation =
      'Attestation — garanties : risques locatifs, recours des voisins et des tiers.'
    const resultat = trouver(
      { obligation: BAIL_ORDINAIRE, contrat: CONTRAT, attestation },
      'RISQUES_LOCATIFS',
    )
    expect(resultat?.niveau).toBe(NiveauPreuve.ETABLIE)
  })

  it('ne conclut pas à la conformité sur une attestation seule', () => {
    // Une attestation prouve qu'un contrat existe, pas ce qu'il couvre : c'est
    // la these que le produit defend partout, et le moteur doit la tenir.
    const resultat = trouver(
      {
        obligation: BAIL_ORDINAIRE,
        contrat: '',
        attestation: 'Attestation — garanties : risques locatifs, recours des voisins et des tiers.',
      },
      'RISQUES_LOCATIFS',
    )
    expect(resultat?.niveau).toBe(NiveauPreuve.PROBABLE)
    expect(resultat?.conclusion).toMatch(/prouve l’existence d’un contrat mais pas l’étendue/)
  })

  it('ne crie pas à l’écart quand seule une attestation muette est fournie', () => {
    // Sans contrat, on ne peut pas conclure a une absence de garantie : c'est
    // « non démontré », et la difference n'est pas cosmetique.
    const resultat = trouver(
      {
        obligation: BAIL_ORDINAIRE,
        contrat: '',
        attestation: 'Attestation d’assurance — contrat n° 4471 en cours de validité.',
      },
      'RISQUES_LOCATIFS',
    )
    expect(resultat?.niveau).toBe(NiveauPreuve.NON_DEMONTREE)
  })

  it('range l’attestation à sa place dans le rapprochement', () => {
    const resultat = trouver(
      {
        obligation: BAIL_ORDINAIRE,
        contrat: CONTRAT,
        attestation: 'Attestation — garanties : risques locatifs.',
      },
      'RISQUES_LOCATIFS',
    )
    expect(resultat?.couverture?.stipulation.texte).toMatch(/responsabilité locative/i)
    expect(resultat?.attestation?.stipulation.texte).toMatch(/Attestation/)
  })
})
