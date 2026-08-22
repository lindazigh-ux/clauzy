# Clauzy — brief directeur

> Ce document remplace toute direction antérieure. `CLAUZY_BUILD.md` reste la
> spécification d'origine du produit et du référentiel ; le présent document
> fixe la **direction de travail** à partir d'ici, et prime en cas de
> divergence.
>
> Règle de conduite : travailler **par lots à l'intérieur de cette direction**.
> Ne pas ouvrir de périmètre non demandé ici. À la fin de chaque lot, produire
> le compte rendu du §45 et **attendre validation** avant d'élargir.

---

## 0. Objectif produit

La proposition de valeur du MVP :

```
Bail → obligations assurantielles → risques → garanties attendues
     → contrat → attestation → niveau de preuve → écart éventuel → action
```

Clauzy n'est pas un lecteur de PDF. C'est un **moteur de confrontation des
obligations assurantielles**. Sa valeur vient de sa capacité à comprendre que
des formulations juridiques et assurantielles différentes désignent le même
risque.

Le cas fondateur :

- Bail : « Le Preneur devra assurer les locaux loués contre l'incendie,
  l'explosion et les dégâts des eaux. »
- Police : « Garantie responsabilité locative — 1 500 000 € par sinistre. »

Clauzy doit y voir des **risques locatifs** et ne jamais produire de faux écart
au seul motif que les mots diffèrent.

## 1. Périmètre du MVP

**Analyse du bail seul** — quelles obligations d'assurance ce bail impose-t-il ?
Risques locatifs, assurance de l'immeuble du bailleur, recours des voisins et
des tiers, RC exploitation, biens propres du preneur, agencements et
embellissements, mobilier/matériel/marchandises, pertes d'exploitation, pertes
de loyers, renonciations à recours, assurance pour compte, capitaux assurés,
franchises, valeur à neuf, obligations documentaires, transferts de risque
anormaux, contradictions entre clauses.

**Analyse bail × contrat** — le programme répond-il aux obligations ? Chaque
point suit la chaîne : clause → obligation → risque → garantie attendue →
garantie retrouvée → niveau de preuve → conclusion → action.

**Attestation** — troisième source. Elle ne remplace jamais le contrat. Une
garantie présente au contrat et absente de l'attestation donne « couverture
existante, justification insuffisante », jamais « écart ».

## 2. Hors périmètre

Déménagement, flotte automobile, CRM, marketplace assureurs, comparaison
tarifaire, relance commerciale, gestion de portefeuille, sous-traitance, autres
contrats commerciaux, analyse juridique générale, application client finale,
scoring commercial, nouvelles verticales. À conserver en backlog, sans
influence sur le MVP.

## 3. Référentiel figé

Le référentiel est assez riche pour la phase de validation. Avant toute
création future : vérifier que le besoin n'est pas déjà couvert, qu'il est
fréquent, qu'il a un impact assurantiel significatif, et qu'il exige réellement
une confrontation bail × assurance.

**Le nombre de contrôles n'est pas un KPI.** 45 fiables valent mieux que 80
médiocres. Aucun identifiant existant n'est jamais renuméroté.

## 4. Modèle de raisonnement unique

```
source → obligation → risque → garantie → couverture → preuve → gravité
       → action → conclusion
```

Ces notions restent **distinctes**.

## 5. Axe 1 — niveau de preuve

| Niveau | Sens |
| --- | --- |
| `ETABLIE` | Le document produit démontre suffisamment la couverture. |
| `PROBABLE` | Une garantie plus large semble répondre ; confirmation nécessaire. |
| `NON_DEMONTREE` | Clauzy n'a pas les éléments pour conclure. Ce n'est pas une absence de garantie. |
| `JUSTIFICATION_INSUFFISANTE` | Couverture établie au contrat, mal démontrée par la pièce destinée au tiers. |
| `ECART_CONFIRME` | Les pièces permettent de conclure que l'obligation n'est pas satisfaite. |

## 6. Axe 2 — gravité métier

Totalement **indépendant** du niveau de preuve.

`CRITIQUE` · `IMPORTANTE` · `MODEREE` · `INFORMATION`

## 7. Axe 3 — action recommandée

Troisième axe **indépendant**, en énumération fermée :

`AUCUNE_ACTION` · `VERIFIER` · `DEMANDER_PIECE` · `DEMANDER_ATTESTATION`
· `ADAPTER_CONTRAT` · `NEGOCIER_CLAUSE` · `OBTENIR_ACCORD_ASSUREUR`
· `VALIDATION_HUMAINE`

« À négocier » n'est jamais une gravité. C'est une action.

## 8. Affichage utilisateur

L'interface synthétise les trois axes : 🟢 Conforme · 🟠 À vérifier ·
🟡 À négocier · 🔴 Critique · 🔵 Information. Ces statuts d'affichage ne
remplacent jamais les données internes.

## 9. Recommandations métier

Aucune recommandation générique répétée partout. L'action dépend du **type de
garantie + nature de l'écart + preuve + gravité**.

## 10. Contradictions

Toujours afficher : clause A (extrait exact), clause B (extrait exact),
pourquoi Clauzy alerte, niveau de confiance, action. Ne jamais résoudre une
contradiction en silence.

## 11. Sécurité du raisonnement

Mieux vaut demander une vérification que produire une fausse conformité. Mais
éviter aussi les faux positifs inutiles. Ne jamais transformer une absence
d'information en absence de couverture. Distinguer : absent · non démontré ·
probable · confirmé.

## 12–14. Golden Dataset, 50 cas, métriques

Après stabilisation du moteur, **arrêter l'ajout de fonctionnalités**. Construire
un Golden Dataset indépendant du moteur : pour chaque dossier, l'attendu est
écrit **avant** exécution, puis figé. Toute modification ultérieure de l'attendu
est documentée et historisée.

