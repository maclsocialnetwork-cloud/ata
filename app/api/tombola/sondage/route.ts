import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'

const MONTANTS_VALIDES = new Set([100, 500, 1000, 2000, 5000, 10000])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const { tombolaId, montant } = body ?? {}

  if (!tombolaId || typeof montant !== 'number') {
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
  }

  if (!MONTANTS_VALIDES.has(montant)) {
    return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 })
  }

  const { error } = await supabaseServiceRole
    .from('tombola_sondage')
    .upsert(
      { tombola_id: tombolaId, user_id: user.id, montant },
      { onConflict: 'tombola_id,user_id' },
    )

  if (error) {
    console.error('[tombola/sondage]', error.message)
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement.' }, { status: 500 })
  }

  console.log(
    '[tombola/sondage] userId:', user.id,
    '| tombolaId:', tombolaId,
    '| montant:', montant, 'FCFA',
  )

  return NextResponse.json({ success: true })
}
