/**
 * Référentiel de contrôles Clauzy — types du domaine
 *
 * Vocabulaire volontairement générique : un contrôle confronte une OBLIGATION
 * (issue d'un document source) à une COUVERTURE (issue d'une pièce d'assurance).
 * Le bail commercial n'est qu'une source d'obligations parmi d'autres — un contrat
 * de sous-traitance ou un cahier des charges d'appel d'offres se branchent sur les
 * mêmes types sans réécriture.
 *
 * NE JAMAIS renommer en `ClauseBail` / `Police`.
 */

// ---------------------------------------------------------------------------
// Taxonomie
// ---------------------------------------------------------------------------

export enum Famille {
  PERIMETRE_DOCUMENTAIRE = 'PERIMETRE_DOCUMENTAIRE',
  /**
   * AJOUT : le referentiel d'origine ne posait jamais la question de base —
   * la garantie exigee est-elle souscrite ? Il verifiait la redaction, les
   * montants et les procedures, mais aucun controle ne portait sur les risques
   * locatifs, l'obligation d'assurance la plus fondamentale d'un bail.
   */
  GARANTIES_FONDAMENTALES = 'GARANTIES_FONDAMENTALES',
  DOMMAGES_AUX_BIENS = 'DOMMAGES_AUX_BIENS',
  RENONCIATION_RECOURS = 'RENONCIATION_RECOURS',
  INDEMNITES = 'INDEMNITES',
  SINISTRE_MAJEUR = 'SINISTRE_MAJEUR',
  RESPONSABILITE_CIVILE = 'RESPONSABILITE_CIVILE',
  RISQUES_PARTICULIERS = 'RISQUES_PARTICULIERS',
  TRAVAUX = 'TRAVAUX',
  OBLIGATIONS_FORMELLES = 'OBLIGATIONS_FORMELLES',
  ARTICULATION_CONTRACTUELLE = 'ARTICULATION_CONTRACTUELLE',
}

export const LIBELLE_FAMILLE: Record<Famille, string> = {
  [Famille.PERIMETRE_DOCUMENTAIRE]: 'Périmètre documentaire',
  [Famille.GARANTIES_FONDAMENTALES]: 'Garanties fondamentales',
  [Famille.DOMMAGES_AUX_BIENS]: 'Dommages aux biens',
  [Famille.RENONCIATION_RECOURS]: 'Renonciation à recours',
  [Famille.INDEMNITES]: 'Indemnités',
  [Famille.SINISTRE_MAJEUR]: 'Sinistre majeur',
  [Famille.RESPONSABILITE_CIVILE]: 'Responsabilité civile',
  [Famille.RISQUES_PARTICULIERS]: 'Risques particuliers',
  [Famille.TRAVAUX]: 'Travaux',
  [Famille.OBLIGATIONS_FORMELLES]: 'Obligations formelles',
  [Famille.ARTICULATION_CONTRACTUELLE]: 'Articulation contractuelle',
};

/**
 * Nature du contrôle — détermine ce qu'une pièce d'assurance peut démontrer.
 *
 * CROISEMENT     : l'écart n'apparaît qu'en confrontant l'obligation à la couverture.
 *                  Sans pièce d'assurance, le contrôle reste NON_DETECTE.
 * TRANSFERT_BAIL : le défaut vient de la rédaction elle-même. Une police ne peut pas
 *                  rendre souhaitable un transfert déséquilibré — la correction est
 *                  contractuelle, la pièce d'assurance n'est pas nécessaire pour conclure.
 * DOUBLE         : le défaut est visible dans la rédaction ET s'aggrave au croisement.
 * FORMALISME     : procédure, délais, sanctions. Aucune pièce d'assurance ne le couvre.
 */
export enum Nature {
  CROISEMENT = 'CROISEMENT',
  TRANSFERT_BAIL = 'TRANSFERT_BAIL',
  DOUBLE = 'DOUBLE',
  FORMALISME = 'FORMALISME',
}

export enum Responsable {
  IMMOBILIER = 'IMMOBILIER',
  IMMOBILIER_ET_ASSURANCE = 'IMMOBILIER_ET_ASSURANCE',
  JURIDIQUE = 'JURIDIQUE',
}

export const LIBELLE_RESPONSABLE: Record<Responsable, string> = {
  [Responsable.IMMOBILIER]: 'Immobilier',
  [Responsable.IMMOBILIER_ET_ASSURANCE]: 'Immobilier + assurance',
  [Responsable.JURIDIQUE]: 'Juridique',
};

/** 3 = critique · 2 = à négocier · 1 = point de vigilance */
export type Gravite = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Détection
// ---------------------------------------------------------------------------

