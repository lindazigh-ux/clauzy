# CLAUZY — Brief de construction produit

> Document de référence du projet. À relire à chaque session de travail.
> Les numéros de section (§2, §5.2, §13…) sont cités dans les commentaires du
> code : ils constituent la traçabilité entre une décision produit et son
> implémentation.

---

## 0. Rôle et posture attendue

Tu es l'ingénieur produit principal de Clauzy. Tu construis un logiciel
professionnel destiné à des praticiens de l'assurance d'entreprise, pas une
démo. Trois exigences priment sur la vitesse :

1. **La justesse métier prime sur la performance.** Une analyse fausse détruit
   la valeur du produit.
2. **L'exhaustivité prime sur l'élégance.** Un contrôle qui ne s'affiche pas est
   plus grave qu'un contrôle affiché comme « non détecté ».
3. **La confidentialité est une contrainte d'architecture**, pas une option.

Avant d'écrire du code sur un module, propose un plan court et attends
validation. Ne refactorise jamais le moteur de contrôles sans demander.

---

## 1. Ce qu'est Clauzy

Clauzy réconcilie une obligation contractuelle avec une couverture d'assurance
réellement souscrite, et produit une note de conseil opposable.

Le premier croisement traité est : **bail commercial × programme dommages aux
biens / RC du preneur**. L'architecture doit permettre d'en ajouter d'autres
sans réécriture (voir §11).

Utilisateurs cibles, par ordre de priorité commerciale :

1. Directions immobilières et juridiques d'enseignes multi-sites (côté preneur,
   fort volume)
2. Directions grands comptes de cabinets de courtage (achat par équipe)
3. Property managers, foncières, sociétés de gestion (côté bailleur, conformité
   attestations)
4. Avocats en baux commerciaux, notaires

Le courtier IARD individuel **n'est pas la cible principale**. Ne conçois pas
les parcours pour lui.

Un prototype existe (React + Vite, mono-fichier, 100 % client). Son contenu
métier — 40 contrôles rédigés par une praticienne — est l'actif principal et
doit être repris intégralement. Son architecture est à refaire.

---

## 2. Décision d'architecture centrale : zero-document

C'est le différenciateur commercial du produit. **Elle n'est pas négociable.**

### Ce qui reste strictement dans le navigateur

- le texte intégral du bail, des conditions particulières et générales, des
  avenants
- le contenu des mails Outlook importés
- les extraits de clauses, les citations, les rédactions proposées
- la génération des exports Word et PDF

### Ce qui peut transiter vers le serveur

- identité de l'utilisateur, organisation, abonnement, quotas
- métadonnées de dossier saisies manuellement : référence interne, date, statut
- statistiques strictement anonymes : identifiant de contrôle déclenché,
  gravité, durée d'analyse
- **jamais un extrait de texte, jamais un nom de client, jamais un nom de
  fichier**

### Implémentation obligatoire

- Une couche unique `src/lib/net/` centralise tous les appels réseau. Aucun
  `fetch` ailleurs.
- Un test automatisé échoue si un champ de type `text`, `clause`, `extrait`,
  `citation` ou `nomFichier` apparaît dans un payload sortant. **Écris ce test
  avant les modules d'analyse.**
- Une CSP stricte interdit les connexions vers des domaines non listés.
- Une page `/securite` documente précisément ce comportement, avec le hash du
  build.

Si une fonctionnalité demandée entre en conflit avec cette règle, signale-le et
propose une alternative client-side. **Ne contourne jamais silencieusement.**

---

## 3. Stack

