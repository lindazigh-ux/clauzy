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
| **L1** — import, segmentation, moteur des 40 contrôles, corpus | **terminé** |
| **L2** — poste de travail : édition, rattachement, observation, périmètre | **terminé** |
| **L3** — sauvegarde et rechargement `.clauzy` | **terminé** |
| **L4** — livrable : Word annoté, PDF, synthèse, enjeu chiffré | **terminé** |
| **L5** — suivi d'attestation, export `.ics` | **terminé** |
| L6 → L8 | à venir |

**L1 à L4 forment un outil complet, utilisable seul** (§12).

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

### La sauvegarde `.clauzy` (L3)

`src/domain/dossier/fichier.ts`. Une analyse prend une à deux heures : rien ne
doit dépendre de la durée de vie d'un onglet. Le fichier est écrit et relu
**entièrement dans le navigateur**, puis téléchargé sur le poste — il ne
transite jamais, et `src/lib/net` n'est pas même importé là.

**Le chiffrement est facultatif à dessein.** Un dossier rangé dans un espace de
travail déjà chiffré n'en a pas besoin, et un mot de passe oublié ferait perdre
deux heures de travail — pire que le risque couvert. Quand il est demandé :
PBKDF2-SHA-256 à 600 000 itérations (recommandation OWASP), puis AES-GCM, sel et
vecteur tirés à chaque enregistrement.

Trois choix qui méritent d'être dits :

- **Le fichier en clair porte une empreinte SHA-256.** Elle ne protège pas de la
  falsification — elle détecte la corruption. Un dossier tronqué par une
  messagerie doit se voir à l'ouverture, pas trois clauses plus loin.
- **On ne prétend pas distinguer un mauvais mot de passe d'un fichier altéré.**
  AES-GCM ne le permet pas ; le message le dit plutôt que d'affirmer l'un des
  deux.
- **La migration est un point d'entrée, pas un refus de lire.** Un dossier
  enregistré aujourd'hui doit rester ouvrable dans deux ans : c'est la seule
  sauvegarde du travail du praticien.

Un garde-fou de fermeture prévient tant que le travail n'est pas enregistré.

### Le livrable (L4)

`src/lib/export/` et `src/app/dossier/composants/RapportImprimable.tsx`. C'est ce
que le client achète — soigné davantage que l'interface (§7).

**Word annoté — la fonction signature.** Chaque commentaire est ancré
*nativement* au passage original du bail : le client ouvre le fichier dans Word,
voit la clause encadrée et le conseil en marge, comme si un confrère l'avait
relu. Tout repose sur les offsets conservés depuis la segmentation — **on ne
recolle jamais un commentaire par recherche de texte**, deux clauses d'un bail
pouvant être rigoureusement identiques.

Le plan d'annotation (`annotations.ts`) est **pur** : il ne connaît pas `docx`,
et se vérifie caractère par caractère. Les tests vont plus loin et ouvrent le
`.docx` produit pour relire son OOXML — c'est le fichier remis au client qui
doit être juste, pas la structure intermédiaire. Plages qui se chevauchent et
plages qui franchissent un paragraphe sont couvertes.

**PDF client.** Rendu par la fonction d'impression du navigateur (§3), donc sans
service de conversion : lire et écrire un document ne dépend d'aucun tiers
(§14). Le rapport est un frère du poste de travail dans le DOM, jamais son
enfant — rangé dedans, il disparaîtrait avec lui à l'impression.

Structure imposée par le §7, vérifiée dans les deux sorties : page de garde aux
couleurs du **cabinet** (la marque Clauzy tient en pied de page), périmètre et
limites avec la mention de portée, synthèse autonome, préconisations
**hiérarchisées par enjeu chiffré** puis par gravité, matrice des 40 tous états
confondus, suivi d'attestation.

### Le suivi d'attestation (L5)

`src/domain/dossier/suivi.ts` et `src/lib/export/ics.ts`. Obtenir une
attestation conforme n'est pas un événement, c'est une relance.

**Cinq jalons, tous comptés depuis la date d'envoi de la demande.** Les huit
jours de la première relance ne sont pas arbitraires : c'est le délai que les
baux stipulent le plus souvent, et celui que surveille FOR-01. Suivent une
relance écrite à quinze jours, une escalade à trente, une clôture à
quarante-cinq.

Trois règles :

- **Sans date d'envoi, aucun calendrier.** Le moteur ne devine jamais une date :
  une relance calculée sur une date fausse est pire qu'une relance non calculée.
  La date vient du courriel Outlook importé quand elle y est lisible, et se
  saisit à la main sinon.
- **Renseigner la date d'envoi vaut affirmation que la demande est partie.** Ce
  jalon-là n'a pas à être coché une seconde fois.
- **Aucune relance n'est supposée faite parce que sa date est passée.** Le
  praticien coche ce qu'il a réellement envoyé.

L'export `.ics` porte tous les jalons restants, pas seulement le prochain : un
praticien qui pose un rappel veut poser la suite en même temps. iCalendar est un
format pointilleux — les lignes se plient à 75 **octets** (« é » en pèse deux),
les séparateurs s'échappent, les sauts de ligne sont des CRLF. Un agenda qui
refuse un fichier ne dit jamais pourquoi ; les tests vérifient les trois.

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

