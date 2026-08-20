# Clauzy

Clauzy réconcilie une obligation contractuelle avec une couverture d'assurance
réellement souscrite, et produit une note de conseil opposable.

Le document de référence du projet est **[`CLAUZY_BUILD.md`](./CLAUZY_BUILD.md)**.
Il fait autorité sur toute décision de conception. Les commentaires du code
citent ses sections (§2, §5.2, §13…) pour garder la trace entre une décision
produit et son implémentation.

---

## État : L0 terminé, référentiel des 40 contrôles intégré

Le phasage est décrit au §12 du brief.

| Lot | État |
| --- | --- |
| **L0** — squelette, tokens, couche réseau isolée, test anti-fuite | **terminé** |
| **L1** — segmentation, moteur des 40 contrôles, corpus | **moteur terminé** ; import de fichiers à brancher |
| L2 → L8 | à venir |

### Ce que L0 met en place

- **Squelette Next.js 16 (App Router) + TypeScript strict.** Deux pages
  prérendues : l'accueil et `/securite`.
- **Les tokens du design system** (§8), repris à l'identique, dans
  `src/app/globals.css`, avec le plancher de qualité : responsive jusqu'à
  360 px, focus clavier visible, `prefers-reduced-motion`.
- **Une couche réseau unique**, `src/lib/net/` — voir
  [son README](./src/lib/net/README.md). Aucun `fetch` ailleurs dans le code.
- **Le test anti-fuite documentaire**, écrit avant tout module d'analyse
  (§2, §12). Il bloque la CI.
- **Une CSP stricte** (`connect-src 'self'`) et les en-têtes de sécurité, dans
  `next.config.ts`.
- **La page `/securite`**, générée depuis le catalogue réel des appels réseau :
  elle ne peut pas se désynchroniser du code, et publie l'empreinte du build.
- **Le modèle de domaine générique** (§11) : `Obligation`, `Couverture`,
  `Rapprochement` — jamais `ClauseBail` ni `Police`.
- **Les quatre états de rapprochement** (§5.2), dont `NON_DETECTE`, et les
  invariants de non-régression du référentiel de contrôles.
- **Le budget de performance** (§3, §14), mesuré et opposable en CI.

### Le référentiel des 40 contrôles

C'est l'actif principal du produit. Il est intégré **verbatim** dans
`src/domain/controles/` — treize fichiers repris à l'octet près, sans
reformatage ni réécriture, y compris leurs tests. Le contenu est le fruit d'un
travail de praticienne : il ne se retouche pas au fil d'une refactorisation.

Ce que le référentiel apporte, au-delà de ce que décrivait le brief :

- **`Nature`** (`CROISEMENT`, `TRANSFERT_BAIL`, `DOUBLE`, `FORMALISME`) — ce
  qu'une pièce d'assurance peut effectivement démontrer. Un contrôle
  `TRANSFERT_BAIL` ou `FORMALISME` se conclut sur le document source seul : le
  moteur ne doit jamais le laisser en `NON_DETECTE` au motif qu'aucune pièce
  d'assurance n'a été fournie.
- **`aUnRepliAssurance()`** — 19 contrôles n'ont pas de repli assurance, et
  c'est une information, pas une lacune. Le rapport affiche
  `MENTION_SANS_REPLI` plutôt qu'une ligne vide, qui serait lue comme un oubli.
- **`squeletteResultats()`** — la garantie *mécanique* du §5.2 : la longueur du
  tableau de résultats est fixée avant toute lecture de document. Un contrôle ne
  peut pas disparaître du rapport, par construction. **Le moteur doit partir de
  ce squelette** et se contenter de faire évoluer les statuts.
- **`verifierReferentiel()`** — invariants levés à la première violation, dont
  le format des identifiants et l'obligation du drapeau `i` sur chaque motif.
- Des tests d'hygiène des détecteurs : garde-fou anti-ReDoS et plafond de 50 ms
  par motif sur un texte long. Le parsing tourne dans un Worker, mais il reste
  bloquant.

### Écarts constatés entre le brief et le référentiel

Le référentiel livré est plus récent que le §5.1 du brief et lui fait autorité
sur le domaine — c'est lui que le produit exécute. `CLAUZY_BUILD.md` est
conservé **verbatim**, sans correction silencieuse. Les écarts, à arbitrer :