Passer progressivement de 10 à 50 dossiers réellement variés (bail simple, bail
long, clauses imbriquées, formulations anciennes, synonymes assureurs, garantie
englobante, couverture partielle, plafond insuffisant, franchises, exclusions,
attestation partielle, contrat absent, bail muet, contradictions, faux amis
lexicaux, négations, exceptions, renonciations complexes…).

Produire des **métriques métier**, pas « les tests passent » : précision et
rappel sur la détection d'obligations, taux de bonne classification des
garanties et taux de confusion, exactitude du niveau de preuve, part des
conclusions rattachées à la bonne stipulation — *une conclusion correcte avec
une mauvaise source reste une erreur* — et taux de recommandations jugées
adaptées.

## 15–16. Dossiers réels et objectif de validation

Préparer la réception de dossiers réels anonymisés avec analyse humaine
indépendante. Aucun document réel au dépôt sans politique d'anonymisation
claire. Clauzy ne doit pas connaître les réponses à l'avance.

La question n'est pas « combien de fonctionnalités ? » mais : **sur 100
obligations réelles, combien Clauzy comprend-il correctement, et combien de
situations critiques manque-t-il ?**

## 17–39. Refonte frontend

Le moteur devient sérieux ; le frontend ne le reflète pas. **Ne pas toucher au
moteur pour refaire le frontend.** Réutiliser les données existantes.

Cible : un SaaS B2B premium pour courtiers IARD entreprises. S'inspirer de
Linear, Attio, Stripe — de leur hiérarchie, sobriété, lisibilité, progressive
disclosure, faible densité cognitive — sans copier leur identité.

**Principe fondamental** : le moteur gère 45 contrôles ; le courtier ne doit
jamais avoir l'impression d'en gérer 45. La première question à laquelle
l'interface répond : *qu'est-ce que je dois faire maintenant sur ce dossier ?*

Navigation : Synthèse · Bail · Bail × Assurance · Contradictions · Pièces ·
Rapport, paramètres en bas.

- **Synthèse** — client en tête, 4 indicateurs, synthèse narrative lisible en
  10 secondes, section « À traiter en priorité » avec cartes actionnables.
- **Bail** — split-screen : document à gauche avec surlignage par statut,
  panneau d'explication à droite. Détails techniques sous « Voir le
  raisonnement ».
- **Bail × Assurance** — l'écran le plus important : rapprochement visuel
  bail → risque → couverture → conclusion, écarts chiffrés.
- **Contradictions** — clause A, clause B, pourquoi, action.
- **Pièces** — documents, rôles, état de lecture. Séparé des résultats.
- **Rapport** — deux livrables distincts : rapport courtier complet (Word) et
  note client simplifiée (PDF).

**Mode expert** pour identifiants, confiance, traces, garanties écartées,
signaux. **À retirer de l'expérience principale** : matrice des 45 contrôles,
contrôles « absent du bail », identifiants en gros, scores partout, formulaires
toujours ouverts, messages techniques.

Design : identité verte conservée, rouge réservé au critique, pas de violet, de
gradients marketing, de glassmorphism ni d'effets « IA futuriste ». Supprimer
environ 60 % des bordures ; hiérarchie par l'espace, la taille, la graisse.
Micro-interactions courtes et utiles.

**Progressive disclosure** : niveau 1 problème + impact + action · niveau 2
clause + couverture + justification · niveau 3 diagnostic moteur complet.

**Intervention humaine** : le courtier reste décisionnaire, et ses ajustements
(auteur, date, ancien état, nouvel état, motif) ne sont jamais effacés par une
nouvelle analyse.

### Phasage frontend

- **Phase 1** — navigation, Synthèse, Bail, Bail × Assurance. Montrer.
- **Phase 2** — Contradictions, Pièces, Rapport, mode expert.

Pendant la refonte : aucun nouveau contrôle, aucune nouvelle garantie, aucun
changement de règle métier sauf bug bloquant.

## 42. Scénario de test UX

Créer le dossier → déposer le bail → comprendre ce que le bail exige → ajouter
le contrat → voir les écarts → examiner chaque problème → corriger ou valider →
exporter. Un professionnel du métier qui ne connaît pas Clauzy doit comprendre
le workflow sans tutoriel.

## 43. Critère final

L'expérience doit donner l'impression :

> « Clauzy a lu énormément de choses, mais moi je n'ai besoin d'en regarder que
> cinq. »

Et non : « Clauzy a 45 contrôles, voici les 45. »

## 44. Roadmap

| Phase | Contenu |
| --- | --- |
| **A** | Stabilisation moteur |
| **B** | Golden Dataset, 50 cas |
| **C** | Métriques |
| **D** | Premiers dossiers réels anonymisés |
| **E** | Refonte frontend |
| **F** | Tests avec 5 à 10 courtiers |
| **G** | Ajustements terrain |

Pas de nouvelle verticale avant cela.

## 45. Compte rendu attendu à chaque lot

Ce qui a été modifié · pourquoi · fichiers concernés · tests ajoutés ·
résultats · régressions éventuelles · limites connues · ce qui reste à faire ·
livrable fonctionnel lorsque pertinent. **Puis attendre validation.**

## 46. Règle directrice

Ne plus chercher à augmenter la quantité de fonctionnalités. Trois critères
prioritaires :

1. **Fiabilité** — une conclusion est correcte, ou explicitement incertaine.
2. **Explicabilité** — chaque résultat se relie aux documents.
3. **Simplicité** — l'utilisateur ne voit que ce qui lui permet de décider.

La puissance de Clauzy ne se mesure pas au nombre de choses affichées, mais à
tout ce que le produit réussit à comprendre **et à cacher**.
