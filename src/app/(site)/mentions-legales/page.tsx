import type { Metadata } from 'next'
import Link from 'next/link'

import { Article, Definitions, PageLegale } from '../composants/PageLegale'
import { A_COMPLETER, EDITEUR } from '@/contenu/editeur'
import { partage } from '@/contenu/site'

import propres from '../composants/legal.module.css'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    'Éditeur, directeur de publication, hébergeur et propriété intellectuelle du site et de l’application Clauzy.',
  ...partage({
    titre: 'Mentions légales — Clauzy',
    description:
      'Éditeur, directeur de publication, hébergeur et propriété intellectuelle du site et de l’application Clauzy.',
    chemin: '/mentions-legales',
    type: 'article',
  }),
  robots: { index: true, follow: false },
}

/** Une valeur non renseignee se signale, elle ne se dissimule pas. */
const Valeur = ({ texte }: { texte: string }) =>
  texte === A_COMPLETER ? <span className={propres.aCompleter}>{texte}</span> : <>{texte}</>

export default function MentionsLegales() {
  return (
    <PageLegale titre="Mentions légales">
      <Article numero="1" titre="Éditeur du site">
        <Definitions
          lignes={[
            { terme: 'Dénomination sociale', valeur: <Valeur texte={EDITEUR.denomination} /> },
            { terme: 'Forme sociale', valeur: <Valeur texte={EDITEUR.formeSociale} /> },
            { terme: 'Capital social', valeur: <Valeur texte={EDITEUR.capital} /> },
            { terme: 'Siège social', valeur: <Valeur texte={EDITEUR.siege} /> },
            { terme: 'RCS', valeur: <Valeur texte={EDITEUR.rcs} /> },
            { terme: 'SIREN', valeur: <Valeur texte={EDITEUR.siren} /> },
            {
              terme: 'TVA intracommunautaire',
              valeur: <Valeur texte={EDITEUR.tvaIntracommunautaire} />,
            },
            {
              terme: 'Courriel',
              valeur: <a href={`mailto:${EDITEUR.courriel}`}>{EDITEUR.courriel}</a>,
            },
            { terme: 'Téléphone', valeur: <Valeur texte={EDITEUR.telephone} /> },
          ]}
        />
      </Article>

      <Article numero="2" titre="Directeur de la publication">
        <p>
          <Valeur texte={EDITEUR.directeurPublication} />, en qualité de représentant légal de{' '}
          {EDITEUR.denomination}.
        </p>
      </Article>

      <Article numero="3" titre="Hébergement">
        <Definitions
          lignes={[
            { terme: 'Hébergeur', valeur: <Valeur texte={EDITEUR.hebergeur} /> },
            { terme: 'Adresse', valeur: <Valeur texte={EDITEUR.hebergeurAdresse} /> },
          ]}
        />
        <p>
          Les données de l’application sont hébergées dans l’Union européenne. Il convient de
          rappeler que les documents analysés ne sont, eux, hébergés nulle part : ils ne quittent
          pas le navigateur de l’utilisateur. La{' '}
          <Link href="/securite">page sécurité</Link> détaille ce qui transite et ce qui ne
          transite pas.
        </p>
      </Article>

      <Article numero="4" titre="Propriété intellectuelle">
        <p>
          Le site, l’application, le référentiel de contrôles, les rédactions de clauses proposées
          et l’ensemble des contenus éditoriaux sont protégés par le droit de la propriété
          intellectuelle et demeurent la propriété de {EDITEUR.denomination}.
        </p>
        <p>
          L’utilisateur abonné dispose d’un droit d’usage des rédactions proposées dans le cadre de
          ses propres dossiers, y compris dans les documents qu’il remet à ses clients. Ce droit
          n’emporte aucune cession : la reproduction du référentiel, en tout ou partie, à des fins
          de constitution d’une base concurrente est interdite.
        </p>
        <p>
          Les rapports produits par l’application appartiennent à leur auteur. {EDITEUR.denomination}{' '}
          n’en a ni la propriété, ni la connaissance : ils sont générés sur le poste de
          l’utilisateur.
        </p>
      </Article>

      <Article numero="5" titre="Responsabilité professionnelle">
        <p>
          Assurance de responsabilité civile professionnelle : <Valeur texte={EDITEUR.rcPro} />.
        </p>
        <p>
          {EDITEUR.denomination} édite un outil d’aide au conseil. Elle n’exerce ni la profession
          d’avocat, ni celle de courtier ou d’intermédiaire en assurance, et ne délivre aucune
          consultation juridique au sens de la loi du 31 décembre 1971. Les limites de l’outil sont
          détaillées aux <Link href="/cgu">conditions générales</Link>.
        </p>
      </Article>

      <Article numero="6" titre="Signalement d’un contenu">
        <p>
          Toute demande relative à un contenu du site peut être adressée à{' '}
          <a href={`mailto:${EDITEUR.courriel}`}>{EDITEUR.courriel}</a>. Les demandes relatives aux
          données personnelles relèvent de la{' '}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </Article>
    </PageLegale>
  )
}