### Lacunes de rappel

Le corpus a mis au jour sept rédactions courantes que les motifs d'origine ne
reconnaissaient pas — « Toutes **les** indemnités » (IND-01), « priment » au
lieu de « prévaut » (ART-01), « sous huitaine » (FOR-01)… Elles ont été
arbitrées et les motifs élargis, chaque élargissement vérifié contre les 40 cas
négatifs, qui passent tous.

Ces rédactions vivent désormais dans `VARIANTES_COUVERTES` : si un motif est un
jour resserré pour réduire des faux positifs, c'est là que la perte de rappel
apparaîtra, avec le détail de ce qui cesse d'être reconnu. `LACUNES_CONNUES`
reste en place, vide, pour la prochaine lacune découverte et non encore
arbitrée : consigner vaut mieux que masquer.

### Le poste de travail (L2)

`src/app/dossier/` et `src/domain/dossier/`. Clauzy n'est pas un pipeline
automatique : c'est un outil que la professionnelle reprend à la main avant de
livrer (§6).

Les quatre gestes : **éditer** chaque ligne (analyse, gravité, rédaction
proposée), **rattacher** un passage à un contrôle que le moteur n'a pas trouvé,
**ajouter** une observation hors des 40 contrôles, **renseigner** le périmètre.

Deux décisions structurent le domaine :

- **Les ajustements sont rangés à part de la sortie du moteur.** Une analyse
  prend une à deux heures ; importer une attestation en retard et relancer le
  moteur ne doit jamais effacer ce travail. Le moteur écrit dans `analyse`, le
  praticien dans `ajustements`, et `resultatsAffiches()` compose les deux.
- **Un motif est exigé pour écarter un contrôle ou forcer son état.** Une
  modification manuelle sans motif n'est pas opposable. Le contrôle écarté ne
  disparaît pas pour autant : il reste dans les 40 lignes, marqué « écarté par
  le praticien », motif à l'appui.

Le rattachement manuel fait passer un contrôle de `NON_DETECTE` à `ECART`, et à
`CONFORME` si une pièce est rattachée en regard. C'est le geste qui règle
l'essentiel du problème des baux atypiques **sans toucher au moteur** — ce qui
vaut infiniment mieux qu'élargir un motif et récolter des faux positifs sur
tous les autres dossiers.

---

## Démarrer

```bash
npm install
npm run dev          # http://localhost:3000
```

## Essayer sans rien installer

```bash
npm run demo          # écrit demo/clauzy-demo.html
```

Un **fichier unique, sans serveur** : ouvrez-le dans un navigateur. Il embarque
le produit réel — les 40 contrôles, le moteur, le corpus, le poste de travail et
les deux exports. Deux écarts avec l'application, annoncés à l'écran : l'analyse
tourne sur le fil principal faute de Web Worker dans un bundle unique, et seul
le texte brut s'importe (les lecteurs PDF, Word et Outlook pèsent trop pour être
embarqués).

C'est possible parce que **tout est client-side par construction** : la
démonstration n'est pas une maquette, c'est le code du produit.

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

## Un écart assumé avec le brief

Le §8 fixait une palette violette (`--violet: #6c5ce7`). Elle a été remplacée
par un **vert profond** (`--accent: #0E6B4A`), sur décision explicite : c'est la
couleur des reliures d'actes et des tampons de conformité, et elle place le
produit du côté du dossier juridique.

Les tokens sont donc nommés par leur **rôle** — `--accent`, `--surface`,
`--ligne` — et non par leur teinte : un token nommé « violet » qui porte du vert
ment, et le suivant mentirait encore. `CLAUZY_BUILD.md` conserve le §8 tel quel,
sans correction silencieuse.

Le reste du §8 tient : Newsreader en italique réservé aux citations de clauses,
sentence case, un bouton qui dit ce qui se produit, un état vide qui invite à
agir, une erreur qui dit quoi faire. Une face à chasse fixe (IBM Plex Mono) a
été ajoutée pour les références de contrôle et les chiffres alignés — le §8 n'en
fixait pas, elle comble un manque plutôt qu'elle n'écarte un choix.

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
  app/
    dossier/               poste de travail (§6)
  domain/
    dossier/               état de session, ajustements, composition (§4, §6)
      suivi.ts             cinq jalons de relance (§7, L5)
    moteur/                segmentation, extracteurs, confiance, moteur (§5.3)
    corpus/                corpus synthétique — jamais un document réel (§5.4)
    controles/             référentiel des 40 contrôles (§5) — repris verbatim
      types.ts             Controle, Famille, Nature, Statut, Detecteur
      01-*.ts … 10-*.ts    un fichier par famille
      index.ts             REFERENTIEL, squeletteResultats(), verifierReferentiel()
      referentiel.test.ts  protection de l'actif principal
  lib/
    telechargement.ts      remise d'un fichier au praticien
    analyse/               Web Worker : lecture et analyse (§3)
    export/                Word annoté, plan d'ancrage, calendrier .ics (§7, §14)
    import/                PDF, Word, Outlook — en import dynamique (§3, §13)
    net/                   unique surface réseau (§2)
scripts/
  budget-js.mjs            budget de performance (§3, §14)
tests/
  architecture/            aucun appel réseau hors de src/lib/net
```