export type Detecteur = {
  /** Motif appliqué au texte segmenté. Insensible à la casse. */
  pattern: RegExp;
  /**
   * Poids dans le score de confiance. 1 par défaut.
   * Un motif large et générique doit être pondéré à la baisse pour éviter
   * qu'un match faible ne produise un ECART affirmé à tort.
   */
  poids?: number;
  /** Libellé lisible, affiché dans l'outil de mise au point du moteur. */
  libelle?: string;
};

// ---------------------------------------------------------------------------
// Contrôle
// ---------------------------------------------------------------------------

export type Controle = {
  /**
   * Identifiant stable, cité dans les rapports remis aux clients.
   * NE JAMAIS renuméroter, même après suppression d'un contrôle.
   */
  id: string;
  famille: Famille;
  /** Intitulé court affiché en tête de ligne dans la matrice. */
  titre: string;
  /** Ce que la clause doit faire — l'enjeu, formulé positivement. */
  obligation: string;
  nature: Nature;
  gravite: Gravite;
  /** Dimensions de comparaison mobilisées (Durée, Montant, Périmètre…). */
  axes: string[];
  /** Ce que risque concrètement le preneur si l'obligation n'est pas tenue. */
  consequence: string;
  /** Correction prioritaire, côté document source. Toujours proposée en premier. */
  actionSource: string;
  /**
   * Repli côté assurance, uniquement si la négociation contractuelle échoue.
   *
   * ABSENT sur 19 contrôles, et c'est une information, pas une lacune : sur un défaut
   * de nature TRANSFERT_BAIL ou FORMALISME, aucune police ne rend souhaitable un
   * transfert déséquilibré. La correction est exclusivement contractuelle, et le
   * rapport doit le dire explicitement plutôt que de laisser la case vide.
   */
  actionCouverture?: string;
  /** Texte de clause de remplacement à transmettre. */
  redactionProposee: string;
  responsable: Responsable;
  /** Pièce à verser au dossier pour clore le point. */
  preuveCloture: string;
  /** Renvoi textuel, quand une disposition légale conditionne l'analyse. */
  baseJuridique?: string;
  detecteursObligation: Detecteur[];
  detecteursCouverture: Detecteur[];
};

// ---------------------------------------------------------------------------
// Résultat
// ---------------------------------------------------------------------------

/**
 * RÈGLE ABSOLUE DU MOTEUR : le rapport renvoie TOUJOURS un résultat par contrôle.
 *
 * Le référentiel peut grandir ; le tableau de résultats suit, et un contrôle qui
 * n'a pas matché ne disparaît jamais — il ressort en NON_DETECTE.
 * Un contrôle absent du rapport est lu comme « pas de problème », ce qui est faux :
 * la clause n'a simplement pas été trouvée. C'est un faux négatif silencieux, et
 * c'est le pire mode de défaillance possible sur un outil qui touche au devoir de conseil.
 */
export enum Statut {
  /** Obligation trouvée, non soutenue par les pièces produites. */
  ECART = 'ECART',
  /** Obligation trouvée et soutenue par une pièce identifiée. */
  CONFORME = 'CONFORME',
  /** Contrôle applicable, aucune clause correspondante dans le document source. */
  ABSENT_DU_BAIL = 'ABSENT_DU_BAIL',
  /** Le moteur n'a pas su statuer. À vérifier manuellement. Jamais masqué. */
  NON_DETECTE = 'NON_DETECTE',
}

export const LIBELLE_STATUT: Record<Statut, string> = {
  [Statut.ECART]: 'Écart détecté',
  [Statut.CONFORME]: 'Conforme',
  [Statut.ABSENT_DU_BAIL]: 'Absent du bail',
  [Statut.NON_DETECTE]: 'À vérifier manuellement',
};

/** Origine du statut : le praticien doit pouvoir distinguer moteur et main humaine. */
export enum Origine {
  MOTEUR = 'MOTEUR',
  /** Clause rattachée à la main par le praticien. */
  RATTACHEMENT_MANUEL = 'RATTACHEMENT_MANUEL',
  /** Statut ou rédaction modifiés à la main, avec motif. */
  AJUSTEMENT_MANUEL = 'AJUSTEMENT_MANUEL',
}

export type Extrait = {
  /** Texte cité verbatim. Ne quitte jamais le navigateur. */
  texte: string;
  documentId: string;
  /** Offsets de caractères — indispensables pour ancrer les commentaires Word. */
  debut: number;
  fin: number;
};

export type ResultatControle = {
  controleId: string;
  statut: Statut;
  origine: Origine;
  /** 0 à 100. Sous le seuil configuré, le statut bascule en NON_DETECTE. */
  confiance: number;
  extraitsObligation: Extrait[];
  extraitsCouverture: Extrait[];
  /** Écart chiffré quand il est calculable : « 24 mois exigés · 12 mois soutenus ». */
  resumeEcart?: string;
  /** Analyse rédigée, éditable par le praticien avant export. */
  analyse?: string;
  /** Motif obligatoire lorsque origine ≠ MOTEUR. */
  motifAjustement?: string;
};
