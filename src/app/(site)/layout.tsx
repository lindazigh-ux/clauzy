import { Entete, Pied } from './composants/Coquille'

/**
 * Coquille du site marketing (brief §9).
 *
 * Le groupe de routes `(site)` n'apparait pas dans les URL : il sert
 * uniquement a donner un en-tete et un pied communs a toutes les pages
 * publiques, sans les imposer au poste de travail — qui occupe l'ecran entier
 * et n'a rien a faire d'une navigation marketing.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Entete />
      {children}
      <Pied />
    </>
  )
}
