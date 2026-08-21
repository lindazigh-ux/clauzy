import { describe, it, expect } from 'vitest';
import {
  REFERENTIEL,
  NOMBRE_CONTROLES,
  PAR_ID,
  parFamille,
  squeletteResultats,
  verifierReferentiel,
  estVerifiableParPiece,
  aUnRepliAssurance,
  Famille,
  Nature,
  Statut,
} from './index';

/**
 * Ces tests protègent l'actif principal du produit.
 *
 * Le contenu des contrôles est le fruit d'un travail de praticienne : il ne doit
 * pas se dégrader silencieusement au fil des refactorisations. Toute suppression
 * ou renumérotation doit faire échouer la CI.
 *
 * Le référentiel GRANDIT — la famille des garanties fondamentales lui a été
 * ajoutée après coup, parce qu'aucun contrôle ne portait sur les risques
 * locatifs. Le compte n'est donc plus l'invariant utile : ce qui doit tenir,
 * c'est que les 40 contrôles d'origine soient TOUS encore là, sous leurs
 * identifiants d'origine. C'est ce que vérifie le test ci-dessous, et c'est un
 * garde-fou plus strict qu'un nombre.
 */

/** Les 40 identifiants d'origine. Cette liste ne perd jamais une ligne. */
const REFERENTIEL_ORIGINE = [
  'DOC-01', 'DOC-02', 'DOC-03',
  'DAB-01', 'DAB-02', 'DAB-03', 'DAB-04', 'DAB-05', 'DAB-06', 'DAB-07',
  'RR-01', 'RR-02', 'RR-03', 'RR-04',
  'IND-01', 'IND-02', 'IND-03', 'IND-04',
  'SIN-01', 'SIN-02', 'SIN-03', 'SIN-04',
  'RC-01', 'RC-02', 'RC-03', 'RC-04', 'RC-05',
  'ENV-01', 'ENV-02',
  'TRV-01', 'TRV-02', 'TRV-03',
  'FOR-01', 'FOR-02', 'FOR-03', 'FOR-04', 'FOR-05', 'FOR-06',
  'ART-01', 'ART-02',
] as const;

describe('référentiel — intégrité', () => {
  it('conserve les 40 contrôles d’origine, sous leurs identifiants d’origine', () => {
    expect(REFERENTIEL_ORIGINE).toHaveLength(40);
    for (const id of REFERENTIEL_ORIGINE) {
      expect(PAR_ID.has(id), `${id} a disparu du référentiel`).toBe(true);
    }
  });

  it('compte au moins les 40 d’origine, et son compte est celui du tableau', () => {
    expect(NOMBRE_CONTROLES).toBe(REFERENTIEL.length);
    expect(NOMBRE_CONTROLES).toBeGreaterThanOrEqual(40);
  });

  it('respecte tous ses invariants', () => {
    expect(() => verifierReferentiel()).not.toThrow();
  });

  it('conserve la répartition attendue par famille', () => {
    const attendu: Record<Famille, number> = {
      [Famille.PERIMETRE_DOCUMENTAIRE]: 3,
      [Famille.GARANTIES_FONDAMENTALES]: 5,
      [Famille.DOMMAGES_AUX_BIENS]: 7,
      [Famille.RENONCIATION_RECOURS]: 4,
      [Famille.INDEMNITES]: 4,
      [Famille.SINISTRE_MAJEUR]: 4,
      [Famille.RESPONSABILITE_CIVILE]: 5,
      [Famille.RISQUES_PARTICULIERS]: 2,
      [Famille.TRAVAUX]: 3,
      [Famille.OBLIGATIONS_FORMELLES]: 6,
      [Famille.ARTICULATION_CONTRACTUELLE]: 2,
    };
    for (const [famille, n] of Object.entries(attendu)) {
      expect(parFamille(famille as Famille)).toHaveLength(n);
    }
  });

  /**
   * Verrou de stabilité des identifiants.
   * Ces références sont citées dans des rapports déjà remis à des clients.
   * Si ce test échoue, c'est qu'un identifiant a été renuméroté — ce qui est interdit.
   */
  it('conserve les identifiants publiés', () => {
    for (const id of REFERENTIEL_ORIGINE) {
      expect(PAR_ID.has(id), `identifiant manquant : ${id}`).toBe(true);
    }
    // Le référentiel peut GRANDIR — il ne peut pas perdre une ligne, ni en
    // renuméroter une. On vérifie donc l'inclusion, pas l'égalité : figer
    // l'égalité interdirait d'ajouter le contrôle manquant du jour où l'on
    // s'aperçoit qu'il manque.
    const presents = new Set(REFERENTIEL.map((c) => c.id));
    for (const id of REFERENTIEL_ORIGINE) {
      expect(presents.has(id), `${id} a disparu`).toBe(true);
    }
    // Et aucun doublon : deux contrôles sous le même identifiant rendraient un
    // rapport incompréhensible.
    expect(presents.size).toBe(REFERENTIEL.length);
  });
});

