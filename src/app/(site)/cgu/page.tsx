import type { Metadata } from 'next'
import Link from 'next/link'

import { Article, PageLegale } from '../composants/PageLegale'
import { EDITEUR } from '@/contenu/editeur'
import { partage } from '@/contenu/site'
import { MENTION_LIMITE } from '@/domain/dossier/types'
import { NOMBRE_CONTROLES } from '@/domain/controles'

export const metadata: Metadata = {
  title: 'Conditions générales',
  description:
    'Conditions générales d’utilisation et de vente de Clauzy : objet du service, limitation de responsabilité explicite, abonnement, résiliation et droit applicable.',
  ...partage({
    titre: 'Conditions générales — Clauzy',
    description:
      'Objet du service, limitation de responsabilité explicite, abonnement, résiliation et droit applicable.',
    chemin: '/cgu',
    type: 'article',
  }),
  robots: { index: true, follow: false },
}

export default function Cgu() {
  return (
    <PageLegale
      titre="Conditions générales d’utilisation et de vente"
      chapo="Ces conditions régissent l’accès au site et l’usage de l’application. L’article 4 — limitation de responsabilité — mérite d’être lu avant les autres : il dit précisément ce que l’outil ne fait pas."
    >
      <Article numero="1" titre="Objet et définitions">
        <p>
          {EDITEUR.denomination} édite un outil d’aide au conseil qui rapproche les obligations
          d’assurance stipulées dans un document source — typiquement un bail commercial — des
          couvertures effectivement souscrites, et produit une note de synthèse.
        </p>
        <ul>
          <li>
            <strong>Le Service</strong> : le site, l’application et les exports qu’elle produit.
          </li>
          <li>
            <strong>L’Utilisateur</strong> : le professionnel qui accède au Service, agissant dans
            le cadre de son activité.
          </li>
          <li>
            <strong>Le Référentiel</strong> : l’ensemble des {NOMBRE_CONTROLES} contrôles appliqués
            par le Service.
          </li>
          <li>
            <strong>Les Documents</strong> : les pièces que l’Utilisateur soumet à l’analyse. Elles
            sont traitées exclusivement dans son navigateur.
          </li>
        </ul>
        <p>
          Le Service s’adresse exclusivement à des professionnels. Il n’est pas destiné aux
          consommateurs au sens du code de la consommation.
        </p>
      </Article>

      <Article numero="2" titre="Acceptation">
        <p>
          L’utilisation du Service emporte acceptation des présentes conditions. En cas de
          souscription d’un abonnement, elles sont acceptées expressément au moment du paiement et
          prévalent sur tout document contraire de l’Utilisateur, notamment ses conditions
          générales d’achat.
        </p>
      </Article>

      <Article numero="3" titre="Nature du Service et rôle de l’Utilisateur">
        <p>
          Le Service applique un référentiel documenté et rend un résultat pour chacun de ses{' '}
          {NOMBRE_CONTROLES} contrôles, y compris lorsqu’il n’est pas en mesure de conclure — ce
          résultat porte alors la mention « à vérifier manuellement ».
        </p>
        <p>
          L’Utilisateur demeure seul responsable de l’analyse qu’il remet à ses propres clients. Il
          lui appartient de vérifier les conclusions du Service, de les compléter au regard des
          conditions générales et particulières des polices, et d’exercer son propre jugement
          professionnel. Le Service prépare le travail ; il ne le signe pas.
        </p>
      </Article>

      <Article numero="4" titre="Limitation de responsabilité">
        <p>
          <strong>{MENTION_LIMITE}</strong>
        </p>
        <p>
          En conséquence, {EDITEUR.denomination} ne saurait être tenue responsable :
        </p>
        <ul>
          <li>
            d’une clause non détectée, d’un faux positif, ou d’une conclusion erronée du moteur ;
          </li>
          <li>
            des décisions prises par l’Utilisateur ou par ses clients sur le fondement d’un rapport
            produit par le Service ;
          </li>
          <li>
            de l’absence de couverture d’un sinistre, quelle qu’en soit la cause, l’appréciation de
            la garantie relevant exclusivement de l’assureur et des stipulations de la police ;
          </li>
          <li>
            de l’impossibilité de lire un document dépourvu de couche texte, ou dont le format ne
            permet pas l’extraction ;
          </li>
          <li>
            de la perte d’un dossier de travail, celui-ci étant enregistré par l’Utilisateur sur
            son propre poste et n’étant à aucun moment détenu par {EDITEUR.denomination}.
          </li>
        </ul>
        <p>
          En toute hypothèse, et hors faute lourde ou dolosive, la responsabilité de{' '}
          {EDITEUR.denomination} est plafonnée au montant des sommes effectivement versées par
          l’Utilisateur au titre des douze mois précédant le fait générateur. Les dommages
          indirects, notamment la perte de chance, le préjudice commercial et l’atteinte à l’image,
          sont exclus.
        </p>
        <p>
          Le Service étant fourni sans hébergement des Documents, {EDITEUR.denomination} ne peut
          par construction être tenue d’une obligation de conservation, de restitution ou de
          restauration de ceux-ci.
        </p>
      </Article>

      <Article numero="5" titre="Obligations de l’Utilisateur">
        <ul>
          <li>
            S’assurer qu’il dispose du droit de soumettre les Documents à l’analyse, et notamment
            de l’accord de son client lorsqu’il y est tenu.
          </li>
          <li>
            Ne pas tenter de contourner les mesures techniques du Service, ni de reconstituer le
            Référentiel à des fins de constitution d’une base concurrente.
          </li>
          <li>
            Conserver la confidentialité de ses identifiants et des mots de passe protégeant ses
            fichiers de dossier. Un mot de passe perdu rend le fichier définitivement illisible :
            le chiffrement est effectué localement et {EDITEUR.denomination} ne détient aucune clé.
          </li>
          <li>
            Ne pas présenter une sortie du Service comme un avis juridique ou une garantie de
            couverture auprès de ses propres clients.
          </li>
        </ul>
      </Article>

      <Article numero="6" titre="Abonnement, prix et paiement">
        <p>
          Les plans et leurs tarifs figurent sur la <Link href="/tarifs">page tarifs</Link>. Les
          prix sont indiqués hors taxes ; la TVA applicable s’ajoute au taux en vigueur.
        </p>
        <p>
          L’abonnement est souscrit pour une période mensuelle ou annuelle et se renouvelle
          tacitement, sauf résiliation avant l’échéance. Le paiement s’effectue par carte bancaire
          via un prestataire de paiement agréé ; {EDITEUR.denomination} ne conserve aucune donnée
          de carte.
        </p>
        <p>
          Toute modification tarifaire est notifiée au moins trente jours avant sa prise d’effet et
          ouvre à l’Utilisateur un droit de résiliation sans pénalité.
        </p>
      </Article>

      <Article numero="7" titre="Durée, résiliation et effets">
        <p>
          L’Utilisateur peut résilier à tout moment depuis son espace, avec effet à la fin de la
          période en cours. Les sommes correspondant à la période entamée restent dues.
        </p>
        <p>
          {EDITEUR.denomination} peut suspendre l’accès en cas de manquement grave, après mise en
          demeure restée sans effet pendant quinze jours, sauf atteinte à la sécurité du Service
          où la suspension peut être immédiate.
        </p>
        <p>
          La fin de l’abonnement n’affecte ni les rapports déjà exportés, qui sont des documents
          ordinaires, ni les fichiers de dossier, qui se trouvent sur le poste de l’Utilisateur.
        </p>
      </Article>

      <Article numero="8" titre="Disponibilité et évolution">
        <p>
          Le Service est fourni selon une obligation de moyens. L’analyse s’exécutant dans le
          navigateur, une interruption de nos serveurs n’empêche pas de terminer un dossier ouvert.
        </p>
        <p>
          Le Référentiel évolue. Un identifiant de contrôle n’est jamais réattribué : une référence
          citée dans un rapport antérieur conserve son sens.
        </p>
      </Article>

      <Article numero="9" titre="Données personnelles">
        <p>
          Le traitement des données personnelles est décrit à la{' '}
          <Link href="/confidentialite">politique de confidentialité</Link>. Lorsque l’Utilisateur
          agit en qualité de responsable de traitement et {EDITEUR.denomination} en qualité de
          sous-traitant, l’<Link href="/dpa">accord de traitement des données</Link> s’applique et
          fait partie intégrante des présentes.
        </p>
      </Article>

      <Article numero="10" titre="Droit applicable et différends">
        <p>
          Les présentes sont soumises au droit français. Les parties rechercheront une solution
          amiable avant toute action. À défaut d’accord dans un délai de soixante jours, compétence
          exclusive est attribuée aux tribunaux du ressort du siège de {EDITEUR.denomination}, y
          compris en cas de pluralité de défendeurs ou d’appel en garantie.
        </p>
      </Article>
    </PageLegale>
  )
}
