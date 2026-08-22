import { Famille, Nature, Responsable, type Controle } from './types';

/**
 * Garanties fondamentales — 5 contrôles
 *
 * AJOUT postérieur au référentiel d'origine, motivé par un défaut constaté :
 * le référentiel des 40 contrôles n'en comportait AUCUN sur les risques
 * locatifs — l'obligation d'assurance la plus fondamentale d'un bail
 * commercial, celle des articles 1732 à 1735 du Code civil.
 *
 * Il vérifiait la rédaction (le bail transfère-t-il trop ?), les montants, les
 * franchises et les procédures. Il ne posait jamais la question de base :
 * la garantie exigée est-elle souscrite ?
 *
 * Les identifiants GAR-XX sont STABLES, comme les autres. Aucun identifiant
 * existant n'a été renuméroté (§13) : cette famille s'ajoute, elle ne
 * remplace rien.
 */
export const GARANTIES_FONDAMENTALES: Controle[] = [
  {
    id: 'GAR-01',
    famille: Famille.GARANTIES_FONDAMENTALES,
    titre: 'Garantie des risques locatifs',
    obligation:
      'Le preneur doit être garanti pour les dommages qu’il cause aux locaux loués — incendie, explosion, dégâts des eaux.',
    nature: Nature.CROISEMENT,
    gravite: 3,
    axes: ['Garantie', 'Montant', 'Périmètre'],
    consequence:
      'Sans cette garantie, le preneur répond des dommages aux locaux sur son propre patrimoine : le Code civil présume sa responsabilité, à lui de prouver l’absence de faute.',
    actionSource:
      'Nommer expressément les risques locatifs dans la clause d’assurance, plutôt que de décrire des événements.',

    actionCouverture:
      'Confirmer la ligne « risques locatifs » ou « responsabilité locative » du tableau de garanties, et son montant au regard de la valeur de reconstruction des locaux loués.',
    redactionProposee:
      'Le Preneur souscrit et maintient une garantie des risques locatifs couvrant les dommages causés aux locaux loués, pour un montant correspondant à leur valeur de reconstruction.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Conditions particulières portant la garantie des risques locatifs et son montant.',
    baseJuridique:
      'Code civil, articles 1732 à 1735 : le preneur répond de l’incendie à moins qu’il ne prouve qu’il s’est produit sans sa faute.',
    detecteursObligation: [
      { pattern: /risques? locatifs?|responsabilit[ée] locative/i, libelle: 'nommée expressément' },
      {
        // La rédaction la plus courante : elle décrit des événements plutôt
        // que de nommer la garantie.
        pattern:
          /(?:assur|garant)[^.\n\r]{0,80}(?:les\s+)?(?:locaux lou[ée]s|lieux lou[ée]s)[^.\n\r]{0,140}(?:incendie|explosion|d[ée]g[âa]ts? des eaux)/i,
        libelle: 'assurer les locaux loués contre l’incendie',
      },
    ],
    detecteursCouverture: [
      { pattern: /risques? locatifs?|responsabilit[ée] locative|responsabilit[ée] civile occupant/i },
    ],
  },
  {
    id: 'GAR-02',
    famille: Famille.GARANTIES_FONDAMENTALES,
    titre: 'Qualification de l’obligation d’assurance des locaux',
    obligation:
      'La clause doit dire si le preneur garantit sa responsabilité locative ou s’il assure l’immeuble du bailleur : ce ne sont pas les mêmes engagements.',
    nature: Nature.TRANSFERT_BAIL,
    gravite: 3,
    axes: ['Qualification', 'Propriétaire', 'Périmètre'],
    consequence:
      'Une rédaction ambiguë se lit dans les deux sens. Au sinistre, le bailleur invoquera la lecture la plus large, et le preneur découvrira qu’il devait assurer un bien dont il n’est pas propriétaire.',
    actionSource:
      'Qualifier expressément l’obligation : « garantie des risques locatifs » plutôt que « assurer les locaux ».',

    // Aucun repli assurance : la correction est exclusivement contractuelle.
    redactionProposee:
      'Le Preneur garantit sa responsabilité locative au titre des locaux loués. L’assurance de l’immeuble, de la structure, du clos et du couvert demeure à la charge du Bailleur.',
    responsable: Responsable.JURIDIQUE,
    preuveCloture: 'Clause qualifiant la nature exacte de l’obligation d’assurance.',
    detecteursObligation: [
      {
        // Une obligation d'assurer les locaux qui ne NOMME pas la garantie :
        // c'est l'ambiguite que ce controle sert a lever.
        //
        // Le sujet n'est plus exige dans le motif : les baux logent souvent
        // l'obligation dans une enumeration — « Le Preneur devra : … c) assurer
        // les locaux loués… » — et « preneur » se trouve alors sur une autre
        // ligne. Cherchant le sujet, le controle ratait la clause.
        pattern:
          /\bassure\w*\s+(?:les\s+)?(?:locaux lou[ée]s|lieux lou[ée]s|biens lou[ée]s|locaux|lieux)\b/i,
        libelle: 'obligation d’assurer « les locaux », sans qualification',
        // Et si la meme stipulation NOMME la garantie, il n'y a plus d'ambiguite
        // a lever : « faire assurer les locaux loués contre les risques
        // locatifs » est une redaction correcte, ancienne mais correcte.
        exclut: [/risques? locatifs?|responsabilit[ée] locative|responsabilit[ée] civile occupant/i],
      },
    ],
    detecteursCouverture: [
      { pattern: /risques? locatifs?|responsabilit[ée] locative/i },
    ],
  },
  {
    id: 'GAR-03',
    famille: Famille.GARANTIES_FONDAMENTALES,
    titre: 'Responsabilité civile exploitation exigée et souscrite',
    obligation:
      'Le preneur doit être garanti pour les dommages causés aux tiers du fait de son activité.',
    nature: Nature.CROISEMENT,
    gravite: 3,
    axes: ['Garantie', 'Montant', 'Activité'],
    consequence:
      'Une activité exercée sans RC exploitation expose le preneur sur son patrimoine, et le bailleur à un preneur insolvable après sinistre.',
    actionSource:
      'Exiger une responsabilité civile exploitation en visant l’activité réellement exercée dans les locaux.',

    actionCouverture:
      'Vérifier que l’activité déclarée à la police correspond à celle du bail, et que le capital est adapté à l’exposition du site.',
    redactionProposee:
      'Le Preneur justifie d’une assurance de responsabilité civile exploitation couvrant les conséquences pécuniaires des dommages causés aux tiers du fait de l’activité exercée dans les locaux.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Attestation portant la garantie RC exploitation, son montant et l’activité déclarée.',
    detecteursObligation: [
      { pattern: /responsabilit[ée] civile (?:exploitation|d.exploitation)|\bRC exploitation\b/i },
      { pattern: /responsabilit[ée] civile[^.\n\r]{0,80}(?:activit[ée]|exploitation|pr[ée]pos[ée]s)/i },
    ],
    detecteursCouverture: [
      { pattern: /responsabilit[ée] civile (?:exploitation|d.exploitation|g[ée]n[ée]rale)|\bRC exploitation\b/i },
    ],
  },
  {
    id: 'GAR-04',
    famille: Famille.GARANTIES_FONDAMENTALES,
    titre: 'Bris de machine et matériel informatique',
    obligation:
      'Lorsque l’activité repose sur des machines ou un parc informatique, leur bris doit être garanti : la garantie dommages aux biens ordinaire ne le couvre pas.',
    nature: Nature.CROISEMENT,
    gravite: 1,
    axes: ['Garantie', 'Matériel', 'Limites'],
    consequence:
      'Un bris interne sans événement extérieur — surtension, erreur de manipulation, casse mécanique — reste à la charge du preneur, machine à l’arrêt comprise.',
    actionSource:
      'Ne pas promettre une garantie « tous dommages » sur le matériel : renvoyer aux garanties effectivement souscrites.',

    actionCouverture:
      'Chiffrer une garantie bris de machine ou tous risques informatiques quand le matériel le justifie.',
    redactionProposee:
      'Le Preneur assure son matériel dans les limites et conditions des polices effectivement souscrites, en ce compris, le cas échéant, une garantie bris de machine.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Garantie bris de machine souscrite, ou renonciation motivée du preneur.',
    detecteursObligation: [
      { pattern: /bris de machines?|tous risques? informatiques?|mat[ée]riel informatique|[ée]quipements? techniques?/i },
    ],
    detecteursCouverture: [
      { pattern: /bris de machines?|tous risques? informatiques?|\bTRI\b|dommages [ée]lectriques/i },
    ],
  },
  {
    id: 'GAR-05',
    famille: Famille.GARANTIES_FONDAMENTALES,
    titre: 'Valeur à neuf et vétusté',
    obligation:
      'Le bail ne doit pas promettre une indemnisation en valeur à neuf que la police ne prévoit pas.',
    nature: Nature.CROISEMENT,
    gravite: 2,
    axes: ['Indemnisation', 'Vétusté', 'Limites'],
    consequence:
      'Une reconstruction promise à neuf, indemnisée vétusté déduite, laisse la différence à la charge de celui qui a signé la promesse.',
    actionSource:
      'Renvoyer aux modalités d’indemnisation de la police plutôt que de stipuler une valeur à neuf inconditionnelle.',

    actionCouverture:
      'Confirmer la clause de valeur à neuf, son plafond et le délai de reconstruction qui la conditionne.',
    redactionProposee:
      'L’indemnisation intervient selon les modalités des polices souscrites, la valeur à neuf s’appliquant dans les limites et conditions qu’elles prévoient.',
    responsable: Responsable.IMMOBILIER_ET_ASSURANCE,
    preuveCloture: 'Modalité d’indemnisation confirmée aux conditions particulières.',
    detecteursObligation: [
      { pattern: /valeur [àa] neuf|sans (?:d[ée]duction de )?v[ée]tust[ée]|reconstruction [àa] neuf/i },
    ],
    detecteursCouverture: [
      // « vétusté déduite » disait l'inverse de « valeur à neuf », et le
      // contrôle le comptait comme une couverture : le bail exigeait le neuf,
      // la police indemnisait la valeur vénale, et le rapport concluait à la
      // conformité. C'est le faux négatif le plus coûteux du référentiel.
      { pattern: /valeur [àa] neuf|reconstruction [àa] neuf|sans (?:d[ée]duction de )?v[ée]tust[ée]/i },
    ],
  },
];
