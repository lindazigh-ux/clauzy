'use client'

import { LIBELLE_STATUT, Statut } from '@/domain/controles'
import { Beneficiaire, LIBELLE_BENEFICIAIRE } from '@/domain/garanties/types'
import { LIBELLE_PREUVE, NiveauPreuve } from '@/domain/moteur/rapprochement'
import {
  MENTION_LIMITE,
  calendrier,
  enFrancais,
  formulerProchaineAction,
  preconisations,
  resultatsAffiches,
  synthetiser,
  type Dossier,
  type LigneRapport,
} from '@/domain/dossier'

import styles from '../rapport.module.css'

/**
 * Rapport client, rendu pour l'impression (brief §7, §3).
 *
 * Le PDF est produit par la fonction d'impression du navigateur : rien ne part
 * sur un service de conversion, et la mise en page reste modifiable en CSS
 * plutot qu'enfermee dans une bibliotheque.
 *
 * Ce bloc est masque a l'ecran et n'apparait qu'a l'impression. Il porte la
 * structure imposee du §7, dans l'ordre :
 *   1. page de garde aux couleurs du cabinet ;
 *   2. perimetre et limites — la page qui protege ;
 *   3. synthese autonome ;
 *   3 bis. rapprochement des garanties, risque par risque ;
 *   4. preconisations hierarchisees par enjeu chiffre ;
 *   5. matrice complete des controles ;
 *   6. suivi d'attestation.
 */
const dateLongue = (iso: string): string =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Le geste que chaque niveau de preuve appelle.
 *
 * Une conclusion sans suite ne sert a rien au client : « justification
 * insuffisante » doit se lire « écrivez au courtier », pas « négociez un
 * avenant ».
 */
const GESTE: Record<NiveauPreuve, string> = {
  [NiveauPreuve.ETABLIE]: 'Point clos.',
  [NiveauPreuve.JUSTIFICATION_INSUFFISANTE]:
    'Demander une attestation détaillant cette garantie. Le contrat n’est pas en cause.',
  [NiveauPreuve.PROBABLE]: 'Confirmer aux conditions particulières avant de conclure.',
  [NiveauPreuve.NON_DEMONTREE]: 'Réclamer la pièce manquante.',
  [NiveauPreuve.ECART_CONFIRME]: 'Négocier la clause d’abord, chiffrer l’extension ensuite.',
}

