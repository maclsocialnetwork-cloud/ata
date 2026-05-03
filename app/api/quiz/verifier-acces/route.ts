import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const concoursId: string | undefined = body?.concoursId

  if (!concoursId) {
    return NextResponse.json({ message: 'concoursId manquant.' }, { status: 400 })
  }

  // Vérifie que le concours existe et est actif
  const { data: concours } = await supabase
    .from('concours')
    .select('id, statut')
    .eq('id', concoursId)
    .eq('statut', 'actif')
    .single()

  if (!concours) {
    return NextResponse.json(
      { message: 'Ce concours est introuvable ou n\'est plus actif.' },
      { status: 404 }
    )
  }

  // Vérifie si déjà participé
  const { data: existante } = await supabase
    .from('participations')
    .select('id')
    .eq('concours_id', concoursId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existante) {
    return NextResponse.json(
      { message: 'Vous avez déjà participé à ce concours.' },
      { status: 409 }
    )
  }

  // Crée la participation
  const { data: participation, error } = await supabase
    .from('participations')
    .insert({ concours_id: concoursId, user_id: user.id })
    .select('id')
    .single()

  if (error || !participation) {
    console.error('[verifier-acces] Erreur création participation:', error?.message)
    return NextResponse.json(
      { message: 'Impossible de créer la participation.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ participationId: participation.id })
}
