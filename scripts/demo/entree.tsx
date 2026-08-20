/**
 * Point d'entree de la demonstration autonome.
 *
 * Elle embarque le produit reel : les 40 controles de la praticienne, le
 * moteur, le corpus synthetique, le poste de travail et les deux exports. Rien
 * n'est simule.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { PosteDeTravail } from '@/app/dossier/PosteDeTravail'
import '@/app/globals.css'

const racine = document.getElementById('racine')
if (racine !== null) {
  createRoot(racine).render(
    <StrictMode>
      <PosteDeTravail />
    </StrictMode>,
  )
}