describe('référentiel — cohérence métier', () => {
  it('propose toujours une correction du document source', () => {
    // La thèse du produit : on corrige le contrat d'abord, on adapte la police ensuite.
    for (const c of REFERENTIEL) {
      expect(c.actionSource.trim().length, `${c.id}`).toBeGreaterThan(0);
    }
  });

  it('ne prévoit un repli assurance que là où il existe vraiment', () => {
    // Sur un transfert déséquilibré ou une clause de pure procédure, aucune
    // police ne corrige la rédaction. Le chiffre exact appartient au
    // référentiel d'origine — 19 contrôles sur 40 — et c'est lui qu'on garde
    // sous surveillance : ce que la famille ajoutée y contribue n'a pas à
    // figer une constante de plus.
    const sansRepli = REFERENTIEL.filter((c) => !aUnRepliAssurance(c));
    const sansRepliOrigine = sansRepli.filter((c) =>
      (REFERENTIEL_ORIGINE as readonly string[]).includes(c.id),
    );
    expect(sansRepliOrigine).toHaveLength(19);
    for (const c of sansRepli) {
      expect([Nature.TRANSFERT_BAIL, Nature.FORMALISME], `${c.id}`).toContain(c.nature);
    }
    // Inversement, tout contrôle de croisement doit en proposer un.
    for (const c of REFERENTIEL.filter(estVerifiableParPiece)) {
      expect(aUnRepliAssurance(c), `${c.id}`).toBe(true);
    }
  });

  it('fournit une rédaction de remplacement pour chaque contrôle', () => {
    // Un constat sans texte à envoyer au bailleur n'a pas de valeur en négociation.
    for (const c of REFERENTIEL) {
      expect(c.redactionProposee.trim().length, `${c.id}`).toBeGreaterThan(20);
    }
  });

  it('ne déclare vérifiable par pièce que ce qui l’est réellement', () => {
    for (const c of REFERENTIEL) {
      if (estVerifiableParPiece(c)) {
        expect(c.detecteursCouverture.length, `${c.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('compte au moins un contrôle critique par famille sensible', () => {
    const sensibles = [
      Famille.RENONCIATION_RECOURS,
      Famille.INDEMNITES,
      Famille.RESPONSABILITE_CIVILE,
    ];
    for (const f of sensibles) {
      expect(parFamille(f).some((c) => c.gravite === 3), f).toBe(true);
    }
  });
});

describe('moteur — aucun contrôle ne disparaît', () => {
  /**
   * Le test le plus important du projet.
   *
   * Un contrôle absent du rapport est lu comme « pas de problème », alors que la
   * clause n'a simplement pas été trouvée. Le squelette fixe la longueur du tableau
   * de résultats AVANT toute lecture de document : la disparition devient impossible
   * par construction.
   */
  it('le squelette contient un résultat par contrôle, en NON_DETECTE', () => {
    const s = squeletteResultats();
    expect(s).toHaveLength(NOMBRE_CONTROLES);
    expect(s.every((r) => r.statut === Statut.NON_DETECTE)).toBe(true);
    expect(new Set(s.map((r) => r.controleId)).size).toBe(NOMBRE_CONTROLES);
  });

  it('le squelette couvre exactement les identifiants du référentiel', () => {
    expect(squeletteResultats().map((r) => r.controleId)).toEqual(
      REFERENTIEL.map((c) => c.id),
    );
  });
});

describe('détecteurs — hygiène des motifs', () => {
  it('aucun motif catastrophiquement rétrograde', () => {
    // Garde-fou anti-ReDoS : le parsing tourne dans un Worker mais reste bloquant.
    const suspect = /(\(\?:[^)]*\+\)\+)|(\(\[[^\]]*\]\*\)\*)/;
    for (const c of REFERENTIEL) {
      for (const d of [...c.detecteursObligation, ...c.detecteursCouverture]) {
        expect(suspect.test(d.pattern.source), `${c.id} : ${d.pattern}`).toBe(false);
      }
    }
  });

  it('chaque motif s’exécute en moins de 50 ms sur un texte long', () => {
    const texte = 'le preneur assurera ses biens contre tous risques. '.repeat(4000);
    for (const c of REFERENTIEL) {
      for (const d of [...c.detecteursObligation, ...c.detecteursCouverture]) {
        const t0 = performance.now();
        d.pattern.test(texte);
        expect(performance.now() - t0, `${c.id} : ${d.pattern}`).toBeLessThan(50);
      }
    }
  });
});