export function RapportImprimable({ dossier }: { readonly dossier: Dossier }) {
  const lignes = resultatsAffiches(dossier)
  const resume = synthetiser(dossier)
  const liste = preconisations(dossier)
  const sansObjet = lignes.filter((ligne) => ligne.sansObjet)
  const ecartes = lignes.filter((ligne) => ligne.ecarte)
  const courriels = dossier.documents.filter((document) => document.courriel !== null)
  const jalons = calendrier(dossier.suivi)
  const rapprochements = dossier.analyse?.rapprochements ?? []
  const couleur = `#${dossier.cabinet.couleur}`

  /** L'etat porte sa couleur jusque sur le papier. */
  const classeEtat = (ligne: LigneRapport): string => {
    if (ligne.ecarte) return styles.etatAbsent ?? ''
    if (ligne.statut === Statut.ECART) return styles.etatEcart ?? ''
    if (ligne.statut === Statut.CONFORME) return styles.etatConforme ?? ''
    if (ligne.statut === Statut.NON_DETECTE) return styles.etatVerifier ?? ''
    return styles.etatAbsent ?? ''
  }

  const champ = (libelle: string, valeur: string) =>
    valeur.trim().length === 0 ? null : (
      <p key={libelle} className={styles.champ}>
        <span className={styles.champLibelle}>{libelle}</span>
        <span className={styles.champValeur}>{valeur}</span>
      </p>
    )

  return (
    <div className={styles.rapport} aria-hidden="true">
      {/* 1. Page de garde — aux couleurs du cabinet, pas de Clauzy (§7). */}
      <section className={styles.garde}>
        <h1 className={styles.cabinet} style={{ color: couleur }}>
          {dossier.cabinet.nom.trim().length > 0 ? dossier.cabinet.nom : 'Note de conseil'}
        </h1>
        <p className={styles.objet} style={{ borderColor: couleur }}>
          Analyse des obligations d’assurance du bail
        </p>
        <div className={styles.champs}>
          {champ('Client', dossier.client.raisonSociale)}
          {champ('Adresse', dossier.client.adresse)}
          {champ('Activité', dossier.client.activite)}
          {champ('Référence', dossier.reference)}
          {champ(
            'Établie par',
            `${dossier.cabinet.praticien}${
              dossier.cabinet.qualite.trim().length > 0 ? `, ${dossier.cabinet.qualite}` : ''
            }`,
          )}
          {champ('Date', dateLongue(dossier.majLe))}
        </div>
      </section>

      {/* 2. Périmètre et limites — la page qui protège (§7). */}
      <section className={styles.section}>
        <h2>Périmètre et limites</h2>

        <h3>Pièces reçues</h3>
        {(dossier.perimetre.piecesRecues.length > 0
          ? dossier.perimetre.piecesRecues
          : dossier.documents.map((document) => document.nom)
        ).length === 0 ? (
          <p className={styles.discret}>Aucune pièce recensée.</p>
        ) : (
          <ul>
            {(dossier.perimetre.piecesRecues.length > 0
              ? dossier.perimetre.piecesRecues
              : dossier.documents.map((document) => document.nom)
            ).map((piece) => (
              <li key={piece}>{piece}</li>
            ))}
          </ul>
        )}

        <h3>Pièces manquantes</h3>
        {dossier.perimetre.piecesManquantes.length === 0 ? (
          <p className={styles.discret}>Aucune pièce déclarée manquante.</p>
        ) : (
          <ul>
            {dossier.perimetre.piecesManquantes.map((piece) => (
              <li key={piece}>{piece}</li>
            ))}
          </ul>
        )}

        <h3>Contrôles sans objet pour ce dossier</h3>
        {sansObjet.length === 0 ? (
          <p className={styles.discret}>
            Aucun contrôle déclaré sans objet : les {lignes.length} ont été appliqués.
          </p>
        ) : (
          <ul>
            {sansObjet.map((ligne) => (
              <li key={ligne.controle.id}>
                {ligne.controle.id} — {ligne.controle.titre}
              </li>
            ))}
          </ul>
        )}

        <h3>Contrôles écartés par le praticien</h3>
        {ecartes.length === 0 ? (
          <p className={styles.discret}>Aucun contrôle écarté.</p>
        ) : (
          <ul>
            {ecartes.map((ligne) => (
              <li key={ligne.controle.id}>
                {ligne.controle.id} — {ligne.controle.titre} · {ligne.motif}
              </li>
            ))}
          </ul>
        )}

        <h3>Hypothèses retenues</h3>
        {dossier.perimetre.hypotheses.length === 0 ? (
          <p className={styles.discret}>Aucune hypothèse particulière.</p>
        ) : (
          <ul>
            {dossier.perimetre.hypotheses.map((hypothese) => (
              <li key={hypothese}>{hypothese}</li>
            ))}
          </ul>
        )}

        <h3>Portée du document</h3>
        <p className={styles.mention}>{MENTION_LIMITE}</p>
      </section>

      {/* 3. Synthèse, autonome (§7). */}
      <section className={styles.section}>
        <h2>Synthèse</h2>
        <p className={styles.phrase}>{resume.phrase}</p>
        {resume.mentionAjustement !== null && (
          <p className={styles.discret}>{resume.mentionAjustement}</p>
        )}

        {liste.some((ligne) => ligne.resumeEcart !== null) && (
          <>
            <h3>Enjeux chiffrés</h3>
            <ul>
              {liste
                .filter((ligne) => ligne.resumeEcart !== null)
                .map((ligne) => (
                  <li key={ligne.controle.id}>
                    <strong>{ligne.resumeEcart}</strong> — {ligne.controle.titre}
                  </li>
                ))}
            </ul>
          </>
        )}

        {dossier.observations.length > 0 && (
          <>
            <h3>Observations hors des {lignes.length} contrôles</h3>
            <ul>
              {dossier.observations.map((observation) => (
                <li key={observation.id}>
                  <strong>{observation.titre}</strong> — {observation.texte}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* 3 bis. Rapprochement des garanties — la lecture d'un courtier. */}
      {rapprochements.length > 0 && (
        <section className={styles.section}>
          <h2>Rapprochement des garanties</h2>
          <p className={styles.discret}>
            Ce que le bail exige, risque par risque, et ce que les pièces produites démontrent. Une
            garantie peut être exigée, exister au contrat, et ne pas figurer sur l’attestation
            remise : ce n’est ni une conformité ni un écart, et la correction n’est pas la même.
          </p>
          <table className={styles.rapprochement}>
            <thead>
              <tr>
                <th scope="col">Garantie</th>
                <th scope="col">Protège</th>
                <th scope="col">Preuve</th>
                <th scope="col">Ce que cela appelle</th>
              </tr>
            </thead>
            <tbody>
              {rapprochements.map((rapprochement) => (
                <tr key={rapprochement.garantieId}>
                  <th scope="row">{rapprochement.libelle}</th>
                  <td>
                    {rapprochement.beneficiaire === Beneficiaire.MIXTE
                      ? '—'
                      : LIBELLE_BENEFICIAIRE[rapprochement.beneficiaire]}
                  </td>
                  <td>{LIBELLE_PREUVE[rapprochement.niveau]}</td>
                  <td>{GESTE[rapprochement.niveau]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 4. Préconisations, par enjeu chiffré puis par gravité (§7). */}
      <section className={styles.section}>
        <h2>Préconisations</h2>
        {liste.length === 0 ? (
          <p className={styles.discret}>Aucun écart retenu à ce stade.</p>
        ) : (
          <>
            <p className={styles.discret}>
              Classées par enjeu chiffré, puis par gravité. La correction du bail est toujours
              prioritaire ; l’adaptation du programme d’assurance n’intervient qu’en second, si la
              négociation échoue.
            </p>
            <ol className={styles.preconisations}>
              {liste.map((ligne) => (
                <li key={ligne.controle.id}>
                  <h3>
                    {ligne.controle.titre} <span className={styles.reference}>{ligne.controle.id}</span>
                  </h3>
                  {ligne.resumeEcart !== null && (
                    <p className={styles.chiffre}>{ligne.resumeEcart}</p>
                  )}
                  {ligne.analyse !== null && ligne.analyse.trim().length > 0 && (
                    <p>{ligne.analyse}</p>
                  )}
                  <p>
                    <span className={styles.etiquetteChamp}>Ce que risque le preneur.</span>{' '}
                    {ligne.controle.consequence}
                  </p>
                  <p>
                    <span className={styles.etiquetteChamp}>Correction du bail.</span>{' '}
                    {ligne.controle.actionSource}
                  </p>
                  <p className={styles.redaction}>{ligne.redaction}</p>
                  <p className={styles.discret}>
                    Preuve de clôture : {ligne.controle.preuveCloture}
                  </p>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      {/* 5. Matrice complète, tous états confondus (§7). */}
      <section className={styles.section}>
        <h2>Matrice des contrôles</h2>
        <p className={styles.discret}>
          Les {lignes.length} contrôles figurent ci-dessous, quel que soit leur état. Un contrôle que
          le moteur n’a pas su trancher est signalé « à vérifier manuellement » : c’est une ligne à
          examiner, pas un contrôle absent.
        </p>
        <table className={styles.matrice}>
          <thead>
            <tr>
              <th scope="col">Réf.</th>
              <th scope="col">Contrôle</th>
              <th scope="col">État</th>
              <th scope="col">Enjeu chiffré</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne) => (
              <tr key={ligne.controle.id}>
                <td className={styles.reference}>{ligne.controle.id}</td>
                <td>{ligne.controle.titre}</td>
                <td className={classeEtat(ligne)}>
                  {ligne.ecarte ? 'Écarté par le praticien' : LIBELLE_STATUT[ligne.statut]}
                </td>
                <td>{ligne.resumeEcart ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 6. Suivi d’attestation et prochaine action datée (§7). */}
      <section className={styles.section}>
        <h2>Suivi d’attestation</h2>

        <p className={styles.prochaine}>{formulerProchaineAction(dossier.suivi)}</p>

        {dossier.suivi.destinataire.trim().length > 0 && (
          <p className={styles.discret}>Demande adressée à {dossier.suivi.destinataire}.</p>
        )}

        {jalons.length > 0 && (
          <>
            <h3>Calendrier de relance</h3>
            <ul className={styles.jalons}>
              {jalons.map((entree) => (
                <li
                  key={entree.jalon.id}
                  className={entree.etat === 'FAIT' ? styles.jalonFait : undefined}
                >
                  <span className={styles.jalonDate}>{enFrancais(entree.echeance)}</span>
                  <span>
                    {entree.jalon.libelle}
                    {entree.etat === 'FAIT' ? ' — fait' : ''}
                    {entree.etat === 'EN_RETARD' ? ' — en retard' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {courriels.length > 0 && (
          <>
            <h3>Courriels versés au dossier</h3>
            <ul>
              {courriels.map((document) => (
                <li key={document.id}>
                  {document.courriel?.objet ?? 'Objet non renseigné'} —{' '}
                  {document.courriel?.envoyeLe === null || document.courriel === null
                    ? 'date d’envoi illisible, à saisir à la main'
                    : `envoyé le ${dateLongue(document.courriel.envoyeLe)}`}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <footer className={styles.pied}>
        Analyse préparée avec Clauzy — outil d’aide au conseil
      </footer>
    </div>
  )
}
