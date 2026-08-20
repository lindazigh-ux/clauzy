# `src/lib/net` — l'unique surface reseau

Clauzy est un produit *zero-document* : le texte des baux, des polices, des
avenants et des mails importes ne quitte jamais le navigateur. Ce n'est pas une
option de configuration, c'est le differenciateur commercial du produit
(brief §2) et une contrainte d'architecture.

## Les trois regles

1. **Aucun `fetch` ailleurs.** Tout appel reseau passe par `appelApi()`.
   `tests/architecture/aucun-fetch-hors-net.test.ts` echoue sinon.
2. **Aucun champ non declare ne sort.** Un endpoint qui n'est pas dans
   `catalogue.ts` n'est pas appelable ; un champ qui n'y est pas declare est
   refuse, meme anodin.
3. **Le garde s'execute avant le reseau.** `verifierChargeSortante()` leve
   `ErreurFuiteDocumentaire` *avant* le `fetch` : en cas de refus, aucun octet
   ne part.

## Ajouter un champ sortant

C'est une decision d'architecture. Avant d'ouvrir `catalogue.ts` :

- le champ transporte-t-il une identite, un abonnement, une metadonnee saisie
  a la main, ou une statistique anonyme ? Si la reponse est non, la reponse
  est non ;
- peut-il, un jour, contenir un fragment de document saisi ou colle par
  l'utilisateur ? Si oui, plafonnez sa longueur agressivement ;
- renseignez `justification` : elle sert de trace de decision, et la page
  `/securite` s'appuie sur le catalogue pour documenter ce qui sort.

## Si une fonctionnalite exige d'envoyer du texte

Ne contournez pas le garde. Signalez le conflit et proposez une alternative
cote client (Web Worker, `WebCrypto`, fichier `.clauzy` local). Le brief §13
l'interdit sans exception.