| Couche | Choix | Raison |
| --- | --- | --- |
| Framework | Next.js (App Router), TypeScript strict | SSR pour le site marketing, SEO |
| Analyse | 100 % client-side, dans un Web Worker | Ne jamais bloquer l'UI, isoler le parsing |
| Parsing | `pdfjs-dist`, `mammoth`, `@kenjiuno/msgreader` — tous en import dynamique | Réduire le bundle initial |
| Export Word | `docx` avec commentaires ancrés au passage original | Fonction signature, à préserver |
| Export PDF | rendu print CSS + `window.print()`, ou `pdf-lib` si mise en page complexe | Reste client-side |
| Style | CSS Modules ou Tailwind, tokens imposés au §8 | Pas de librairie UI générique |
| Base | PostgreSQL + Prisma | Métadonnées uniquement |
| Auth | email + mot de passe, magic link, sessions httpOnly | Pas d'OAuth social, public pro |
| Paiement | Stripe, abonnement mensuel et annuel, TVA FR | |
| Tests | Vitest (unitaire), Playwright (E2E) | |
| Analytics | Plausible ou équivalent auto-hébergé, sans cookie | Cohérent avec le positionnement |

**Budget de performance :** moins de 300 Ko JS au premier chargement. Les
moteurs de parsing sont chargés à la demande, jamais dans le bundle initial.
Les polices sont servies en fichiers cachables, jamais en base64.

---

## 4. Modèle de données

### Serveur (Prisma)

```
Organisation   id, nom, siret?, plan, quotaDossiers, creeLe
Utilisateur    id, organisationId, email, hashMotDePasse, role(ADMIN|MEMBRE), nom, creeLe
Abonnement     id, organisationId, stripeCustomerId, stripeSubscriptionId, statut, periodeFin
DossierMeta    id, organisationId, utilisateurId, reference, statut, creeLe, majLe
               -- AUCUN champ de contenu documentaire
EvenementUsage id, organisationId, type, controleId?, gravite?, horodatage
               -- anonyme, agrégé, jamais rattaché à un dossier client
```

### Client (état de session, jamais persisté côté serveur)

```ts
type Dossier = {
  version: 1
  reference: string
  client: { raisonSociale: string; adresse: string; activite: string }
  documents: Document[]          // { id, nom, type, texte, taille }
  emailAttestation?: EmailImporte
  resultats: ResultatControle[]
  observationsLibres: Observation[]
  perimetre: Perimetre           // pièces reçues, manquantes, hypothèses
  majLe: string
}
```

**Sauvegarde locale obligatoire** : bouton « Enregistrer le dossier » qui
télécharge un fichier `.clauzy` (JSON, éventuellement chiffré par mot de passe
via WebCrypto) et bouton de rechargement. Rien ne part sur le serveur. Sans
cela le produit est inutilisable en usage réel : une analyse prend une à deux
heures.

---

## 5. Moteur de contrôles — le cœur

### 5.1 Reprise du contenu existant

Les 40 contrôles du prototype sont à extraire et à restructurer en fichiers
TypeScript typés, un par famille, dans `src/domain/controles/`. Chaque contrôle
porte :

```ts
type Controle = {
  id: string                    // ex. "IND-02", stable, jamais renuméroté
  famille: Famille
  libelle: string
  enjeu: string                 // pourquoi cette clause compte
  consequence: string           // ce que risque le preneur
  actionBail: string            // correction contractuelle prioritaire
  actionAssurance: string       // repli si la négociation échoue
  redactionProposee: string     // texte de clause de remplacement
  preuveCloture: string         // pièce à verser au dossier
  gravite: 1 | 2 | 3
  axes: Axe[]                   // biens, événements, montants, durée,
                                // responsabilités, bénéficiaires, procédures, preuves
  detecteursBail: Detecteur[]
  detecteursAssurance: Detecteur[]
}
```

Les sept familles : `PERIMETRE` (5), `DAB` (5), `RENONCIATION` (4),
`INDEMNITES_PE` (8), `RC_ENVIRONNEMENT` (7), `TRAVAUX` (3),
`ATTESTATIONS_PROCEDURES` (8).

### 5.2 La règle absolue : aucun contrôle ne disparaît

**C'est la correction la plus importante de tout ce brief.**

Dans le prototype, un contrôle dont l'expression régulière ne matche pas
disparaît du rapport. Le lecteur en conclut qu'il n'y a pas de problème. C'est
faux : la clause n'a simplement pas été trouvée. Sur un outil qui touche au
devoir de conseil, c'est un **faux négatif silencieux** — le pire mode de
défaillance possible.

Le moteur renvoie systématiquement les 40 résultats, chacun dans l'un de ces
quatre états :

