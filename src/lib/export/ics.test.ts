import { describe, expect, it } from 'vitest'

import { SUIVI_VIDE, type Suivi } from '@/domain/dossier/suivi'

import { exporterCalendrier } from './ics'

/**
 * iCalendar est un format ancien et pointilleux : un agenda qui refuse un
 * fichier ne dit jamais pourquoi. Ces tests verifient ce qui se paie cher —
 * le pliage des lignes en OCTETS, l'echappement des separateurs, les CRLF.
 */

const MAINTENANT = new Date('2026-09-05T08:00:00.000Z')

const suivi = (modifications: Partial<Suivi> = {}): Suivi => ({
  ...SUIVI_VIDE,
  envoyeLe: '2026-09-01T14:30:00.000Z',
  destinataire: 'courtage@exemple.test',
  ...modifications,
})

/** Deplie les lignes de continuation : c'est le texte reel que lit un agenda. */
const deplier = (contenu: string): string => contenu.replace(/\r\n /g, '')

const options = {
  reference: 'D-2026-014',
  client: 'Distribution Nord SAS',
  destinataire: 'courtage@exemple.test',
  maintenant: MAINTENANT,
}

describe('structure du fichier', () => {
  it('produit un calendrier valide, plié en CRLF', () => {
    const { contenu } = exporterCalendrier(suivi(), options)

    expect(contenu.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(contenu.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(contenu).toContain('VERSION:2.0')
    // Aucun saut de ligne isolé : les agendas les refusent.
    expect(contenu.split('\r\n').join('')).not.toContain('\n')
  })

  it('porte un événement par jalon restant, chacun avec son rappel', () => {
    const { contenu, nombreJalons } = exporterCalendrier(suivi(), options)

    // La demande est tenue pour envoyee : restent les quatre relances.
    expect(nombreJalons).toBe(4)
    expect((contenu.match(/BEGIN:VEVENT/g) ?? []).length).toBe(4)
    expect((contenu.match(/END:VEVENT/g) ?? []).length).toBe(4)
    expect((contenu.match(/BEGIN:VALARM/g) ?? []).length).toBe(4)
  })

  it('date la première relance à huit jours de l’envoi, en journée de travail', () => {
    const { contenu } = exporterCalendrier(suivi(), options)
    // 1er septembre + 8 jours, calé à 9 h : une relance ne se pose pas à 19 h 42.
    expect(contenu).toContain('DTSTART:20260909T090000Z')
  })

  it('n’exporte que ce qui reste à faire', () => {
    const { nombreJalons } = exporterCalendrier(suivi({ faits: ['RELANCE_SIMPLE'] }), options)
    expect(nombreJalons).toBe(3)
  })

  it('rend un calendrier vide quand l’attestation est arrivée', () => {
    const { contenu, nombreJalons } = exporterCalendrier(
      suivi({ recuLe: '2026-09-03T09:00:00.000Z' }),
      options,
    )
    expect(nombreJalons).toBe(0)
    expect(contenu).not.toContain('BEGIN:VEVENT')
  })

  it('rend un calendrier vide sans date d’envoi, plutôt que des échéances fausses', () => {
    expect(exporterCalendrier(suivi({ envoyeLe: null }), options).nombreJalons).toBe(0)
  })
})

describe('échappement', () => {
  it('protège les virgules et les points-virgules du texte', () => {
    const { contenu } = exporterCalendrier(suivi(), {
      ...options,
      client: 'Durand, Martin & Cie ; Lille',
    })
    const resume = deplier(contenu).split('\r\n').find((l) => l.startsWith('SUMMARY:')) ?? ''
    expect(resume).toContain('\\,')
    expect(resume).toContain('\\;')
  })

  it('remplace les retours à la ligne des descriptions', () => {
    const { contenu } = exporterCalendrier(suivi(), options)
    const description =
      deplier(contenu).split('\r\n').find((l) => l.startsWith('DESCRIPTION:')) ?? ''
    expect(description).toContain('\\n')
  })
})

describe('pliage des lignes', () => {
  it('ne laisse aucune ligne dépasser 75 octets', () => {
    // On compte en octets, pas en caractères : « é » en pèse deux, et couper au
    // milieu produit un fichier illisible.
    const { contenu } = exporterCalendrier(suivi(), {
      ...options,
      client: 'Société des Établissements Réunis de Distribution Générale du Nord et de l’Est',
    })
    const encodeur = new TextEncoder()

    for (const ligne of contenu.split('\r\n')) {
      expect(encodeur.encode(ligne).length, ligne.slice(0, 40)).toBeLessThanOrEqual(75)
    }
  })

  it('plie par une espace de continuation, comme l’exige le format', () => {
    const { contenu } = exporterCalendrier(suivi(), {
      ...options,
      client: 'Société des Établissements Réunis de Distribution Générale du Nord et de l’Est',
    })
    const lignes = contenu.split('\r\n')
    const continuations = lignes.filter((l) => l.startsWith(' '))
    expect(continuations.length).toBeGreaterThan(0)
  })

  it('ne coupe jamais un caractère accentué en deux', () => {
    const { contenu } = exporterCalendrier(suivi(), {
      ...options,
      client: 'Établissements Réunis — Génie Écologique et Réhabilitation Énergétique du Bâti',
    })
    // Un dépliage doit rendre un texte intact : aucun caractère de remplacement.
    const deplie = deplier(contenu)
    expect(deplie).not.toContain('�')
    expect(deplie).toContain('Établissements Réunis')
  })
})

describe('nom de fichier', () => {
  it('reprend la référence du dossier', () => {
    expect(exporterCalendrier(suivi(), options).nomFichier).toBe('D-2026-014-relances.ics')
  })

  it('reste utilisable sans référence', () => {
    expect(exporterCalendrier(suivi(), { ...options, reference: '' }).nomFichier).toBe(
      'relances.ics',
    )
  })
})
