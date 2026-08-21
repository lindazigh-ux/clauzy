import { ImageResponse } from 'next/og'

import { NOMBRE_CONTROLES } from '@/domain/controles'

/**
 * Image de partage (brief §9).
 *
 * Generee au build, jamais a la demande : elle ne depend d'aucune donnee
 * variable, et une image sociale calculee a chaque requete serait un cout pour
 * rien. Aucune police distante n'est chargee — la CSP l'interdirait, et une
 * image de partage qui depend d'un tiers casse le jour ou le tiers tombe.
 */
export const alt = 'Clauzy — le bail promet, la police ne suit pas'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          padding: '72px 80px',
          // Un liseré vert en pied : la signature du produit, sans logo lourd.
          borderBottom: '18px solid #0e6b4a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#0e6b4a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#131d18', letterSpacing: -0.5 }}>
            Clauzy
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: '#131d18',
              lineHeight: 1.1,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            Le bail promet, la police ne suit pas.
          </div>
          {/* satori exige un display explicite des qu'un noeud a plusieurs
              enfants — ici, l'interpolation en cree deux. */}
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              color: '#56655d',
              lineHeight: 1.4,
              maxWidth: 860,
            }}
          >
            {NOMBRE_CONTROLES} contrôles entre les obligations d’un bail commercial et la couverture
            réellement souscrite.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              color: '#0a5238',
              background: '#f1f8f4',
              border: '1px solid #dceee5',
              borderRadius: 8,
              padding: '10px 18px',
            }}
          >
            Vos documents ne quittent pas votre navigateur
          </div>
        </div>
      </div>
    ),
    size,
  )
}
