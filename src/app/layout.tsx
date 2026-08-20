import type { Metadata } from 'next'
import { Manrope, Newsreader } from 'next/font/google'

import './globals.css'

/**
 * Polices servies en fichiers cachables, jamais en base64 (brief §3).
 * next/font les auto-heberge : aucune requete vers un tiers, ce qui permet de
 * garder `font-src 'self'` dans la CSP.
 */
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--police-sans',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--police-serif',
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Clauzy — le bail promet, la police suit-elle ?',
    template: '%s — Clauzy',
  },
  description:
    'Clauzy réconcilie une obligation contractuelle avec la couverture d’assurance réellement souscrite, et produit une note de conseil opposable. Vos documents ne quittent jamais votre navigateur.',
  applicationName: 'Clauzy',
  robots: { index: true, follow: true },
}

export default function RacineLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${manrope.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  )
}
