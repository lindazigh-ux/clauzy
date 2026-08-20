import { Famille, Nature, Statut, type Controle } from './types';

import { PERIMETRE_DOCUMENTAIRE } from './01-perimetre-documentaire';
import { DOMMAGES_AUX_BIENS } from './02-dommages-aux-biens';
import { RENONCIATION_RECOURS } from './03-renonciation-recours';
import { INDEMNITES } from './04-indemnites';
import { SINISTRE_MAJEUR } from './05-sinistre-majeur';
import { RESPONSABILITE_CIVILE } from './06-responsabilite-civile';
import { RISQUES_PARTICULIERS } from './07-risques-particuliers';
import { TRAVAUX } from './08-travaux';
import { OBLIGATIONS_FORMELLES } from './09-obligations-formelles';
import { ARTICULATION_CONTRACTUELLE } from './10-articulation-contractuelle';

/**
 * Référentiel complet — 40 contrôles.
 *
 * L'ordre de ce tableau est l'ordre de lecture de la matrice dans le rapport :
 * on part du périmètre documentaire (qui conditionne tout le reste), on descend
 * vers les garanties, puis vers les procédures.
 */
export const REFERENTIEL: readonly Controle[] = Object.freeze([
  ...PERIMETRE_DOCUMENTAIRE,
  ...DOMMAGES_AUX_BIENS,
  ...RENONCIATION_RECOURS,
  ...INDEMNITES,
  ...SINISTRE_MAJEUR,
  ...RESPONSABILITE_CIVILE,
  ...RISQUES_PARTICULIERS,
  ...TRAVAUX,
  ...OBLIGATIONS_FORMELLES,
  ...ARTICULATION_CONTRACTUELLE,
]);

export const NOMBRE_CONTROLES = REFERENTIEL.length;

export const PAR_ID: ReadonlyMap<string, Controle> = new Map(
  REFERENTIEL.map((c) => [c.id, c]),
);

export function controle(id: string): Controle {
  const c = PAR_ID.get(id);
  if (!c) throw new Error(`Contrôle inconnu : ${id}`);
  return c;
}

export function parFamille(famille: Famille): Controle[] {
  return REFERENTIEL.filter((c) => c.famille === famille);
}

/**
 * Un contrôle est vérifiable par pièce lorsqu'une preuve d'assurance peut,
 * à elle seule, faire basculer le statut vers CONFORME.
 *
 * Les contrôles TRANSFERT_BAIL et FORMALISME ne le sont pas : le défaut vient de la
 * rédaction, aucune police ne le corrige. Le moteur ne doit donc jamais les laisser
 * en NON_DETECTE au seul motif qu'aucune pièce d'assurance n'a été fournie —
 * ils se concluent sur le document source seul.
 */
export function estVerifiableParPiece(c: Controle): boolean {
  return c.nature === Nature.CROISEMENT || c.nature === Nature.DOUBLE;
}

/**
 * Existe-t-il un repli côté assurance si la négociation contractuelle échoue ?
 *
 * Faux sur 19 contrôles. Le rapport doit alors afficher explicitement
 * « aucun repli assurance — la correction est exclusivement contractuelle »
 * plutôt qu'une ligne vide, qui serait lue comme un oubli.
 */
export function aUnRepliAssurance(c: Controle): boolean {
  return Boolean(c.actionCouverture?.trim());
}

export const MENTION_SANS_REPLI =
  'Aucun repli assurance : la correction est exclusivement contractuelle.';

/**
 * Squelette de résultats vierge.
 *
 * Le moteur DOIT partir de ce squelette et se contenter de faire évoluer les statuts.
 * C'est la garantie mécanique qu'aucun contrôle ne peut disparaître du rapport :
 * la longueur du tableau de résultats est fixée avant même la lecture du bail.
 */
export function squeletteResultats() {
  return REFERENTIEL.map((c) => ({
    controleId: c.id,
    statut: Statut.NON_DETECTE,
    confiance: 0,
    extraitsObligation: [],
    extraitsCouverture: [],
  }));
}

/**
 * Invariants du référentiel. Appelé par les tests et au démarrage en développement.
 * Lève à la première violation — un référentiel incohérent ne doit pas produire de rapport.
 */
export function verifierReferentiel(): void {
  const vus = new Set<string>();
  for (const c of REFERENTIEL) {
    if (vus.has(c.id)) throw new Error(`Identifiant dupliqué : ${c.id}`);
    vus.add(c.id);

    if (!/^[A-Z]{2,4}-\d{2}$/.test(c.id)) {
      throw new Error(`Identifiant hors format : ${c.id}`);
    }
    for (const champ of [
      'titre',
      'obligation',
      'consequence',
      'actionSource',
      'redactionProposee',
      'preuveCloture',
    ] as const) {
      if (!c[champ] || !String(c[champ]).trim()) {
        throw new Error(`${c.id} : champ « ${champ} » vide`);
      }
    }
    if (![1, 2, 3].includes(c.gravite)) {
      throw new Error(`${c.id} : gravité invalide`);
    }
    if (c.axes.length === 0) {
      throw new Error(`${c.id} : aucun axe de comparaison`);
    }
    if (c.detecteursObligation.length === 0) {
      throw new Error(`${c.id} : aucun détecteur sur le document source`);
    }
    // Un contrôle de croisement sans repli assurance est très probablement une omission.
    if (estVerifiableParPiece(c) && !aUnRepliAssurance(c)) {
      throw new Error(
        `${c.id} : contrôle de croisement sans action assurance — omission probable`,
      );
    }
    if (estVerifiableParPiece(c) && c.detecteursCouverture.length === 0) {
      throw new Error(
        `${c.id} : contrôle de croisement sans détecteur de couverture — ` +
          `il ne pourra jamais atteindre CONFORME`,
      );
    }
    for (const d of [...c.detecteursObligation, ...c.detecteursCouverture]) {
      if (!d.pattern.flags.includes('i')) {
        throw new Error(`${c.id} : détecteur sans le drapeau « i »`);
      }
    }
  }
}

export * from './types';
export {
  PERIMETRE_DOCUMENTAIRE,
  DOMMAGES_AUX_BIENS,
  RENONCIATION_RECOURS,
  INDEMNITES,
  SINISTRE_MAJEUR,
  RESPONSABILITE_CIVILE,
  RISQUES_PARTICULIERS,
  TRAVAUX,
  OBLIGATIONS_FORMELLES,
  ARTICULATION_CONTRACTUELLE,
};