| Sujet | Brief §5.1 | Référentiel livré |
| --- | --- | --- |
| Familles | 7 | 10 |
| Répartition | 5 / 5 / 4 / 8 / 7 / 3 / 8 | 3 / 7 / 4 / 4 / 4 / 5 / 2 / 3 / 6 / 2 |
| Champs | `libelle`, `enjeu`, `actionBail`, `actionAssurance` | `titre`, `obligation`, `actionSource`, `actionCouverture?` |
| En plus | — | `nature`, `responsable`, `baseJuridique?` |

Le total reste 40, et le vocabulaire du référentiel est **plus conforme au §11**
que celui du §5.1 : `actionSource` / `actionCouverture` et
`detecteursObligation` / `detecteursCouverture` ne nomment jamais le bail. C'est
la raison pour laquelle il n'existe pas de types `Obligation` / `Couverture`
parallèles : le référentiel porte déjà ce vocabulaire, et un second modèle
dériverait du premier.

### Le moteur

`src/domain/moteur/` — quatre couches, dans l'ordre du §5.3.

**Segmentation** (`segmentation.ts`) — découpe en articles et alinéas. Les
offsets sont **absolus et conservés de bout en bout** : c'est la condition de
l'ancrage natif des commentaires Word au passage original (§7). On ne recolle
pas un commentaire par recherche de texte, deux clauses pouvant être
rigoureusement identiques. Le découpage est prudent : mieux vaut un gros segment
qu'un titre inventé.

**Extracteurs** (`extracteurs.ts`) — durées, montants, pourcentages, dates, en
chiffres comme en toutes lettres. « vingt-quatre (24) mois » est lu, et rejeté
si les deux formes se contredisent. Dans le doute, on n'extrait pas : une valeur
inventée produirait un écart chiffré faux, pire qu'une absence de chiffre.

**Confiance** (`confiance.ts`) — le référentiel ne pondère aucun détecteur : les
40 contrôles s'appuient sur des motifs de poids 1, et 31 n'en ont qu'un seul. Un
score proportionnel serait donc binaire, c'est-à-dire le booléen que le §5.3
interdit. La confiance vient de la **qualité de la preuve** : localisation dans
un article dont l'intitulé correspond, étendue de la correspondance, présence
d'une négation à proximité, corroboration entre articles. Chaque signal est
multiplicatif, borné et **nommé** — le praticien doit pouvoir lire *pourquoi* un
contrôle ressort « à vérifier manuellement ».

**Moteur** (`moteur.ts`) — part de `squeletteResultats()` et fait évoluer les
statuts. Le statut dépend de la `Nature` du contrôle :

| Nature | rien trouvé | trouvé, sans pièce | trouvé, pièce muette | trouvé, pièce probante |
| --- | --- | --- | --- | --- |
| `CROISEMENT` | `ABSENT_DU_BAIL` | `NON_DETECTE` | `ECART` | `CONFORME` |
| `DOUBLE` | `ABSENT_DU_BAIL` | `ECART` | `ECART` | `CONFORME` |
| `TRANSFERT_BAIL` | `ABSENT_DU_BAIL` | `ECART` | `ECART` | `ECART` |
| `FORMALISME` | `ABSENT_DU_BAIL` | `ECART` | `ECART` | `ECART` |

Une règle mérite d'être signalée : **une pièce qui couvre le sujet en deçà de ce
qui est exigé ne vaut pas conformité.** Sans cette comparaison chiffrée, RC-02
ressortirait `CONFORME` parce que la police mentionne la garantie, alors qu'elle
plafonne à 3 M€ contre 8 M€ exigés — c'est l'exemple même du §7, et un faux
positif de conformité est aussi grave qu'un faux négatif.

L'analyse tourne dans un **Web Worker** (`src/lib/analyse/`), avec un repli
direct hors navigateur. Le repli est explicite : `lancerAnalyse()` dit lequel des
deux chemins a servi, pour qu'une régression ne se traduise pas par une
interface gelée sans que personne ne le voie.

### Le corpus synthétique

`src/domain/corpus/` — **aucun document client réel, même anonymisé** (§5.4,
§13). Tout est inventé : enseignes, adresses, montants, références de police.

- `cas.ts` — un cas positif et un cas négatif **par contrôle**, soit 80 clauses
  (§14). Le négatif porte sur le même sujet, rédigé sainement : un négatif hors
  sujet ne prouverait rien. Les clauses sont écrites comme des stipulations que
  la praticienne reconnaîtrait, non comme des appâts à expression régulière —
  sans quoi le corpus ne testerait que lui-même.
