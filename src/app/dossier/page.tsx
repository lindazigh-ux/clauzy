import type { Metadata } from 'next'

import { PosteDeTravail } from './PosteDeTravail'

export const metadata: Metadata = {
  title: 'Poste de travail',
  description:
    'Importez le bail et les pièces, appliquez les 40 contrôles, reprenez chaque ligne avant de livrer. Vos documents ne quittent pas votre navigateur.',
  // L'application n'a rien a faire dans un index de moteur de recherche : c'est
  // le site marketing qui est indexable, pas le poste de travail (§9).
  robots: { index: false, follow: false },
}

export default function PageDossier() {
  return <PosteDeTravail />
}
