import { type NextRequest, NextResponse } from 'next/server'

import { ChargeRefusee, adresseVraisemblable, recevoirCharge } from '@/lib/net/reception'

/**
 * Demande de demonstration (brief §9).
 *
 * Deuxieme entree de conversion, pour les comptes equipe. Le formulaire ne
 * porte AUCUN champ de texte libre : le besoin se choisit dans une enumeration
 * fermee, et le detail se dit de vive voix. Un message libre serait la premiere
 * breche dans le §2.
 *
 * Le corps est valide contre le meme catalogue que celui du navigateur : un
 * champ non declare est refuse ici aussi, et un extrait de bail poste a la main
 * sur cette route n'est jamais accepte, encore moins journalise.
 *
 * La persistance des demandes arrive avec le lot L6 (base et compte). Jusque
 * la, la route valide et accuse reception : mieux vaut un formulaire honnete
 * qui dit ce qu'il fait qu'un formulaire qui promet un envoi inexistant.
 */
export async function POST(requete: NextRequest) {
  let corps: unknown
  try {
    corps = await requete.json()
  } catch {
    return NextResponse.json({ erreur: 'Corps illisible.' }, { status: 400 })
  }

  try {
    const charge = recevoirCharge('contact.demo', corps)
    if (!adresseVraisemblable(String(charge.email))) {
      return NextResponse.json(
        { erreur: 'Cette adresse ne semble pas valide. Vérifiez-la et réessayez.' },
        { status: 422 },
      )
    }
    return new NextResponse(null, { status: 204 })
  } catch (erreur) {
    if (erreur instanceof ChargeRefusee) {
      return NextResponse.json({ erreur: erreur.message }, { status: 422 })
    }
    return NextResponse.json({ erreur: 'Demande refusée.' }, { status: 400 })
  }
}
