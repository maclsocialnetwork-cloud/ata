import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import { shuffle } from '@/lib/utils/shuffle'

export async function GET(request: NextRequest) {
  console.log('[question] Requête reçue')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const participationId = searchParams.get('participationId')
  const indexStr = searchParams.get('index')

  if (!participationId || indexStr === null) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  const index = parseInt(indexStr, 10)
  if (isNaN(index) || index < 0 || index > 99) {
    return NextResponse.json({ error: 'Index invalide (0-99).' }, { status: 400 })
  }

  // 1. Charger la participation + la durée du concours
  const { data: participation } = await supabaseServiceRole
    .from('participations')
    .select('*, concours:concours_id(duree_minutes)')
    .eq('id', participationId)
    .eq('user_id', user.id)
    .single()

  if (!participation) {
    console.log('[question] → 404 participation introuvable')
    return NextResponse.json({ error: 'Participation introuvable.' }, { status: 404 })
  }

  // 2. Si déjà terminée ou expirée, signaler au client
  if (participation.statut === 'termine' || participation.statut === 'expire') {
    console.log('[question] → 410 participation', participation.statut)
    return NextResponse.json({ statut: participation.statut }, { status: 410 })
  }

  if (participation.statut !== 'en_cours') {
    return NextResponse.json({ error: 'Participation invalide.' }, { status: 400 })
  }

  // 3 & 4. Calculer le temps restant
  const debut = new Date(participation.debut_at).getTime()
  const tempsEcouleSecondes = Math.floor((Date.now() - debut) / 1000)
  const dureeTotaleSecondes = ((participation.concours as { duree_minutes: number })?.duree_minutes ?? 30) * 60
  const tempsRestant = dureeTotaleSecondes - tempsEcouleSecondes

  // 5. Temps écoulé : marquer expirée et retourner 410
  if (tempsRestant <= 0) {
    console.log('[question] → 410 temps écoulé')
    await supabaseServiceRole
      .from('participations')
      .update({ statut: 'expire' })
      .eq('id', participationId)
    return NextResponse.json({ expired: true }, { status: 410 })
  }

  // 6. Trouver l'ID de la question à cet index
  const questionIds: string[] =
    typeof participation.questions_ordre === 'string'
      ? JSON.parse(participation.questions_ordre)
      : participation.questions_ordre

  const questionId = questionIds[index]
  if (!questionId) {
    return NextResponse.json({ error: 'Index hors limites.' }, { status: 400 })
  }

  // 7. Charger la question (sans bonne_rep)
  const { data: question } = await supabaseServiceRole
    .from('questions')
    .select('id, enonce, a, b, c, d')
    .eq('id', questionId)
    .single()

  if (!question) {
    return NextResponse.json({ error: 'Question introuvable.' }, { status: 404 })
  }

  // 8. Mélanger les choix — bonne_rep n'est JAMAIS envoyée
  const choixOriginaux = [
    { lettre: 'a', texte: question.a as string },
    { lettre: 'b', texte: question.b as string },
    { lettre: 'c', texte: question.c as string },
    { lettre: 'd', texte: question.d as string },
  ]
  const choixMelanges = shuffle(choixOriginaux)

  console.log('[question] → 200 index:', index, '| tempsRestant:', tempsRestant)

  // 9. Retourner la question + méta
  return NextResponse.json({
    question: {
      id: question.id,
      enonce: question.enonce,
      choix: choixMelanges.map((c) => c.texte),
      lettres: choixMelanges.map((c) => c.lettre),
    },
    indexCourant: index,
    tempsRestant,
    total: 100,
  })
}
