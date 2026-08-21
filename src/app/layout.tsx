import type { Metadata } from 'next'
import { IBM_Plex_Mono, Manrope, Newsreader } from 'next/font/google'

import { ORIGINE } from '@/contenu/site'

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

/**
 * Face a chasse fixe pour les references de controle et les chiffres alignes.
 * Le §8 n'en fixait pas : elle comble un manque plutot qu'elle n'ecarte un choix.
 */
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--police-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  // Sans `metadataBase`, Next rend les URL d'Open Graph en relatif — et un
  // relatif ne se partage pas : les reseaux sociaux le rejettent (§9).
  metadataBase: new URL(ORIGINE),
  title: {
    default: 'Clauzy — le bail promet, la police suit-elle ?',
    template: '%s — Clauzy',
  },
  description:
    'Clauzy réconcilie une obligation contractuelle avec la couverture d’assurance réellement souscrite, et produit une note de conseil opposable. Vos documents ne quittent jamais votre navigateur.',
  applicationName: 'Clauzy',
  authors: [{ name: 'Clauzy' }],
  keywords: [
    'bail commercial',
    'assurance',
    'conformité assurantielle',
    'renonciation à recours',
    'perte d’exploitation',
    'attestation d’assurance',
    'audit de bail',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Clauzy',
    url: ORIGINE,
    title: 'Clauzy — le bail promet, la police suit-elle ?',
    description:
      'Quarante contrôles entre un bail commercial et la couverture réellement souscrite. L’analyse se fait dans votre navigateur : aucun document n’est transmis.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clauzy — le bail promet, la police suit-elle ?',
    description:
      'Quarante contrôles entre un bail commercial et la couverture réellement souscrite. Vos documents ne quittent pas votre navigateur.',
  },
  alternates: { canonical: ORIGINE },
  category: 'business',
}

export default function RacineLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${manrope.variable} ${newsreader.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
