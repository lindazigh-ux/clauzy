/**
 * Registre des 40 controles.
 *
 * ETAT AU LOT L0 : vide, volontairement.
 *
 * Le contenu metier doit etre repris INTEGRALEMENT du prototype React + Vite
 * (brief §5.1) : c'est l'actif principal du produit, redige par une
 * praticienne. Il n'est pas dans ce depot au moment du lot L0, et il ne doit
 * surtout pas etre reinvente ici — un controle approximatif est pire qu'un
 * controle absent, puisqu'il porte le devoir de conseil.
 *
 * A l'import (lot L1) : un fichier par famille dans ce dossier, agrege ici,
 * puis src/domain/controles/__tests__/registre.test.ts passe au vert de
 * lui-meme (il verifie deja la repartition, l'unicite et la forme des ids).
 */
import type { Controle, Famille } from './types'

export const CONTROLES: readonly Controle[] = []

export const controlesParFamille = (famille: Famille): readonly Controle[] =>
  CONTROLES.filter((controle) => controle.famille === famille)

export const controleParId = (id: string): Controle | undefined =>
  CONTROLES.find((controle) => controle.id === id)

export * from './types'
