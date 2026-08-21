import type { Metadata } from 'next'
import Link from 'next/link'

import { FaqStructuree } from '../composants/DonneesStructurees'
import { FAQ, RUBRIQUES_FAQ } from '@/contenu/faq'
import { partage } from '@/contenu/site'

import styles from '../site.module.css'
import propres from './faq.module.css'

export const metadata: Metadata = {
  title: 'Questions fréquentes',
  description:
    'Confidentialité, méthode, portée, pratique : les questions que posent les courtiers, les avocats et les directions juridiques avant d’adopter Clauzy, et les réponses sans détour.',
  ...partage({
    titre: 'Questions fréquentes — Clauzy',
    description:
      'Vos documents partent-ils sur nos serveurs ? Pourquoi pas un assistant IA généraliste ? Clauzy remplace-t-il un avocat ?',
    chemin: '/faq',
  }),
}

/**
 * FAQ (brief §9).
 *
 * La page et le JSON-LD `FAQPage` lisent la MEME source. Un balisage structure
 * qui annonce autre chose que la page visible est sanctionne par les moteurs —
 * et serait ici un mensonge de plus sur un produit vendu sur la transparence.
 */
export default function PageFaq() {
  return (
    <main className="page">
      <FaqStructuree />

      <span className={styles.surtitre}>Questions fréquentes</span>
      <h1>Ce qu’on nous demande avant de signer</h1>
      <p className={styles.chapo}>
        Les questions ci-dessous viennent de courtiers, d’avocats et de directions juridiques. Les
        réponses ne contournent rien : là où le produit s’arrête, c’est écrit.
      </p>

      {RUBRIQUES_FAQ.map((rubrique) => {
        const entrees = FAQ.filter((entree) => entree.rubrique === rubrique)
        if (entrees.length === 0) return null

        return (
          <section key={rubrique} className={styles.sectionSerree}>
            <h2>{rubrique}</h2>
            <div className={propres.entrees}>
              {entrees.map((entree) => (
                <article key={entree.question} className={propres.entree}>
                  <h3 className={propres.question}>{entree.question}</h3>
                  {entree.reponse.map((paragraphe) => (
                    <p key={paragraphe} className={propres.reponse}>
                      {paragraphe}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          </section>
        )
      })}

      <section className={styles.section}>
        <h2>Une question qui n’est pas là ?</h2>
        <p>
          La page sécurité détaille l’architecture, champ par champ. Pour le reste, une
          démonstration répond plus vite qu’un échange de courriels.
        </p>
        <div className={styles.appels}>
          <Link href="/demo" className={styles.boutonPrimaire}>
            Réserver une démonstration
          </Link>
          <Link href="/securite" className={styles.boutonSecondaire}>
            Lire la page sécurité
          </Link>
        </div>
      </section>
    </main>
  )
}