| État | Signification | Rendu |
| --- | --- | --- |
| `ECART` | Clause trouvée, obligation non soutenue par les pièces | Rouge / ambre selon gravité |
| `CONFORME` | Clause trouvée et soutenue par une pièce identifiée | Vert |
| `ABSENT_DU_BAIL` | Contrôle applicable, aucune clause correspondante dans le bail | Neutre, avec mention |
| `NON_DETECTE` | Le moteur n'a pas su statuer — à vérifier manuellement | Gris, encadré, **jamais masqué** |

L'état `NON_DETECTE` doit être visuellement **saillant, pas discret**. Il
transforme une limite technique en checklist exhaustive et opposable — c'est un
argument de vente, pas un aveu.

Le rapport affiche en tête : « 40 contrôles appliqués — 6 écarts, 21 conformes,
4 sans objet, 9 à vérifier manuellement. »

### 5.3 Détection en couches

1. **Segmentation** du bail en articles et alinéas, avec conservation des
   offsets de caractères (indispensable pour ancrer les commentaires Word).
2. **Détecteurs lexicaux** : les expressions régulières existantes, conservées
   mais enrichies de variantes de rédaction. Chaque détecteur renvoie un score
   de confiance, pas un booléen.
3. **Extracteurs de valeurs** : durées (« vingt-quatre mois », « 24 mois »),
   montants (€, M€, « millions d'euros »), pourcentages, dates. Réutiliser et
   durcir les extracteurs du prototype.
4. **Rapprochement** : confrontation valeur exigée au bail / valeur démontrée
   par la pièce, avec calcul d'écart chiffré quand c'est possible.
5. **Seuil de confiance** : sous le seuil, le résultat bascule en
   `NON_DETECTE`. **Ne jamais deviner.**

Aucun appel à un LLM dans le chemin d'analyse par défaut — ce serait
incompatible avec le §2. Si une assistance IA est ajoutée un jour, elle devra
être explicitement activée, documentée, et ne porter que sur des extraits que
l'utilisateur sélectionne lui-même.

### 5.4 Corpus de test

Constituer 12 à 15 baux de test **rédigés de toutes pièces** couvrant : bail
commerce en centre commercial, bail bureaux, bail logistique, bail atypique
long, bail minimaliste, bail rédigé à l'anglo-saxonne.

**Interdiction absolue** d'utiliser un document client réel, sous quelque forme
que ce soit, y compris anonymisé. Le corpus est synthétique, versionné dans le
dépôt, et sert de non-régression : chaque contrôle a au moins un cas positif et
un cas négatif attendus.

---

## 6. Le poste de travail

Clauzy n'est pas un pipeline automatique. C'est un outil que la professionnelle
reprend à la main avant de livrer. Quatre capacités obligatoires :

1. **Éditer chaque ligne avant export** : reformuler l'analyse, changer la
   gravité, écarter un faux positif (avec motif), réécrire la rédaction
   proposée.
2. **Rattacher une clause manuellement** : sélectionner un passage du bail et le
   relier à un contrôle que le moteur n'a pas trouvé. Ce geste fait passer le
   contrôle de `NON_DETECTE` à `ECART` ou `CONFORME`. Il règle l'essentiel du
   problème des baux atypiques sans toucher au moteur.
3. **Ajouter une observation libre**, hors des 40 contrôles.
4. **Renseigner le périmètre** : pièces reçues, pièces manquantes, contrôles
   sans objet, hypothèses retenues.

Toute modification manuelle est tracée dans le dossier et signalée dans le
rapport (« analyse ajustée par le praticien »).

---

## 7. Le livrable

C'est ce que le client achète. **Le soigner davantage que l'interface.**

Trois exports :

- **Word annoté** — commentaires ancrés nativement au passage original du bail.
  Fonction signature du produit, à préserver absolument.
- **PDF client** — synthèse, matrice, suivi d'attestation.
- **Rappel `.ics`** — prochaine relance compagnie.

Structure imposée du rapport :

1. **Page de garde** aux couleurs de l'organisation utilisatrice, pas de Clauzy.
   Nom du praticien, qualité, client, référence, date. Le client achète une
   analyse, pas un abonnement — la marque Clauzy est discrète, en pied de page.
2. **Périmètre et limites** — pièces reçues, pièces manquantes, contrôles non
   applicables, hypothèses, mention « outil d'aide au conseil, ni avis juridique
   ni garantie de couverture ». C'est la page qui distingue un livrable d'une
   sortie machine, et celle qui protège.
3. **Synthèse d'une page**, autonome, lisible par un décideur qui ne lira pas la
   matrice.
4. **Préconisations hiérarchisées par enjeu chiffré**, pas par gravité
   abstraite. « 12 mois de loyer non financés », « 2,4 M€ de capitaux non
   soutenus », « RC plafonnée 3 M€ contre 8 M€ exigés » — ces montants remontent
   en tête. Un directeur immobilier réagit à un euro, pas à « gravité 3 ».
5. **Matrice complète des 40 contrôles**, tous états confondus.
6. **Suivi d'attestation** et prochaine action datée.

Logique de recommandation à conserver du prototype : **la correction du bail est
toujours prioritaire** ; l'adaptation du programme d'assurance n'est proposée
qu'en second niveau, si la négociation échoue. C'est la thèse du produit, elle
ne doit jamais être inversée.

---

## 8. Design system

Reprendre les tokens du prototype à l'identique — l'identité visuelle est déjà
bonne.

```css
--bg:#fff; --surface:#f7f7fa; --surface-2:#f1f0f7; --card:#fff;
--ink:#15151a; --muted:#696a74; --faint:#91919b;
--line:#e4e4e9; --line-dark:#d1d1d8;
--violet:#6c5ce7; --violet-dark:#5544d4; --violet-soft:#efedff; --violet-pale:#f7f6ff;
--red:#c73f4b; --red-soft:#fff1f2;
--amber:#a76f12; --amber-soft:#fff8e8;
--green:#247a55; --green-soft:#edf8f2;
--blue-gray:#607086; --blue-gray-soft:#f0f3f7;
--sans:"Manrope"; --serif:"Newsreader";
--shadow-sm:0 10px 30px #1f1b3812; --shadow-lg:0 32px 80px #29225824;
```

**Règles :** Newsreader en italique réservé aux citations de clauses et aux
accents de titres. Sentence case partout. Un bouton dit ce qui se produit
(« Exporter la note », pas « Valider »). Les états vides sont des invitations à
agir. Les erreurs disent quoi faire, jamais « une erreur est survenue ».

**Plancher de qualité non négociable :** responsive jusqu'à 360 px, focus
clavier visible, `prefers-reduced-motion` respecté, contrastes AA.

---

## 9. Site marketing

Rendu côté serveur, indexable, distinct de l'application.

**Pages :** accueil, méthode, les 40 contrôles (une page par famille — c'est ton
contenu SEO à forte valeur), livrable, sécurité, tarifs, FAQ, blog, mentions
légales, CGU/CGV, politique de confidentialité, DPA.

**Ce que l'accueil doit faire, dans l'ordre :** nommer le problème (« le bail
promet, la police ne suit pas »), prouver la confidentialité au-dessus de la
ligne de flottaison, montrer un écart réel bail/police, détailler les 40
contrôles, répondre à « pourquoi pas un assistant IA généraliste », afficher les
tarifs, capturer l'email contre un rapport d'exemple.

**Deux entrées de conversion, pas une :** essai libre (jeu de documents
d'exemple, livrable complet en deux minutes, aucune pièce client importée —
c'est le meilleur levier d'activation) et démo réservée pour les comptes équipe.

**Techniques :** Open Graph et Twitter Card complets, favicon, `robots.txt`,
`sitemap.xml`, canonical, JSON-LD `SoftwareApplication` et `FAQPage`.

---

## 10. Abonnement, quotas, conformité

**Plans** (montants à valider commercialement, structure à implémenter) : Essai
(3 dossiers, export filigrané) · Praticien · Cabinet (5 utilisateurs,
bibliothèque de clauses partagée, modèles personnalisés) · Grands comptes (sur
devis, contrôles sur mesure).

**Contrainte particulière :** l'architecture zero-document empêche de
restreindre côté serveur. Le contrôle de licence se fait par jeton signé à durée
courte, vérifié au démarrage de session, avec dégradation en mode démo si
absent. Ne complique pas au-delà : le marché visé ne piratera pas un outil
professionnel qu'il achète pour sa traçabilité.

**Légal à produire :** mentions légales, CGU/CGV avec limitation de
responsabilité explicite, politique de confidentialité, DPA type, page sécurité
technique. Le produit ne peut pas être vendu à une direction juridique sans ces
pièces.

---

## 11. Extensibilité — à préparer, pas à construire

Le modèle de domaine doit être générique dès le départ : **un référentiel
d'obligations confronté à un référentiel de couvertures**. Le bail n'est qu'une
source d'obligations parmi d'autres.

Croisements à venir, par ordre de potentiel :

1. **Contrat de sous-traitance × RC du prestataire** — même mécanique, marché
   beaucoup plus large
2. **Cahier des charges d'appel d'offres × réponses des compagnies** — écart par
   écart
3. **Police N × police N+1 au renouvellement** — c'est le module qui rend le
   revenu récurrent : annuel, obligatoire, tous les clients, pas seulement ceux
   qui signent un bail
4. **Attestations d'un portefeuille × exigences contractuelles** — conformité
   volumique côté bailleur
5. **Cohérences internes d'un programme** — master/local, coassurance, lignes
   excédentaires

Nomme les types `Obligation`, `Couverture`, `Rapprochement` — **jamais**
`ClauseBail` ou `Police`. Le jour où le croisement 3 arrive, aucune réécriture ne
doit être nécessaire.

---

## 12. Phasage

| Lot | Contenu | Critère de sortie |
| --- | --- | --- |
| **L0** | Squelette Next.js, tokens, couche réseau isolée, test anti-fuite écrit en premier | Le test échoue si on tente d'envoyer du texte |
| **L1** | Import local, segmentation, moteur des 40 contrôles avec les 4 états, corpus de test | Un bail synthétique produit 40 résultats, aucun manquant |
| **L2** | Poste de travail : édition, rattachement manuel, observation libre, périmètre | Une analyse complète est ajustable puis exportable |
| **L3** | Sauvegarde et rechargement `.clauzy` | Une analyse survit à la fermeture de l'onglet |
| **L4** | Livrable : Word annoté, PDF, synthèse, hiérarchie par enjeu chiffré | Le rapport est présentable en rendez-vous client |
| **L5** | Suivi d'attestation, export `.ics` | 5 jalons, relance calculée depuis la date d'envoi |
| **L6** | Auth, organisations, Stripe, quotas | Un compte peut s'abonner et être facturé |
| **L7** | Site marketing SSR, pages légales, SEO, analytics | Indexable, partageable, conforme |
| **L8** | Module renouvellement N/N+1 | Deux polices comparées, obligations non soutenues signalées |

**L1 à L4 constituent un outil complet, utilisable seul.** Ne commence pas L6
avant que L1–L4 aient servi à produire au moins trois analyses réelles.

---

## 13. Interdits

- Envoyer un contenu documentaire au serveur, sous quelque prétexte que ce soit
- Masquer un contrôle non détecté
- Utiliser un document client réel comme donnée de test
- Inverser la hiérarchie « corriger le bail d'abord, adapter la police ensuite »
- Présenter une sortie du moteur comme un avis juridique ou une garantie de
  couverture
- Charger un moteur de parsing dans le bundle initial
- Renuméroter un identifiant de contrôle existant

---

## 14. Critères d'acceptation globaux

- Premier chargement sous 300 Ko JS, Lighthouse performance ≥ 90 sur le site
  marketing
- Le test anti-fuite réseau passe en CI et bloque le merge
- Les 40 contrôles ont chacun un cas positif et un cas négatif dans le corpus
  synthétique
- Un rapport exporté en Word conserve chaque commentaire ancré au passage
  original
- L'application est utilisable au clavier seul, du premier import à l'export
- Aucune fonctionnalité ne dépend d'un service tiers pour lire un document
