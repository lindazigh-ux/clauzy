/**
 * Rattachement des controles aux garanties.
 *
 * Fichier SEPARE a dessein : le referentiel des 40 controles est repris tel
 * qu'il a ete ecrit par le praticien, et l'on n'y touche pas pour brancher une
 * couche technique. Un identifiant de controle ne se renumerote jamais (§13),
 * et son contenu ne se reecrit pas pour la commodite du moteur.
 *
 * Ce que le rattachement change concretement : la question posee aux pieces
 * d'assurance. Avant, le moteur cherchait dans la police les MOTS du controle
 * — « incendie », « explosion » — et concluait a un ecart quand la police
 * ecrivait « responsabilité locative ». Desormais il cherche la GARANTIE, avec
 * tous ses vocabulaires, et accepte qu'une RC occupant reponde a une exigence
 * de risques locatifs.
 *
 * Un controle sans rattachement n'est pas un oubli : DOC-01 verifie une
 * identite, FOR-01 un delai, ART-01 une hierarchie contractuelle. Aucune
 * garantie ne repond a ces points, et le moteur continue de les trancher sur
 * le document source seul.
 */
import { GARANTIE_PAR_ID } from './nomenclature'

/** Les rattachements reels. Ecrits a plat, un controle par ligne, pour se relire. */
const TABLE: readonly (readonly [string, readonly string[]])[] = [
  // --- Garanties fondamentales ---
  // C'est ici que la question de base se pose : la garantie exigee est-elle
  // souscrite ? Le rapprochement par garantie y est donc decisif.
  ['GAR-01', ['RISQUES_LOCATIFS']],
  ['GAR-02', ['RISQUES_LOCATIFS', 'ASSURANCE_IMMEUBLE_BAILLEUR']],
  ['GAR-03', ['RC_EXPLOITATION']],
  ['GAR-04', ['BRIS_DE_MACHINE']],
  ['GAR-05', ['VALEUR_A_NEUF']],

  // --- Dommages aux biens ---
  ['DAB-01', ['ASSURANCE_IMMEUBLE_BAILLEUR', 'RISQUES_LOCATIFS']],
  ['DAB-02', ['DOMMAGES_BIENS_PRENEUR', 'MOBILIER_MATERIEL_MARCHANDISES', 'AGENCEMENTS_AMENAGEMENTS']],
  // Les evenements exiges par le bail — incendie, explosion, degats des eaux —
  // sont ceux que porte la responsabilite locative. C'est ce controle qui
  // affirmait un ecart a 100 % devant une police disant « responsabilité
  // locative » : il cherchait le mot, pas le risque.
  ['DAB-03', ['RISQUES_LOCATIFS', 'DOMMAGES_BIENS_PRENEUR']],
  ['DAB-04', ['CAPITAUX_ASSURES']],
  ['DAB-05', ['FRANCHISE']],
  ['DAB-06', ['DOMMAGES_BIENS_PRENEUR', 'MOBILIER_MATERIEL_MARCHANDISES']],
  ['DAB-07', ['ASSURANCE_IMMEUBLE_BAILLEUR', 'DOMMAGES_BIENS_PRENEUR', 'AGENCEMENTS_AMENAGEMENTS']],

  // --- Renonciation a recours ---
  ['RR-01', ['RENONCIATION_RECOURS']],
  ['RR-02', ['RENONCIATION_RECOURS']],
  ['RR-03', ['RENONCIATION_RECOURS']],
  ['RR-04', ['RENONCIATION_RECOURS']],

  // --- Indemnites ---
  ['IND-01', ['ASSURANCE_POUR_COMPTE']],
  ['IND-02', ['PERTE_EXPLOITATION']],
  ['IND-03', ['ASSURANCE_POUR_COMPTE']],
  ['IND-04', ['PERTE_LOYERS']],

  // --- Sinistre majeur ---
  ['SIN-01', ['PERTE_EXPLOITATION']],
  ['SIN-03', ['PERTE_EXPLOITATION']],

  // --- Responsabilite civile ---
  ['RC-01', ['RC_EXPLOITATION']],
  ['RC-02', ['RC_EXPLOITATION', 'CAPITAUX_ASSURES']],
  ['RC-03', ['RECOURS_VOISINS_TIERS']],
  ['RC-04', ['RC_EXPLOITATION']],
  ['RC-05', ['RC_EXPLOITATION']],

  // --- Risques particuliers ---
  // La RC exploitation exclut presque toujours l'atteinte a l'environnement :
  // valider une exigence de depollution sur la ligne RC serait un contresens.
  ['ENV-01', ['RC_ATTEINTE_ENVIRONNEMENT']],
  ['ENV-02', ['RC_ATTEINTE_ENVIRONNEMENT']],

  // --- Travaux ---
  ['TRV-01', ['DOMMAGES_OUVRAGE']],
  ['TRV-02', ['TOUS_RISQUES_CHANTIER']],

  // --- Obligations formelles ---
  // FOR-02 confronte l'attestation aux franchises reelles ; FOR-05 a un niveau
  // de couverture impose. Les autres sont de pure procedure.
  ['FOR-02', ['FRANCHISE']],
  ['FOR-05', ['CAPITAUX_ASSURES']],
]

const INDEX: ReadonlyMap<string, readonly string[]> = new Map(TABLE)

/** Les garanties que ce controle interroge. Vide si aucune ne s'applique. */
export const garantiesDe = (controleId: string): readonly string[] =>
  INDEX.get(controleId) ?? []

/** Le controle interroge-t-il une garantie ? Sinon, il se conclut sans pieces. */
export const interrogeUneGarantie = (controleId: string): boolean =>
  garantiesDe(controleId).length > 0

/** Tous les identifiants de garantie cites par la table — pour les tests. */
export const garantiesRattachees = (): readonly string[] => [
  ...new Set(TABLE.flatMap(([, garanties]) => garanties)),
]

/** Un rattachement vers une garantie inconnue casserait le moteur en silence. */
export function verifierRattachements(): void {
  for (const [controleId, garanties] of TABLE) {
    for (const id of garanties) {
      if (!GARANTIE_PAR_ID.has(id)) {
        throw new Error(`${controleId} renvoie vers une garantie inconnue : « ${id} ».`)
      }
    }
  }
}
