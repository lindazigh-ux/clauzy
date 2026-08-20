# Clauzy

Clauzy réconcilie une obligation contractuelle avec une couverture d'assurance
réellement souscrite, et produit une note de conseil opposable.

Le document de référence du projet est **[`CLAUZY_BUILD.md`](./CLAUZY_BUILD.md)**.
Il fait autorité sur toute décision de conception. Les commentaires du code
citent ses sections (§2, §5.2, §13…) pour garder la trace entre une décision
produit et son implémentation.

---

## État : lot L0 terminé

Le phasage est décrit au §12 du brief.

| Lot | État |
| --- | --- |
| **L0** — squelette, tokens, couche réseau isolée, test anti-fuite | **terminé** |
| L1 — import, segmentation, moteur des 40 contrôles | en attente du contenu métier du prototype |
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

### Ce qui manque pour démarrer L1

Le référentiel des 40 contrôles — l'actif principal du produit — est celui du
prototype React + Vite. **Il n'est pas dans ce dépôt.** Il ne doit pas être
réinventé : un contrôle approximatif est pire qu'un contrôle absent, puisqu'il
engage le devoir de conseil.

`src/domain/controles/index.ts` est donc volontairement vide, et les invariants
qui exigent le contenu apparaissent comme *ignorés* dans la sortie de test —
jamais absents. Ils passeront au vert d'eux-mêmes une fois le contenu importé.

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
    types.ts               Obligation, Couverture, Rapprochement (§11)
    controles/             référentiel des 40 contrôles (§5)
  lib/
    net/                   unique surface réseau (§2)
scripts/
  budget-js.mjs            budget de performance (§3, §14)
tests/
  architecture/            aucun appel réseau hors de src/lib/net
```
