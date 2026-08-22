import { describe, expect, it } from 'vitest'

import {
  ACTION_PAR_CATEGORIE,
  Action,
  GraviteMetier,
  INTERLOCUTEUR,
  LIBELLE_ACTION,
  LIBELLE_GRAVITE,
  ORDRE_GRAVITE,
  StatutAffiche,
  graviteDe,
  plafonner,
  statutAffiche,
} from '../axes'
import { NOMENCLATURE } from '../nomenclature'
import { Categorie, NiveauPreuve } from '../types'

/**
 * LES TROIS AXES.
 *
 * Ce que ces tests protègent : le fait que preuve, gravité et action restent
 * INDÉPENDANTES. La tentation permanente est de les fusionner — « écart
 * confirmé » devient « critique » devient « à négocier » — et c'est ainsi
 * qu'on finit par crier au critique sur une garantie qu'on n'a simplement pas
 * pu vérifier.
 */

describe('les trois axes ne se déduisent pas l’un de l’autre', () => {
  it('un écart confirmé sur une modalité n’est pas critique', () => {
    // Une franchise mal calée coûte la différence, pas le patrimoine.
    expect(graviteDe(Categorie.MODALITE, NiveauPreuve.ECART_CONFIRME)).toBe(GraviteMetier.MODEREE)
  })

  it('une responsabilité non démontrée n’est pas critique non plus', () => {
    // « Non démontré » veut dire qu'on ne sait pas. L'annoncer comme critique
    // est exactement le faux positif qui fait tout revérifier au praticien.
    expect(graviteDe(Categorie.RESPONSABILITE, NiveauPreuve.NON_DEMONTREE)).toBe(
      GraviteMetier.IMPORTANTE,
    )
  })

  it('mais une responsabilité en écart CONFIRMÉ l’est', () => {
    expect(graviteDe(Categorie.RESPONSABILITE, NiveauPreuve.ECART_CONFIRME)).toBe(
      GraviteMetier.CRITIQUE,
    )
  })

  it('une couverture établie ne laisse qu’une information', () => {
    for (const categorie of Object.values(Categorie)) {
      expect(graviteDe(categorie, NiveauPreuve.ETABLIE), categorie).toBe(GraviteMetier.INFORMATION)
    }
  })

  it('le niveau de preuve plafonne la gravité, il ne l’augmente jamais', () => {
    for (const categorie of Object.values(Categorie)) {
      const confirme = graviteDe(categorie, NiveauPreuve.ECART_CONFIRME)
      for (const preuve of Object.values(NiveauPreuve)) {
        const rang = ORDRE_GRAVITE.indexOf(graviteDe(categorie, preuve))
        expect(rang, `${categorie}/${preuve}`).toBeGreaterThanOrEqual(
          ORDRE_GRAVITE.indexOf(confirme),
        )
      }
    }
  })

  it('plafonner ne remonte jamais une gravité', () => {
    expect(plafonner(GraviteMetier.MODEREE, GraviteMetier.CRITIQUE)).toBe(GraviteMetier.MODEREE)
    expect(plafonner(GraviteMetier.CRITIQUE, GraviteMetier.MODEREE)).toBe(GraviteMetier.MODEREE)
  })
})

describe('« à négocier » est une action, jamais une gravité', () => {
  it('n’apparaît pas dans l’échelle de gravité', () => {
    expect(Object.values(LIBELLE_GRAVITE).join(' ')).not.toMatch(/négoci/i)
  })

  it('apparaît bien dans l’échelle d’action', () => {
    expect(LIBELLE_ACTION[Action.NEGOCIER_CLAUSE]).toMatch(/Négocier/)
  })

  it('porte son propre badge, distinct de « critique »', () => {
    expect(
      statutAffiche(NiveauPreuve.ECART_CONFIRME, GraviteMetier.IMPORTANTE, Action.NEGOCIER_CLAUSE),
    ).toBe(StatutAffiche.A_NEGOCIER)
  })
})

