import { describe, expect, it } from 'vitest'

import { CAS_METIER } from '../cas-metier'
import { NOMENCLATURE, GARANTIE_PAR_ID, garantie } from '../nomenclature'
import { reconnaitre, satisfaite, stipulations } from '../reconnaissance'
import { Beneficiaire, Categorie } from '../types'

/**
 * LA BATTERIE METIER.
 *
 * Elle occupe la meme place que le test anti-fuite du lot L0 : elle interdit
 * de declarer le moteur valide. Un cas qui echoue n'est pas un test fragile,
 * c'est un defaut d'analyse — et le defaut fondateur, celui des risques
 * locatifs, est le premier de la liste.
 */

const reconnues = (texte: string, cote: 'OBLIGATION' | 'COUVERTURE'): string[] => [
  ...new Set(reconnaitre(texte, cote).map((r) => r.garantieId)),
]

describe('la batterie de cas métier', () => {
  it.each(CAS_METIER.map((cas) => [`${cas.id} — ${cas.intitule}`, cas]))(
    '%s',
    (_intitule, cas) => {
      const trouvees = reconnues(cas.texte, cas.cote)

      for (const attendue of cas.attendues) {
        expect(
          trouvees,
          `${cas.id} : « ${garantie(attendue).libelle} » n’a pas été reconnue.\n${cas.pourquoi}`,
        ).toContain(attendue)
      }

      for (const interdite of cas.interdites) {
        expect(
          trouvees,
          `${cas.id} : « ${garantie(interdite).libelle} » a été reconnue à tort.\n${cas.pourquoi}`,
        ).not.toContain(interdite)
      }
    },
  )
})

describe('le cas fondateur, en détail', () => {
  const CLAUSE =
    'Le Preneur devra assurer les locaux loués contre l’incendie, l’explosion et les dégâts des eaux.'

  it('lit une responsabilité locative, pas une assurance de l’immeuble', () => {
    const trouvees = reconnues(CLAUSE, 'OBLIGATION')
    expect(trouvees).toContain('RISQUES_LOCATIFS')
    expect(trouvees).not.toContain('ASSURANCE_IMMEUBLE_BAILLEUR')
  })

  it('rapproche le vocabulaire du bail de celui de la police', () => {
    const exigees = reconnues(CLAUSE, 'OBLIGATION')
    const couvertes = reconnues(
      'Garantie responsabilité locative (risques locatifs) : 1 500 000 € par sinistre.',
      'COUVERTURE',
    )
    // Le bail écrit « locaux loués / incendie », la police écrit
    // « responsabilité locative ». Le même risque.
    expect(satisfaite(exigees[0] as string, couvertes).satisfaite).toBe(true)
  })

  it('accepte une RC occupant en réponse à une exigence de risques locatifs', () => {
    const couvertes = reconnues(
      'Responsabilité civile occupant : 3 000 000 € par sinistre.',
      'COUVERTURE',
    )
    const resultat = satisfaite('RISQUES_LOCATIFS', couvertes)
    expect(resultat.satisfaite).toBe(true)
    expect(resultat.parQuoi).toBe('RC_OCCUPANT')
  })

  it('n’accepte PAS une assurance de l’immeuble en réponse à cette exigence', () => {
    expect(satisfaite('RISQUES_LOCATIFS', ['ASSURANCE_IMMEUBLE_BAILLEUR']).satisfaite).toBe(false)
  })

  it('reconnaît le vrai transfert quand il est stipulé', () => {
    const trouvees = reconnues(
      'Le Preneur assurera l’immeuble appartenant au Bailleur, en ce compris la structure, le clos et le couvert.',
      'OBLIGATION',
    )
    expect(trouvees).toContain('ASSURANCE_IMMEUBLE_BAILLEUR')
    expect(trouvees).not.toContain('RISQUES_LOCATIFS')
  })

  it('n’est pas troublé par une clause d’immeuble ailleurs dans le bail', () => {
    // L'exclusion joue dans la STIPULATION, pas dans le document : sinon une
    // clause du bailleur sur son propre immeuble desactiverait la lecture des
    // risques locatifs trois articles plus loin.
    const bail = `Article 14 — Le Bailleur assure l’immeuble, la structure et le clos et le couvert.
Article 15 — Le Preneur devra assurer les locaux loués contre l’incendie et les dégâts des eaux.`
    expect(reconnues(bail, 'OBLIGATION')).toContain('RISQUES_LOCATIFS')
  })
})

describe('ce que le moteur écarte, il le consigne', () => {
  it('nomme la garantie écartée et dit pourquoi', () => {
    // Une stipulation qui parle des deux : la plus specifique l'emporte, et
    // l'autre reste visible pour que le praticien controle le raisonnement.
    const trouvees = reconnaitre(
      'Le Preneur assurera l’immeuble appartenant au Bailleur contre l’incendie, l’explosion et les dégâts des eaux dans les locaux loués.',
      'OBLIGATION',
    )
    const consignees = trouvees.flatMap((r) => r.ecartees)
    expect(trouvees.length).toBeGreaterThan(0)
    // Soit une seule lecture s'impose, soit l'ecart est consigne — jamais un
    // choix silencieux entre deux lectures contradictoires.
    const ids = trouvees.map((r) => r.garantieId)
    const contradictoires =
      ids.includes('RISQUES_LOCATIFS') && ids.includes('ASSURANCE_IMMEUBLE_BAILLEUR')
    expect(contradictoires === false || consignees.length > 0).toBe(true)
  })

  it('donne à chaque reconnaissance la trace des motifs qui ont répondu', () => {
    const trouvees = reconnaitre('Le Preneur garantira les risques locatifs.', 'OBLIGATION')
    expect(trouvees[0]?.motifs.length).toBeGreaterThan(0)
    expect(trouvees[0]?.motifs[0]).toBe('nommée expressément')
  })
})

