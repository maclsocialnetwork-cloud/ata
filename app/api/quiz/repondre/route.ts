import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'

export async function PATCH(request: NextRequest) {
  console.log('[repondre] Requête reçue')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const participationId: string | undefined = body?.participationId
  const questionId: string | undefined = body?.questionId
  const reponse: string | undefined = body?.reponse

  if (!participationId || !questionId || !reponse) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  if (!['a', 'b', 'c', 'd'].includes(reponse)) {
    return NextResponse.json({ error: 'Réponse invalide.' }, { status: 400 })
  }

  // 1. Charger la participation
  const { data: participation } = await supabaseServiceRole
    .from('participations')
    .select('statut, reponses')
    .eq('id', participationId)
    .eq('user_id', user.id)
    .single()

  if (!participation) {
    return NextResponse.json({ error: 'Participation introuvable.' }, { status: 404 })
  }

  if (participation.statut !== 'en_cours') {
    return NextResponse.json({ error: 'Participation non active.' }, { status: 403 })
  }

  // 2. Parser les réponses existantes
  const reponses: Record<string, string> =
    typeof participation.reponses === 'string'
      ? JSON.parse(participation.reponses || '{}')
      : (participation.reponses ?? {})

  if (reponses[questionId]) {
    return NextResponse.json({ error: 'Déjà répondu à cette question.' }, { status: 409 })
  }

  // 3. Ajouter la nouvelle réponse
  reponses[questionId] = reponse

  const { error: updateError } = await supabaseServiceRole
    .from('participations')
    .update({ reponses: JSON.stringify(reponses) })
    .eq('id', participationId)

  if (updateError) {
    console.error('[repondre] Erreur update:', updateError.message)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 })
  }

  console.log('[repondre] → 200 saved | questionId:', questionId, '| reponse:', reponse)
  return NextResponse.json({ saved: true })
}