describe('le badge d’affichage se déduit des trois axes', () => {
  it('ce qui est établi est conforme, quelle que soit la gravité du sujet', () => {
    expect(statutAffiche(NiveauPreuve.ETABLIE, GraviteMetier.CRITIQUE, Action.AUCUNE_ACTION)).toBe(
      StatutAffiche.CONFORME,
    )
  })

  it('le critique passe devant tout le reste', () => {
    expect(
      statutAffiche(NiveauPreuve.ECART_CONFIRME, GraviteMetier.CRITIQUE, Action.NEGOCIER_CLAUSE),
    ).toBe(StatutAffiche.CRITIQUE)
  })

  it('une justification insuffisante se vérifie, elle n’alarme pas', () => {
    expect(
      statutAffiche(
        NiveauPreuve.JUSTIFICATION_INSUFFISANTE,
        GraviteMetier.MODEREE,
        Action.DEMANDER_ATTESTATION,
      ),
    ).toBe(StatutAffiche.A_VERIFIER)
  })

  it('ne rend jamais un badge hors de l’échelle', () => {
    for (const preuve of Object.values(NiveauPreuve)) {
      for (const gravite of Object.values(GraviteMetier)) {
        for (const action of Object.values(Action)) {
          expect(Object.values(StatutAffiche)).toContain(statutAffiche(preuve, gravite, action))
        }
      }
    }
  })
})

describe('la table des recommandations', () => {
  it('couvre chaque catégorie et chaque niveau', () => {
    for (const categorie of Object.values(Categorie)) {
      for (const preuve of Object.values(NiveauPreuve)) {
        const recommandation = ACTION_PAR_CATEGORIE[categorie][preuve]
        expect(recommandation, `${categorie}/${preuve}`).toBeDefined()
        expect(Object.values(Action)).toContain(recommandation.action)
        expect(recommandation.phrase.length, `${categorie}/${preuve}`).toBeGreaterThan(8)
      }
    }
  })

  it('ne demande aucune action sur une couverture établie', () => {
    for (const categorie of Object.values(Categorie)) {
      expect(ACTION_PAR_CATEGORIE[categorie][NiveauPreuve.ETABLIE].action).toBe(
        Action.AUCUNE_ACTION,
      )
    }
  })

  it('ne propose pas de négocier une modalité d’indemnisation', () => {
    // On ne négocie pas une franchise avec un bailleur : on constate ce que la
    // police prévoit. Proposer une négociation enverrait au mauvais
    // interlocuteur.
    for (const preuve of Object.values(NiveauPreuve)) {
      expect(ACTION_PAR_CATEGORIE[Categorie.MODALITE][preuve].action).not.toBe(
        Action.NEGOCIER_CLAUSE,
      )
    }
  })

  it('n’achète jamais un mécanisme contractuel', () => {
    // Une renonciation à recours ne se souscrit pas : elle s'obtient par écrit.
    expect(ACTION_PAR_CATEGORIE[Categorie.MECANISME][NiveauPreuve.ECART_CONFIRME].action).toBe(
      Action.OBTENIR_ACCORD_ASSUREUR,
    )
  })

  it('nomme un interlocuteur dès qu’une démarche est demandée', () => {
    for (const action of [
      Action.DEMANDER_PIECE,
      Action.DEMANDER_ATTESTATION,
      Action.ADAPTER_CONTRAT,
      Action.NEGOCIER_CLAUSE,
      Action.OBTENIR_ACCORD_ASSUREUR,
    ]) {
      expect(INTERLOCUTEUR[action], action).not.toBeNull()
    }
  })

  it('donne un code valide à chaque recommandation propre d’une garantie', () => {
    for (const garantie of NOMENCLATURE) {
      for (const [niveau, recommandation] of Object.entries(garantie.actions ?? {})) {
        expect(Object.values(Action), `${garantie.id}/${niveau}`).toContain(recommandation.action)
        expect(recommandation.phrase.length, `${garantie.id}/${niveau}`).toBeGreaterThan(40)
      }
    }
  })

  it('n’envoie pas souscrire une assurance de l’immeuble du bailleur', () => {
    // Souscrire ferait financer au preneur un bien qui n'est pas le sien.
    const immeuble = NOMENCLATURE.find((g) => g.id === 'ASSURANCE_IMMEUBLE_BAILLEUR')
    expect(immeuble?.actions?.[NiveauPreuve.ECART_CONFIRME]?.action).toBe(Action.NEGOCIER_CLAUSE)
  })
})