describe('la découpe en stipulations', () => {
  it('ne franchit ni point, ni point-virgule, ni retour à la ligne', () => {
    const decoupe = stipulations('Première phrase. Deuxième ; troisième\nquatrième')
    expect(decoupe.map((s) => s.texte)).toEqual([
      'Première phrase',
      'Deuxième',
      'troisième',
      'quatrième',
    ])
  })

  it('garde les offsets absolus, qui portent l’ancrage Word', () => {
    const texte = 'Article 14. Le Preneur assure.'
    const decoupe = stipulations(texte)
    const seconde = decoupe[1]
    expect(seconde).toBeDefined()
    expect(texte.slice(seconde?.debut, seconde?.fin)).toBe('Le Preneur assure')
  })

  it('décale correctement quand on lui donne une origine', () => {
    const decoupe = stipulations('Le Preneur assure.', 1000)
    expect(decoupe[0]?.debut).toBe(1000)
  })
})

describe('la nomenclature elle-même', () => {
  it('donne un identifiant unique à chaque garantie', () => {
    const ids = NOMENCLATURE.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => /^[A-Z][A-Z0-9_]+$/.test(id))).toBe(true)
  })

  it('couvre les notions que le métier exige', () => {
    for (const attendue of [
      'RISQUES_LOCATIFS',
      'RECOURS_VOISINS_TIERS',
      'RC_EXPLOITATION',
      'RC_OCCUPANT',
      'DOMMAGES_BIENS_PRENEUR',
      'AGENCEMENTS_AMENAGEMENTS',
      'MOBILIER_MATERIEL_MARCHANDISES',
      'PERTE_EXPLOITATION',
      'PERTE_LOYERS',
      'BRIS_DE_MACHINE',
      'VALEUR_A_NEUF',
      'FRANCHISE',
      'RENONCIATION_RECOURS',
      'ASSURANCE_POUR_COMPTE',
      'ASSURANCE_IMMEUBLE_BAILLEUR',
      'CAPITAUX_ASSURES',
    ]) {
      expect(GARANTIE_PAR_ID.has(attendue), `${attendue} manque à la nomenclature`).toBe(true)
    }
  })

  it('dit de chaque garantie ce qu’elle ne couvre pas', () => {
    for (const entree of NOMENCLATURE) {
      expect(entree.neCouvrePas.length, entree.id).toBeGreaterThan(0)
      expect(entree.definition.length, entree.id).toBeGreaterThan(40)
    }
  })

  it('donne à chaque confusion la question qui tranche', () => {
    for (const entree of NOMENCLATURE) {
      for (const confusion of entree.confusions) {
        expect(GARANTIE_PAR_ID.has(confusion.avec), `${entree.id} → ${confusion.avec}`).toBe(true)
        expect(confusion.question.endsWith('?'), `${entree.id} → ${confusion.avec}`).toBe(true)
        expect(confusion.distinction.length).toBeGreaterThan(60)
      }
    }
  })

  it('ne renvoie jamais vers une garantie englobante inconnue', () => {
    for (const entree of NOMENCLATURE) {
      for (const id of entree.satisfaitePar ?? []) {
        expect(GARANTIE_PAR_ID.has(id), `${entree.id} → ${id}`).toBe(true)
      }
    }
  })

  it('sépare les responsabilités des assurances de choses', () => {
    expect(garantie('RISQUES_LOCATIFS').categorie).toBe(Categorie.RESPONSABILITE)
    expect(garantie('ASSURANCE_IMMEUBLE_BAILLEUR').categorie).toBe(Categorie.DOMMAGES_AUX_BIENS)
    // Et ne prend jamais une modalité pour une garantie.
    expect(garantie('VALEUR_A_NEUF').categorie).toBe(Categorie.MODALITE)
    expect(garantie('FRANCHISE').categorie).toBe(Categorie.MODALITE)
  })

  it('nomme le bénéficiaire réel, qui n’est pas toujours celui qui souscrit', () => {
    // Le preneur souscrit, le bailleur est protégé : c'est ce décalage qui
    // rend l'analyse utile.
    expect(garantie('RISQUES_LOCATIFS').beneficiaire).toBe(Beneficiaire.BAILLEUR)
    expect(garantie('PERTE_LOYERS').beneficiaire).toBe(Beneficiaire.BAILLEUR)
    expect(garantie('PERTE_EXPLOITATION').beneficiaire).toBe(Beneficiaire.PRENEUR)
    expect(garantie('RECOURS_VOISINS_TIERS').beneficiaire).toBe(Beneficiaire.TIERS)
  })

  it('cite une base juridique là où le droit conditionne l’analyse', () => {
    expect(garantie('RISQUES_LOCATIFS').baseJuridique).toMatch(/173[0-9]/)
    expect(garantie('RENONCIATION_RECOURS').baseJuridique).toMatch(/L121-12/)
    expect(garantie('ASSURANCE_POUR_COMPTE').baseJuridique).toMatch(/L112-1/)
  })
})
