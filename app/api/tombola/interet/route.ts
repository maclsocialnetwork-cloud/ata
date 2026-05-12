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

  // Vérifier si l'intérêt existe déjà (clé composite tombola_id+user_id, pas de colonne id)
  const { data: existant } = await supabaseServiceRole
    .from('tombola_interet')
    .select('tombola_id')
    .eq('tombola_id', tombolaId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existant) {
    // Toggle OFF : supprimer par clé composite
    await supabaseServiceRole
      .from('tombola_interet')
      .delete()
      .eq('tombola_id', tombolaId)
      .eq('user_id', user.id)
  } else {
    // Toggle ON : ajouter l'intérêt
    await supabaseServiceRole
      .from('tombola_interet')
      .insert({ tombola_id: tombolaId, user_id: user.id })
  }

  // Compter le total actuel pour cette tombola
  const { count } = await supabaseServiceRole
    .from('tombola_interet')
    .select('*', { count: 'exact', head: true })
    .eq('tombola_id', tombolaId)

  console.log(
    '[tombola/interet] userId:', user.id,
    '| tombolaId:', tombolaId,
    '| action:', existant ? 'suppression' : 'ajout',
    '| total:', count,
  )

  return NextResponse.json({ interessee: !existant, total: count ?? 0 })
}
