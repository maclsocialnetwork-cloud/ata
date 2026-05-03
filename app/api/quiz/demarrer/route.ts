import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import { getClientIP } from '@/lib/utils/ip'
import { shuffle } from '@/lib/utils/shuffle'

export async function POST(request: NextRequest) {
  console.log('[demarrer] Requête reçue')

  // 1. Valider que l'utilisateur est authentifié
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log('[demarrer] → 401 Non authentifié')
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  console.log('[demarrer] Utilisateur authentifié :', user.id)

  const body = await request.json().catch(() => null)
  const concoursId: string | undefined = body?.concoursId

  if (!concoursId) {
    console.log('[demarrer] → 400 concoursId manquant')
    return NextResponse.json({ error: 'Paramètre concoursId manquant.' }, { status: 400 })
  }

  const userId = user.id
  console.log('[demarrer] concoursId:', concoursId)

  // 2. Lire les questions via service_role (les RLS bloquent la lecture normale)
  const { data: questions, error: questionsError } = await supabaseServiceRole
    .from('questions')
    .select('*')
    .eq('concours_id', concoursId)

  if (questionsError) {
    console.error('[demarrer] Erreur lecture questions:', questionsError.message)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des questions.' },
      { status: 500 }
    )
  }

  console.log('[demarrer] Questions trouvées :', questions?.length ?? 0)

  // 3. Vérifier qu'il y a au moins 100 questions
  if (!questions || questions.length < 100) {
    console.log('[demarrer] → 400 Pas assez de questions')
    return NextResponse.json(
      {
        error: `Ce concours n'a pas encore 100 questions (${questions?.length ?? 0} trouvées).`,
      },
      { status: 400 }
    )
  }

  // 4. Mélanger les IDs des questions (ordre unique par participant)
  const questionIdsShuffled: string[] = shuffle(questions.map((q) => q.id))

  // 5. Récupérer l'IP du participant
  const ip = getClientIP(request)

  // 6. Créer l'enregistrement de participation
  const { data: participation, error: participationError } = await supabaseServiceRole
    .from('participations')
    .insert({
      user_id: userId,
      concours_id: concoursId,
      ip_address: ip,
      questions_ordre: JSON.stringify(questionIdsShuffled),
      reponses: '{}',
      statut: 'en_cours',
      debut_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (participationError || !participation) {
    console.error('[demarrer] Erreur création participation:', participationError?.message)
    return NextResponse.json({ error: 'Impossible de démarrer le quiz.' }, { status: 500 })
  }

  console.log('[demarrer] Participation créée :', participation.id)

  // 7. Préparer la première question (index 0 dans l'ordre mélangé)
  const premiereQuestionId = questionIdsShuffled[0]
  const premiereQuestion = questions.find((q) => q.id === premiereQuestionId)!

  // Mélanger les choix a/b/c/d — on conserve la correspondance lettre/texte
  // mais on n'envoie JAMAIS bonne_rep au navigateur
  const choixOriginaux = [
    { lettre: 'a', texte: premiereQuestion.a as string },
    { lettre: 'b', texte: premiereQuestion.b as string },
    { lettre: 'c', texte: premiereQuestion.c as string },
    { lettre: 'd', texte: premiereQuestion.d as string },
  ]
  const choixMelanges = shuffle(choixOriginaux)

  console.log('[demarrer] → 200 Quiz démarré')
  return NextResponse.json({
    participationId: participation.id,
    indexCourant: 0,
    question: {
      id: premiereQuestion.id,
      enonce: premiereQuestion.enonce,
      choix: choixMelanges.map((c) => c.texte),
      lettres: choixMelanges.map((c) => c.lettre),
    },
  })
}
