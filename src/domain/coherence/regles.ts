import type { Regle } from './types'

/**
 * Les règles de cohérence.
 *
 * Chacune décrit un couple de stipulations qu'un praticien ne laisserait pas
 * passer ensemble. Elles sont écrites au conditionnel — « incohérence
 * potentielle » — parce qu'une rédaction inhabituelle peut les réconcilier :
 * l'outil signale et explique, il ne tranche pas.
 *
 * Les identifiants COH-XX sont STABLES : ils sont cités dans les rapports.
 */
export const REGLES: readonly Regle[] = [
  {
    id: 'COH-01',
    titre: 'Renonciation à recours et responsabilité du bailleur envers le preneur',
    nature: 'CONTRADICTION',
    gravite: 3,
    cherche: 'OBLIGATION',
    premier: {
      pattern:
        /(?:le )?preneur[^.\n\r]{0,120}renonc[a-zéè]*[^.\n\r]{0,80}recours[^.\n\r]{0,80}(?:contre|à l.encontre d[eu])[^.\n\r]{0,30}bailleur/i,
      libelle: 'le preneur renonce à recours contre le bailleur',
    },
    second: {
      pattern:
        /bailleur[^.\n\r]{0,140}(?:assur|garant|souscri)[^.\n\r]{0,140}responsabilit[ée][^.\n\r]{0,80}(?:envers|[àa] l.[ée]gard d[eu])[^.\n\r]{0,30}preneur/i,
      libelle: 'le bailleur doit assurer sa responsabilité envers le preneur',
    },
    explication:
      'Le preneur a renoncé à agir contre le bailleur. La garantie de responsabilité que le bailleur doit souscrire à son égard n’a alors plus d’objet — sauf à ce que la renonciation soit plus étroite que sa rédaction ne le laisse croire. Les deux clauses ne peuvent pas être lues ensemble telles quelles : au sinistre, chacune sera invoquée dans le sens qui arrange celui qui l’invoque.',
    action:
      'Aligner les deux périmètres : soit limiter la renonciation aux seuls dommages assurés, soit retirer l’obligation de garantie devenue sans objet. Ne pas laisser les deux rédactions coexister.',
    baseJuridique:
      'Code des assurances, article L121-12 : la renonciation des parties ne lie l’assureur que s’il y a consenti.',
  },
  {
    id: 'COH-02',
    titre: 'Réciprocité annoncée, renonciation unilatérale',
    nature: 'CONTRADICTION',
    gravite: 3,
    cherche: 'OBLIGATION',
    premier: {
      pattern: /r[ée]ciproqu[a-zéè]*[^.\n\r]{0,120}renonc|renonc[a-zéè]*[^.\n\r]{0,120}r[ée]ciproqu/i,
      libelle: 'une clause annonce une renonciation réciproque',
    },
    second: {
      pattern:
        /(?:le )?preneur renonce[^.\n\r]{0,160}(?:contre|à l.encontre d[eu])[^.\n\r]{0,30}bailleur/i,
      libelle: 'une autre clause ne fait renoncer que le preneur',
      // Une clause qui fait renoncer les DEUX parties n'est pas unilatérale.
      exclut: [
        /bailleur\s+et\s+(?:le\s+)?preneur\s+renoncent/i,
        /renoncent\s+r[ée]ciproquement/i,
        /(?:le\s+)?bailleur\s+renonce/i,
      ],
    },
    explication:
      'Une clause présente la renonciation comme réciproque, une autre ne fait renoncer que le preneur. Le déséquilibre se découvre au moment où le bailleur exerce un recours que le preneur croyait éteint.',
    action:
      'Faire trancher la réciprocité dans une clause unique. Si elle est voulue réciproque, la rédiger comme telle et supprimer la stipulation unilatérale.',
  },
  {
    id: 'COH-03',
    titre: 'Immeuble assuré des deux côtés',
    nature: 'CONTRADICTION',
    gravite: 2,
    cherche: 'OBLIGATION',
    premier: {
      pattern:
        /(?:preneur|locataire)[^.\n\r]{0,120}(?:assur|garant|souscri|prend [àa] sa charge)[^.\n\r]{0,120}(?:l.immeuble|le b[âa]timent|la structure|le clos et le? couvert)/i,
      libelle: 'le preneur doit assurer l’immeuble',
    },
    second: {
      pattern:
        /bailleur[^.\n\r]{0,120}(?:assur|garant|souscri)[^.\n\r]{0,120}(?:l.immeuble|le b[âa]timent|la structure|le clos et le? couvert)/i,
      libelle: 'le bailleur assure également l’immeuble',
    },
    explication:
      'Le même bien se trouve assuré deux fois. Ce n’est pas une sécurité supplémentaire : c’est une prime payée deux fois, une déclaration obligatoire à chaque assureur, et un contentieux de répartition au sinistre.',
    action:
      'Attribuer l’assurance de l’immeuble au bailleur, propriétaire du bien, et limiter l’obligation du preneur à sa responsabilité locative et à ses propres aménagements.',
    baseJuridique:
      'Code des assurances, article L121-4 : les assurances cumulatives doivent être déclarées à chaque assureur.',
  },
  {
    id: 'COH-04',
    titre: 'Obligation absolue et renvoi aux polices',
    nature: 'CONTRADICTION',
    gravite: 2,
    cherche: 'OBLIGATION',
    premier: {
      pattern:
        /(?:les pr[ée]sentes|le pr[ée]sent bail|les stipulations du bail|les clauses du bail)[^.\n\r]{0,100}(?:priment|pr[ée]valent|l.emportent)|par d[ée]rogation [àa] tout[e]? (?:autre )?(?:clause|stipulation|disposition)/i,
      libelle: 'une clause impose la primauté du bail sur tout autre document',
    },
    second: {
      pattern:
        /dans (?:les |la )?limite[s]?[^.\n\r]{0,60}(?:des|de la) police|(?:conditions|limites) (?:et [a-zéè]+ )?(?:des|de la) police[^.\n\r]{0,40}souscrite/i,
      libelle: 'une autre clause subordonne les garanties aux polices souscrites',
    },
    explication:
      'Une clause pose une obligation absolue, une autre la subordonne aux limites des polices. Les deux ne peuvent pas être vraies ensemble : au sinistre, le bailleur invoquera la première et l’assureur la seconde, et le preneur restera au milieu.',
    action:
      'Choisir une hiérarchie et l’écrire : soit les garanties s’entendent dans les limites des polices, soit le bail impose un niveau minimal — auquel cas ce niveau doit être chiffré et assurable.',
  },
  {
    id: 'COH-05',
    titre: 'Renonciation à recours sans engagement des assureurs',
    nature: 'LACUNE',
    gravite: 3,
    cherche: 'COUVERTURE',
    premier: {
      pattern: /renonc[a-zéè]*[^.\n\r]{0,80}recours|recours[^.\n\r]{0,60}renonc/i,
      libelle: 'le bail organise une renonciation à recours',
    },
    second: {
      pattern: /renonc[a-zéè]*[^.\n\r]{0,80}recours|renonciation [àa] recours|subrogatoire/i,
      libelle: 'les pièces d’assurance portent la renonciation de l’assureur',
    },
    explication:
      'La renonciation n’a que la moitié de ses effets. Les parties ont renoncé, mais leurs assureurs n’y sont pas tenus : celui qui indemnise exercera son recours subrogatoire contre la partie qui se croyait protégée. Le bail ne peut pas créer cet engagement — seule la police le peut.',
    action:
      'Obtenir des conditions particulières portant expressément la renonciation à recours de l’assureur au profit de l’autre partie, et vérifier qu’elle couvre le même périmètre de dommages que la clause du bail.',
    baseJuridique:
      'Code des assurances, article L121-12 : l’assureur est subrogé dans les droits de l’assuré ; la renonciation des parties ne le lie que s’il y a consenti.',
  },
]

export const REGLE_PAR_ID: ReadonlyMap<string, Regle> = new Map(
  REGLES.map((regle) => [regle.id, regle]),
)

export const NOMBRE_REGLES = REGLES.length
