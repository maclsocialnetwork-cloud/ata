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
  const { participationId, pathCni, pathSelfie } = body ?? {}

  if (!participationId || !pathCni || !pathSelfie) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  // Vérifier que l'utilisateur est bien le gagnant de cette participation
  const { data: participation } = await supabaseServiceRole
    .from('participations')
    .select('id')
    .eq('id', participationId)
    .eq('user_id', user.id)
    .eq('est_gagnant', true)
    .single()

  if (!participation) {
    return NextResponse.json({ error: 'Participation non autorisée.' }, { status: 403 })
  }

  // Refuser un deuxième dépôt
  const { data: existante } = await supabaseServiceRole
    .from('verifications_identite')
    .select('id')
    .eq('participation_id', participationId)
    .maybeSingle()

  if (existante) {
    return NextResponse.json({ error: 'Dossier déjà soumis.' }, { status: 409 })
  }

  const { error } = await supabaseServiceRole.from('verifications_identite').insert({
    participation_id: participationId,
    user_id: user.id,
    url_cni: pathCni,
    url_selfie: pathSelfie,
  })

  if (error) {
    console.error('[soumettre-verification] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 })
  }

  console.log('[soumettre-verification] → 200 userId:', user.id)
  return NextResponse.json({ ok: true })
}
