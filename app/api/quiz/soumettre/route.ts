import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import { calculerScore } from '@/lib/utils/score'

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

  // ETAPE 1 — Charger la participation
  const { data: participation } = await supabaseServiceRole
    .from('participations')
    .select('user_id, concours_id, reponses, debut_at, statut, score, temps_secondes, est_gagnant')
    .eq('id', participationId)
    .eq('user_id', user.id)
    .single()

  if (!participation) {
    return NextResponse.json({ error: 'Participation introuvable.' }, { status: 404 })
  }

  // Double-check idempotent : déjà terminée → retourner le résultat stocké sans recalculer
  if (participation.statut === 'termine') {
    console.log('[soumettre] → déjà terminée, résultat stocké retourné')
    const { count } = await supabaseServiceRole
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('concours_id', participation.concours_id)
    return NextResponse.json({
      score: participation.score ?? 0,
      estGagnant: participation.est_gagnant ?? false,
      tempsSecondes: participation.temps_secondes ?? 0,
      totalQuestions: count ?? 0,
    })
  }

  // Accepter uniquement 'en_cours' ou 'expire' (pas 'termine')
  if (participation.statut !== 'en_cours' && participation.statut !== 'expire') {
    return NextResponse.json({ error: 'Statut de participation invalide.' }, { status: 400 })
  }

  // Charger questions, profil et concours en parallèle
  const [questionsRes, profilRes, concoursRes] = await Promise.all([
    supabaseServiceRole
      .from('questions')
      .select('id, bonne_rep')
      .eq('concours_id', participation.concours_id),
    supabaseServiceRole
      .from('profiles')
      .select('prenom, whatsapp')
      .eq('id', user.id)
      .single(),
    supabaseServiceRole
      .from('concours')
      .select('gagnant_trouve, titre, description_lot, organisateur_id')
      .eq('id', participation.concours_id)
      .single(),
  ])

  const questions = questionsRes.data ?? []
  const profil = profilRes.data
  const concours = concoursRes.data

  // ETAPE 2 — Calculer le score et le temps
  const reponses: Record<string, string> =
    typeof participation.reponses === 'string'
      ? JSON.parse(participation.reponses || '{}')
      : (participation.reponses ?? {})

  const score = calculerScore(reponses, questions)
  const tempsSecondes = Math.floor(
    (Date.now() - new Date(participation.debut_at).getTime()) / 1000,
  )

  // ETAPE 3 — Détection du gagnant via RPC atomique (évite la race condition)
  let estGagnant = false
  if (score === questions.length && questions.length > 0) {
    const { data: gagnant } = await supabaseServiceRole.rpc('tenter_gain', {
      p_participation_id: participationId,
      p_concours_id: participation.concours_id,
    })
    estGagnant = gagnant === true
  }

  // ETAPE 4 — Mettre à jour la participation
  const { error: updateError } = await supabaseServiceRole
    .from('participations')
    .update({
      score,
      temps_secondes: tempsSecondes,
      statut: 'termine',
      fin_at: new Date().toISOString(),
    })
    .eq('id', participationId)

  if (updateError) {
    console.error('[soumettre] Erreur update:', updateError.message)
    return NextResponse.json({ error: 'Erreur lors de la soumission.' }, { status: 500 })
  }

  // ETAPE 5 — Notifications si gagnant (Promise.allSettled : échec de notif n'annule pas la soumission)
  if (estGagnant && profil) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    await Promise.allSettled([
      fetch(`${baseUrl}/api/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, concoursId: participation.concours_id, type: 'gagnant' }),
      }),
      fetch(`${baseUrl}/api/notifications/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: profil.whatsapp,
          prenom: profil.prenom,
          lot: concours?.description_lot,
        }),
      }),
    ])
  }

  // ETAPE 6 — Retourner le résultat (jamais les bonnes réponses)
  console.log('[soumettre] → 200 score:', score, '/', questions.length, '| gagnant:', estGagnant)
  return NextResponse.json({ score, estGagnant, tempsSecondes, totalQuestions: questions.length })
}
