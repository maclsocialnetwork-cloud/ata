import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  console.log('[soumettre] Requête reçue')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const participationId: string | undefined = body?.participationId

  if (!participationId) {
    return NextResponse.json({ error: 'participationId manquant.' }, { status: 400 })
  }

  const { data: participation } = await supabaseServiceRole
    .from('participations')
    .select('statut, reponses, concours_id')
    .eq('id', participationId)
    .eq('user_id', user.id)
    .single()

  if (!participation) {
    return NextResponse.json({ error: 'Participation introuvable.' }, { status: 404 })
  }

  // Idempotent : déjà soumise → retourner sans erreur
  if (participation.statut === 'termine' || participation.statut === 'expire') {
    console.log('[soumettre] → déjà', participation.statut)
    return NextResponse.json({ statut: participation.statut })
  }

  // Charger toutes les questions du concours pour calculer le score
  const { data: questions } = await supabaseServiceRole
    .from('questions')
    .select('id, bonne_rep')
    .eq('concours_id', participation.concours_id)

  const reponses: Record<string, string> =
    typeof participation.reponses === 'string'
      ? JSON.parse(participation.reponses || '{}')
      : (participation.reponses ?? {})

  // Calculer le score
  let score = 0
  for (const q of questions ?? []) {
    if (reponses[q.id] === q.bonne_rep) score++
  }

  const { error: updateError } = await supabaseServiceRole
    .from('participations')
    .update({
      statut: 'termine',
      score,
      fin_at: new Date().toISOString(),
    })
    .eq('id', participationId)

  if (updateError) {
    console.error('[soumettre] Erreur update:', updateError.message)
    return NextResponse.json({ error: 'Erreur lors de la soumission.' }, { status: 500 })
  }

  console.log('[soumettre] → 200 score:', score, '/', (questions ?? []).length)
  return NextResponse.json({ score, total: (questions ?? []).length })
}
