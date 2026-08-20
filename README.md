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
| **L1** — import, segmentation, moteur des 40 contrôles | référentiel intégré ; moteur à écrire |
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

### Prochaine étape — le moteur (L1)

Il reste à écrire : la segmentation du bail en articles et alinéas avec
conservation des offsets, les extracteurs de valeurs (durées, montants,
pourcentages, dates), le rapprochement et le seuil de confiance, le tout dans un
Web Worker. Plus le corpus synthétique de 12 à 15 baux (§5.4) — **jamais un
document client réel, même anonymisé.**

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
    controles/             référentiel des 40 contrôles (§5) — repris verbatim
      types.ts             Controle, Famille, Nature, Statut, Detecteur
      01-*.ts … 10-*.ts    un fichier par famille
      index.ts             REFERENTIEL, squeletteResultats(), verifierReferentiel()
      referentiel.test.ts  protection de l'actif principal
  lib/
    net/                   unique surface réseau (§2)
scripts/
  budget-js.mjs            budget de performance (§3, §14)
tests/
  architecture/            aucun appel réseau hors de src/lib/net
```
