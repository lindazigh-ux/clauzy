/**
 * Le récit du dossier — ce qu'un courtier lit en dix secondes (brief §17-39).
 *
 * La phrase de synthèse existante décrit l'OUTIL : « 45 contrôles appliqués —
 * 3 écarts, 12 conformes, 8 sans objet ». Elle a sa place dans le rapport, où
 * elle prouve l'étendue du travail. Elle n'a rien à faire en tête d'écran :
 * la première question à laquelle l'interface doit répondre n'est pas
 * « combien de contrôles ? » mais « qu'est-ce que je dois faire maintenant sur
 * ce dossier ? » (§43).
 *
 * Ce module compose donc un récit à partir des OBLIGATIONS du bail, pas des
 * contrôles du référentiel. Rien n'est recalculé ici : ni statut, ni gravité,
 * ni niveau de preuve. On assemble des phrases avec ce que le moteur a déjà
 * conclu.
 */
import { NiveauPreuve } from '../garanties/types'
import { StatutAffiche } from '../garanties/axes'
import { preconisations, type Dossier } from './index'

export type Recit = {
  /** Une à trois phrases, lisibles d'un coup d'œil. */
  readonly phrases: readonly string[]
  /** Ce que l'écran doit inviter à faire, quand il n'y a rien à lire encore. */
  readonly invitation: string | null
}

const accord = (n: number, mot: string, pluriel = `${mot}s`): string =>
  `${n} ${n > 1 ? pluriel : mot}`

/**
 * Le point le plus lourd du dossier, nommé.
 *
 * L'ordre est déjà celui des préconisations : enjeu chiffré d'abord, gravité
 * ensuite. On ne le rejoue pas, on prend le premier.
 */
const pointLePlusLourd = (dossier: Dossier): string | null => {
  const premier = preconisations(dossier)[0]
  if (premier === undefined) return null
  return premier.resumeEcart === null
    ? premier.controle.titre
    : `${premier.controle.titre} (${premier.resumeEcart})`
}

export function recit(dossier: Dossier): Recit {
  if (dossier.documents.length === 0) {
    return {
      phrases: [],
      invitation:
        'Déposez le bail pour commencer. Clauzy lit d’abord ce que le bail exige, avant toute confrontation aux polices.',
    }
  }

  const rapprochements = dossier.analyse?.rapprochements ?? []

  if (dossier.analyse === null) {
    return {
      phrases: [`${accord(dossier.documents.length, 'pièce')} importée${dossier.documents.length > 1 ? 's' : ''}.`],
      invitation: 'Lancez l’analyse : rien n’a encore été lu.',
    }
  }

  if (rapprochements.length === 0) {
    return {
      phrases: [
        'Aucune obligation d’assurance n’a été reconnue dans le bail.',
        'C’est peut-être exact — beaucoup de baux se contentent de renvoyer le preneur à ses propres polices — mais cela mérite une lecture directe du document avant de conclure.',
      ],
      invitation: null,
    }
  }

  const exigees = rapprochements.length
  const couvertes = rapprochements.filter((r) => r.niveau === NiveauPreuve.ETABLIE).length
  // Le récit compte comme les indicateurs qui le suivent à l'écran : par
  // STATUT. Compter ici les « écarts confirmés » et là les « à vérifier »
  // donnait deux nombres différents pour les mêmes points, à trois centimètres
  // l'un de l'autre.
  const aTraiter = rapprochements.filter((r) => r.statut !== StatutAffiche.CONFORME)
  const critiques = aTraiter.filter((r) => r.statut === StatutAffiche.CRITIQUE).length

  const phrases: string[] = [
    `Le bail impose ${accord(exigees, 'obligation')} d’assurance. ` +
      (couvertes === exigees
        ? 'Les pièces produites les couvrent toutes.'
        : couvertes === 0
          ? 'Aucune n’est démontrée par les pièces produites.'
          : `${accord(couvertes, 'est couverte', 'sont couvertes')} par les pièces produites.`),
  ]

  if (aTraiter.length > 0) {
    const lourd = pointLePlusLourd(dossier)
    phrases.push(
      `${accord(aTraiter.length, 'point appelle', 'points appellent')} une action` +
        (critiques > 0
          ? `, dont ${critiques} qui expose${critiques > 1 ? 'nt' : ''} le preneur`
          : '') +
        (lourd === null ? '.' : `. Le plus lourd : ${lourd}.`),
    )
  } else {
    phrases.push('Rien à négocier, rien à réclamer : le dossier peut être clos.')
  }

  return { phrases, invitation: null }
}
