import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { demanderRetrait } from '@/lib/parrainage'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const { montant, numero_mobile, operateur } = await req.json()

  if (!montant || !numero_mobile || !operateur) {
    return NextResponse.json({ erreur: 'Champs manquants' }, { status: 400 })
  }

  try {
    await demanderRetrait(user.id, Number(montant), numero_mobile, operateur)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ erreur: message }, { status: 400 })
  }
}
