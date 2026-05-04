import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const { tombolaId } = body ?? {}

  if (!tombolaId) {
    return NextResponse.json({ error: 'tombolaId manquant.' }, { status: 400 })
  }

  // Vérifier que la tombola est active et dans les dates
  const { data: tombola } = await supabaseServiceRole
    .from('tombola')
    .select('id, prix_ticket, statut, date_debut, date_fin')
    .eq('id', tombolaId)
    .single()

  if (!tombola) {
    return NextResponse.json({ error: 'Tombola introuvable.' }, { status: 404 })
  }

  const maintenant = new Date()
  if (
    tombola.statut !== 'active' ||
    maintenant < new Date(tombola.date_debut) ||
    maintenant > new Date(tombola.date_fin)
  ) {
    return NextResponse.json({ error: 'Tombola non disponible à l\'achat.' }, { status: 403 })
  }

  // TODO Session T3 : intégration CinetPay
  // Étapes à implémenter :
  //   1. Créer un enregistrement dans paiements (type='ticket', statut='en_attente')
  //   2. Appeler l'API CinetPay avec le montant, transaction_id, callback_url
  //   3. CinetPay retourne une payment_url → la renvoyer ici
  //   4. Webhook CinetPay → créer le ticket avec numero_ticket unique (TOM-{ts}-{rand})
  console.log(
    '[tombola/acheter] TODO CinetPay | userId:', user.id,
    '| tombolaId:', tombolaId,
    '| montant:', tombola.prix_ticket, 'XOF',
  )

  return NextResponse.json({ urlPaiement: null })
}
