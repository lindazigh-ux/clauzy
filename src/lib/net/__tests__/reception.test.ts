import { describe, expect, it } from 'vitest'

import { ChargeRefusee, adresseVraisemblable, recevoirCharge } from '../reception'

/**
 * La garde du navigateur protege l'utilisateur d'un bogue de notre part. Elle
 * ne protege pas le serveur : n'importe qui peut poster ce qu'il veut sur une
 * route publique. Ces tests portent sur l'autre moitie de la barriere.
 */

describe('ce qui est accepté', () => {
  it('laisse passer les champs déclarés au catalogue', () => {
    expect(
      recevoirCharge('contact.demo', {
        email: 'jean@cabinet.fr',
        organisation: 'Cabinet Durand',
        tailleEquipe: '2-5',
        besoin: 'EQUIPE',
      }),
    ).toEqual({
      email: 'jean@cabinet.fr',
      organisation: 'Cabinet Durand',
      tailleEquipe: '2-5',
      besoin: 'EQUIPE',
    })
  })

  it('accepte l’absence d’un champ facultatif', () => {
    expect(recevoirCharge('contact.rapportExemple', { email: 'a@b.fr' })).toEqual({
      email: 'a@b.fr',
    })
  })

  it('traite une chaîne vide comme une absence', () => {
    expect(recevoirCharge('contact.rapportExemple', { email: 'a@b.fr', organisation: '' })).toEqual(
      { email: 'a@b.fr' },
    )
  })
})

describe('ce qui est refusé', () => {
  it('rejette un champ absent du catalogue', () => {
    expect(() =>
      recevoirCharge('contact.demo', { email: 'a@b.fr', message: 'bonjour' }),
    ).toThrow(ChargeRefusee)
  })

  it('rejette un extrait de bail collé dans un champ autorisé', () => {
    const extrait =
      'Le Preneur devra faire garantir, au profit du Bailleur, la perte des loyers et charges ' +
      'pour une durée de vingt-quatre mois, ainsi que les recours des voisins et des tiers, ' +
      'le tout conformément aux stipulations des présentes et de leurs annexes éventuelles.'
    expect(() => recevoirCharge('contact.demo', { email: 'a@b.fr', nom: extrait })).toThrow(
      ChargeRefusee,
    )
  })

  it('rejette un retour à la ligne, qui signale un contenu', () => {
    expect(() =>
      recevoirCharge('contact.demo', { email: 'a@b.fr', nom: 'Article 9\nAssurances' }),
    ).toThrow(ChargeRefusee)
  })

  it('rejette une valeur hors de l’énumération', () => {
    expect(() =>
      recevoirCharge('contact.demo', { email: 'a@b.fr', besoin: 'AUTRE_CHOSE' }),
    ).toThrow(ChargeRefusee)
  })

  it('rejette un champ obligatoire manquant', () => {
    expect(() => recevoirCharge('contact.demo', { besoin: 'EQUIPE' })).toThrow(ChargeRefusee)
  })

  it('rejette un type qui ne correspond pas', () => {
    expect(() => recevoirCharge('contact.rapportExemple', { email: 42 })).toThrow(ChargeRefusee)
  })

  it('rejette un corps qui n’est pas un objet', () => {
    expect(() => recevoirCharge('contact.demo', 'bonjour')).toThrow(ChargeRefusee)
    expect(() => recevoirCharge('contact.demo', ['a@b.fr'])).toThrow(ChargeRefusee)
    expect(() => recevoirCharge('contact.demo', null)).toThrow(ChargeRefusee)
  })

  it('ne rend jamais un champ qu’on ne lui a pas déclaré', () => {
    // Meme si la validation passait, la charge propre ne porte que le declare.
    const propre = recevoirCharge('contact.rapportExemple', { email: 'a@b.fr' })
    expect(Object.keys(propre)).toEqual(['email'])
  })
})

describe('la forme d’une adresse', () => {
  it('accepte les adresses ordinaires', () => {
    expect(adresseVraisemblable('jean.dupont@cabinet-durand.fr')).toBe(true)
  })

  it('refuse ce qui n’en est pas une', () => {
    for (const valeur of ['jean', 'jean@', '@cabinet.fr', 'jean@cabinet', 'jean dupont@a.fr']) {
      expect(adresseVraisemblable(valeur), valeur).toBe(false)
    }
  })
})
