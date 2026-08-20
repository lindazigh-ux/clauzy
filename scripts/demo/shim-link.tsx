/**
 * Remplacant de next/link pour la construction autonome.
 *
 * La demonstration tient dans un seul fichier : il n'y a ni routeur, ni pages
 * voisines. Les liens deviennent des ancres ordinaires.
 */
import type { AnchorHTMLAttributes, ReactNode } from 'react'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children: ReactNode
}

export default function Link({ href, children, ...reste }: Props) {
  return (
    <a href={href} {...reste}>
      {children}
    </a>
  )
}