- `baux.ts` — six baux complets couvrant les six rédactions nommées au §5.4 :
  centre commercial, bureaux, logistique, atypique long, minimaliste,
  anglo-saxon. Plus deux jeux de conditions particulières, l'un complet, l'autre
  lacunaire. **Le §5.4 en demande 12 à 15** : les six profils sont couverts, il
  reste à en décliner des variantes.

### Lacunes de rappel connues

Le corpus a mis au jour sept rédactions courantes que les motifs actuels ne
reconnaissent pas — « Toutes **les** indemnités » (IND-01), « priment » au lieu
de « prévaut » (ART-01), « sous huitaine » (FOR-01)…

Elles ne sont **pas corrigées** : un motif ne se réécrit pas sans arbitrage, et
un motif élargi produit des faux positifs, qui coûtent plus cher qu'un
`NON_DETECTE`. Elles sont donc consignées dans `LACUNES_CONNUES` et verrouillées
par un test : le jour où un motif est élargi, le test échoue et rappelle de
retirer l'entrée. Une lacune connue et tracée vaut mieux qu'une lacune ignorée.

---

## Démarrer

```bash
npm install
npm run dev          # http://localhost:3000
```

## Vérifier

```bash
npm run verifier          # types + tests + lint
npm run verifier:complet  # + build + budget de performance
```

| Commande | Ce qu'elle vérifie |
| --- | --- |
| `npm test` | L'ensemble des tests (Vitest) |
| `npx vitest run src/lib/net tests/architecture` | Le seul test anti-fuite — c'est la barrière qui bloque la fusion (§14) |
| `npm run typecheck` | TypeScript strict, sans émission |
| `npm run lint` | ESLint, dont l'interdiction de `fetch` hors de `src/lib/net` |
| `npm run budget` | Moins de 300 Ko de JS au premier chargement, et aucun moteur de parsing dans le bundle initial (§3, §13) — exige un `npm run build` préalable |

---

## Les trois règles à ne pas enfreindre

1. **Aucun contenu documentaire ne quitte le navigateur** (§2, §13). Si une
   fonctionnalité l'exige, signalez le conflit et proposez une alternative
   client — ne contournez jamais silencieusement la couche `src/lib/net`.
2. **Aucun contrôle ne disparaît d'un rapport** (§5.2). Un contrôle que le
   moteur ne sait pas trancher s'affiche `NON_DETECTE`, de façon saillante.
3. **Aucun document client réel comme donnée de test** (§5.4, §13), y compris
   anonymisé. Le corpus est synthétique et versionné.

---

## Conventions

- **Le texte destiné à l'utilisateur est en français typographique** — accents,
  apostrophes courbes, espaces insécables là où elles comptent. C'est un produit
  vendu à des directions juridiques : la copie fait partie du livrable (§8).
- **Les commentaires de code sont en ASCII**, sans accents. Choix délibéré et
  uniforme, pour rester lisible quel que soit l'outillage ; il ne s'applique
  jamais aux chaînes affichées.
- **Chaque décision non évidente cite sa section du brief.** Un commentaire
  `(brief §5.2)` vaut mieux qu'un paragraphe d'explication : il renvoie à la
  source qui fait autorité.
- **Le vocabulaire du domaine est en français** (`Obligation`, `Couverture`,
  `Rapprochement`, `Perimetre`), le vocabulaire technique reste conventionnel.

---

## Structure

```
CLAUZY_BUILD.md            le brief — document de référence
src/
  app/                     pages Next.js (App Router)
    globals.css            tokens du design system (§8)
    securite/              page /securite (§2)
  domain/
    moteur/                segmentation, extracteurs, confiance, moteur (§5.3)
    corpus/                corpus synthétique — jamais un document réel (§5.4)
    controles/             référentiel des 40 contrôles (§5) — repris verbatim
      types.ts             Controle, Famille, Nature, Statut, Detecteur
      01-*.ts … 10-*.ts    un fichier par famille
      index.ts             REFERENTIEL, squeletteResultats(), verifierReferentiel()
      referentiel.test.ts  protection de l'actif principal
  lib/
    analyse/               Web Worker d'analyse (§3)
    net/                   unique surface réseau (§2)
scripts/
  budget-js.mjs            budget de performance (§3, §14)
tests/
  architecture/            aucun appel réseau hors de src/lib/net
```
