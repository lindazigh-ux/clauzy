import { execSync } from 'node:child_process'

import type { NextConfig } from 'next'

/**
 * Empreinte du build, affichee sur /securite (brief §2).
 * Elle permet a un client de verifier que la version qu'il execute est bien
 * celle qui a ete auditee.
 */
const empreinteBuild = (): string => {
  const fourniParLaCI = process.env.CLAUZY_BUILD_HASH ?? process.env.GITHUB_SHA
  if (fourniParLaCI !== undefined && fourniParLaCI !== '') return fourniParLaCI.slice(0, 12)
  try {
    return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'developpement'
  }
}

const BUILD = empreinteBuild()
const enProduction = process.env.NODE_ENV === 'production'

/**
 * Content Security Policy (brief §2).
 *
 * La directive decisive est `connect-src 'self'` : elle interdit au navigateur
 * d'ouvrir une connexion vers un domaine non liste. Meme un code fautif ne peut
 * pas envoyer un extrait de bail ailleurs que sur l'origine de Clauzy — ou la
 * couche src/lib/net l'aurait de toute facon refuse.
 *
 * `worker-src blob:` est necessaire : l'analyse tourne dans un Web Worker et
 * les moteurs de parsing (pdfjs) instancient leur propre worker (§3).
 *
 * Limite assumee a ce stade : `script-src` accepte encore 'unsafe-inline', ce
 * qu'exige le script d'amorcage de Next sans nonce. Le passage au nonce est
 * prevu avec le site marketing (lot L7) ; il est documente tel quel sur
 * /securite plutot que sous-entendu.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${enProduction ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "manifest-src 'self'",
  ...(enProduction ? ['upgrade-insecure-requests'] : []),
].join('; ')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  generateBuildId: () => Promise.resolve(BUILD),
  env: {
    NEXT_PUBLIC_BUILD_HASH: BUILD,
  },
  async headers() {
    return [
      {
        source: '/:chemin*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()',
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
