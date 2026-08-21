import { type NextRequest, NextResponse } from 'next/server'

import { ChargeRefusee, adresseVraisemblable, recevoirCharge } from '@/lib/net/reception'

/**
 * Demande du rapport d'exemple (brief §9).
 *
 * Le rapport porte sur un bail SYNTHETIQUE : aucune piece client n'intervient,
 * ni a la demande, ni a l'envoi.
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
    const charge = recevoirCharge('contact.rapportExemple', corps)
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
