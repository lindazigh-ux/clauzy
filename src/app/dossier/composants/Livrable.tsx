'use client'

import type { Cabinet, Dossier, FicheClient } from '@/domain/dossier'

import styles from '../dossier.module.css'

/**
 * L'identite du livrable (brief §7).
 *
 * L'identite saisie ici est celle du CABINET : le rapport sort a ses couleurs,
 * pas a celles de Clauzy. Elle reste sur le poste, comme le reste du dossier.
 *
 * Les DEUX EXPORTS ont quitte ce composant pour l'ecran Rapport : deux boutons
 * voisins ne disaient pas en quoi les deux livrables different, et le
 * praticien envoyait au client celui qui porte les traces de detection.
 */
export type LivrableProps = {
  readonly dossier: Dossier
  readonly onCabinet: (cabinet: Partial<Cabinet>) => void
  readonly onClient: (client: Partial<FicheClient>) => void
}

export function Livrable({ dossier, onCabinet, onClient }: LivrableProps) {
  const champ = (
    id: string,
    libelle: string,
    valeur: string,
    onChanger: (valeur: string) => void,
    invitation?: string,
  ) => (
    <div>
      <label className={styles.champLabel} htmlFor={id}>
        {libelle}
      </label>
      <input
        id={id}
        className={styles.champ}
        value={valeur}
        placeholder={invitation}
        onChange={(e) => onChanger(e.target.value)}
      />
    </div>
  )

  return (
    <section className={styles.carte} aria-labelledby="titre-livrable">
      <h2 id="titre-livrable">Livrable</h2>
      <p className={styles.vide} style={{ marginBottom: 'calc(var(--pas) * 4)' }}>
        Le rapport sort aux couleurs de votre cabinet. La marque Clauzy tient en pied de page.
      </p>

      <div className={styles.editeur}>
        {champ('cabinet-nom', 'Cabinet ou direction', dossier.cabinet.nom, (nom) =>
          onCabinet({ nom }),
        )}

        <div className={styles.rangee}>
          <div style={{ flex: 1, minWidth: '10rem' }}>
            {champ('cabinet-praticien', 'Praticien', dossier.cabinet.praticien, (praticien) =>
              onCabinet({ praticien }),
            )}
          </div>
          <div style={{ flex: 1, minWidth: '10rem' }}>
            {champ(
              'cabinet-qualite',
              'Qualité',
              dossier.cabinet.qualite,
              (qualite) => onCabinet({ qualite }),
              'courtier, avocat, directrice juridique…',
            )}
          </div>
        </div>

        <div>
          <label className={styles.champLabel} htmlFor="cabinet-couleur">
            Couleur de la page de garde
          </label>
          <input
            id="cabinet-couleur"
            type="color"
            className={styles.roleSelect}
            value={`#${dossier.cabinet.couleur}`}
            onChange={(e) => onCabinet({ couleur: e.target.value.replace('#', '').toUpperCase() })}
          />
        </div>

        {champ('client-raison', 'Client', dossier.client.raisonSociale, (raisonSociale) =>
          onClient({ raisonSociale }),
        )}
        {champ('client-adresse', 'Adresse du site', dossier.client.adresse, (adresse) =>
          onClient({ adresse }),
        )}
        {champ('client-activite', 'Activité exercée', dossier.client.activite, (activite) =>
          onClient({ activite }),
        )}

      </div>
    </section>
  )
}
