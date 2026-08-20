import { describe, expect, it } from 'vitest'

import { basculerJalon, dossierVierge, majSuivi } from './index'
import {
  JALONS,
  SUIVI_VIDE,
  calendrier,
  decaler,
  formulerProchaineAction,
  jalonsRestants,
  prochaineAction,
  type Suivi,
} from './suivi'

/**
 * Critere de sortie du lot L5 : cinq jalons, relance calculee depuis la date
 * d'envoi.
 */

const ENVOI = '2026-09-01T14:30:00.000Z'
const suivi = (modifications: Partial<Suivi> = {}): Suivi => ({
  ...SUIVI_VIDE,
  envoyeLe: ENVOI,
  destinataire: 'courtage@exemple.test',
  ...modifications,
})

describe('le calendrier', () => {
  it('compte cinq jalons', () => {
    expect(JALONS).toHaveLength(5)
    expect(JALONS.map((j) => j.jours)).toEqual([0, 8, 15, 30, 45])
  })

  it('ancre la première relance sur les huit jours que les baux stipulent', () => {
    // C’est le délai que surveille FOR-01 : il n’est pas arbitraire.
    const relance = JALONS.find((j) => j.id === 'RELANCE_SIMPLE')
    expect(relance?.jours).toBe(8)
  })

  it('date chaque jalon depuis la date d’envoi', () => {
    const entrees = calendrier(suivi(), new Date('2026-09-02T09:00:00.000Z'))
    expect(entrees).toHaveLength(5)
    expect(entrees[0]?.echeance.slice(0, 10)).toBe('2026-09-01')
    expect(entrees[1]?.echeance.slice(0, 10)).toBe('2026-09-09')
    expect(entrees[4]?.echeance.slice(0, 10)).toBe('2026-10-16')
  })

  it('donne à chaque jalon une action et une preuve à verser', () => {
    for (const jalon of JALONS) {
      expect(jalon.action.length, jalon.id).toBeGreaterThan(30)
      expect(jalon.preuve.length, jalon.id).toBeGreaterThan(10)
    }
  })

  it('traverse un changement d’heure sans décaler d’un jour', () => {
    // Le passage à l’heure d’hiver tombe fin octobre en Europe.
    expect(decaler('2026-10-20T09:00:00.000Z', 15).slice(0, 10)).toBe('2026-11-04')
  })
})

describe('sans date d’envoi, aucun calendrier', () => {
  it('ne propose rien plutôt que d’inventer des échéances', () => {
    const sansDate = suivi({ envoyeLe: null })
    expect(calendrier(sansDate)).toEqual([])
    expect(prochaineAction(sansDate)).toBeNull()
    expect(formulerProchaineAction(sansDate)).toMatch(/Aucune date d’envoi/)
  })
})

describe('l’état de chaque jalon', () => {
  it('distingue à venir, à faire et en retard', () => {
    // Neuf jours après l’envoi : la première relance est due, la relance
    // formelle ne l’est pas encore.
    const entrees = calendrier(suivi(), new Date('2026-09-10T09:00:00.000Z'))
    expect(entrees[1]?.etat).toBe('A_FAIRE')
    expect(entrees[2]?.etat).toBe('A_VENIR')
  })

  it('tient la demande pour envoyée dès que sa date est renseignée', () => {
    // Saisir la date d’envoi EST l’affirmation que la demande est partie : la
    // présenter « en retard » serait absurde.
    const entrees = calendrier(suivi(), new Date('2026-11-01T09:00:00.000Z'))
    expect(entrees[0]?.etat).toBe('FAIT')
    expect(prochaineAction(suivi(), new Date('2026-09-02T09:00:00.000Z'))?.jalon.id).toBe(
      'RELANCE_SIMPLE',
    )
  })

  it('ne suppose jamais qu’une relance a été faite parce que sa date est passée', () => {
    const entrees = calendrier(suivi(), new Date('2026-11-01T09:00:00.000Z'))
    expect(entrees.slice(1).every((e) => e.etat === 'EN_RETARD')).toBe(true)
  })

  it('marque comme fait ce que le praticien a coché', () => {
    const entrees = calendrier(
      suivi({ faits: ['RELANCE_SIMPLE'] }),
      new Date('2026-09-10T09:00:00.000Z'),
    )
    expect(entrees[0]?.etat).toBe('FAIT')
    expect(entrees[1]?.etat).toBe('FAIT')
    expect(entrees[2]?.etat).toBe('A_VENIR')
  })

  it('une attestation reçue clôt tout ce qui restait', () => {
    const entrees = calendrier(
      suivi({ recuLe: '2026-09-12T09:00:00.000Z' }),
      new Date('2026-11-01T09:00:00.000Z'),
    )
    expect(entrees.every((e) => e.etat === 'FAIT')).toBe(true)
    expect(jalonsRestants(suivi({ recuLe: '2026-09-12T09:00:00.000Z' }))).toEqual([])
  })
})

describe('la prochaine action datée (brief §7)', () => {
  it('nomme le jalon et sa date', () => {
    const phrase = formulerProchaineAction(suivi(), new Date('2026-09-05T09:00:00.000Z'))
    expect(phrase).toBe('Première relance, le 9 septembre 2026.')
  })

  it('signale le retard', () => {
    const phrase = formulerProchaineAction(suivi(), new Date('2026-09-20T09:00:00.000Z'))
    expect(phrase).toMatch(/en retard/)
  })

  it('clôt le point quand l’attestation est arrivée', () => {
    const phrase = formulerProchaineAction(suivi({ recuLe: '2026-09-12T09:00:00.000Z' }))
    expect(phrase).toBe('Attestation reçue le 12 septembre 2026. Le point est clos.')
  })
})

describe('le suivi vit dans le dossier', () => {
  it('part vide et se renseigne', () => {
    const vierge = dossierVierge()
    expect(vierge.suivi).toEqual(SUIVI_VIDE)

    const renseigne = majSuivi(vierge, { envoyeLe: ENVOI, destinataire: 'courtage@exemple.test' })
    expect(prochaineAction(renseigne.suivi, new Date('2026-09-02T09:00:00.000Z'))?.jalon.id).toBe(
      'RELANCE_SIMPLE',
    )
  })

  it('coche et décoche un jalon', () => {
    let dossier = majSuivi(dossierVierge(), { envoyeLe: ENVOI })
    dossier = basculerJalon(dossier, 'DEMANDE')
    expect(dossier.suivi.faits).toEqual(['DEMANDE'])

    dossier = basculerJalon(dossier, 'DEMANDE')
    expect(dossier.suivi.faits).toEqual([])
  })
})
