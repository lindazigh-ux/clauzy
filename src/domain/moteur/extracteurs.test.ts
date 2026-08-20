import { describe, expect, it } from 'vitest'

import { enJours, enMois, extraireValeurs, nombreEnLettres } from './extracteurs'

const premier = (texte: string, nature: string) =>
  extraireValeurs(texte).find((v) => v.nature === nature)

describe('nombres en toutes lettres', () => {
  it('lit les formes rencontrees dans les baux', () => {
    expect(nombreEnLettres('douze')).toBe(12)
    expect(nombreEnLettres('vingt-quatre')).toBe(24)
    expect(nombreEnLettres('trente-six')).toBe(36)
    expect(nombreEnLettres('quarante-huit')).toBe(48)
    expect(nombreEnLettres('cent vingt')).toBe(120)
    expect(nombreEnLettres('deux cents')).toBe(200)
    expect(nombreEnLettres('trois cent mille')).toBe(300000)
    expect(nombreEnLettres('neuf')).toBe(9)
  })

  it('ignore la casse et les accents', () => {
    expect(nombreEnLettres('Vingt-Quatre')).toBe(24)
    expect(nombreEnLettres('zéro')).toBe(0)
  })

  it('renvoie null sur ce qui n est pas un nombre', () => {
    expect(nombreEnLettres('assurances')).toBeNull()
    expect(nombreEnLettres('')).toBeNull()
  })
})

describe('durees', () => {
  it('lit les chiffres et les lettres', () => {
    expect(premier('garantie de 24 mois', 'duree')).toMatchObject({ valeur: 24, unite: 'mois' })
    expect(premier('garantie de vingt-quatre mois', 'duree')).toMatchObject({ valeur: 24, unite: 'mois' })
    expect(premier('une duree de neuf ans', 'duree')).toMatchObject({ valeur: 9, unite: 'annee' })
    expect(premier('sous quinze jours', 'duree')).toMatchObject({ valeur: 15, unite: 'jour' })
  })

  it('accepte la forme doublee « vingt-quatre (24) mois »', () => {
    expect(premier('vingt-quatre (24) mois', 'duree')).toMatchObject({ valeur: 24, unite: 'mois' })
  })

  it('n extrait rien quand les deux formes se contredisent', () => {
    // Un bail ambigu ne doit pas produire d ecart chiffre (brief §5.3).
    expect(premier('vingt-quatre (12) mois', 'duree')).toBeUndefined()
  })

  it('ne convertit pas les mois calendaires en jours', () => {
    expect(enMois(2, 'annee')).toBe(24)
    expect(enJours(3, 'semaine')).toBe(21)
  })
})

describe('montants', () => {
  it('lit les ecritures rencontrees en pratique', () => {
    expect(premier('capitaux de 1 500 000 €', 'montant_eur')).toMatchObject({ valeur: 1_500_000 })
    expect(premier('capitaux de 2,4 M€', 'montant_eur')).toMatchObject({ valeur: 2_400_000 })
    expect(premier('plafond de 8 millions d’euros', 'montant_eur')).toMatchObject({ valeur: 8_000_000 })
    expect(premier('franchise de 5 000 EUR', 'montant_eur')).toMatchObject({ valeur: 5_000 })
    expect(premier('300 k€ de frais', 'montant_eur')).toMatchObject({ valeur: 300_000 })
  })

  it('distingue separateur de milliers et decimale', () => {
    expect(premier('1.500.000 €', 'montant_eur')).toMatchObject({ valeur: 1_500_000 })
    expect(premier('1 500,50 €', 'montant_eur')).toMatchObject({ valeur: 1_500.5 })
  })
})

describe('pourcentages', () => {
  it('lit les chiffres et les lettres', () => {
    expect(premier('vetuste de 10 %', 'pourcentage')).toMatchObject({ valeur: 10 })
    expect(premier('abattement de dix pour cent', 'pourcentage')).toMatchObject({ valeur: 10 })
  })
})

describe('dates', () => {
  it('lit les deux ecritures', () => {
    expect(premier('a effet du 1er janvier 2026', 'date')).toMatchObject({ iso: '2026-01-01' })
    expect(premier('echeance au 31/12/2026', 'date')).toMatchObject({ iso: '2026-12-31' })
  })

  it('rejette une date impossible', () => {
    expect(premier('le 31 février 2026', 'date')).toBeUndefined()
    expect(premier('le 31/02/2026', 'date')).toBeUndefined()
  })
})

describe('offsets', () => {
  const texte = 'La garantie des pertes d’exploitation est acquise pour 12 mois a compter du sinistre.'

  it('chaque valeur se retrouve a l identique dans le texte', () => {
    for (const valeur of extraireValeurs(texte)) {
      expect(texte.slice(valeur.debut, valeur.fin)).toBe(valeur.texte)
    }
  })

  it('respecte le decalage du segment', () => {
    const valeur = extraireValeurs(texte, 1000)[0]
    expect(valeur?.debut).toBeGreaterThanOrEqual(1000)
    expect(valeur?.debut).toBe(1000 + texte.indexOf('12 mois'))
  })
})

describe('hygiene des motifs', () => {
  it('reste lineaire sur un texte long', () => {
    const texte = 'Le preneur assurera ses biens pour 24 mois et 1 500 000 € au 1er janvier 2026. '.repeat(2000)
    const t0 = performance.now()
    const valeurs = extraireValeurs(texte)
    expect(performance.now() - t0).toBeLessThan(1000)
    expect(valeurs.length).toBeGreaterThan(1000)
  })
})
