import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'

async function verifieAcces(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  concoursId: string
): Promise<boolean> {
  const { data: org } = await supabase
    .from('organisateurs')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (!org) return false

  const { data: c } = await supabase
    .from('concours')
    .select('id')
    .eq('id', concoursId)
    .eq('organisateur_id', org.id)
    .single()
  return !!c
}

type QuestionInput = {
  enonce?: string
  question?: string
  choix_a: string
  choix_b: string
  choix_c: string
  choix_d: string
  bonne_rep: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ concoursId: string }> }
) {
  const { concoursId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const ok = await verifieAcces(supabase, user.id, concoursId)
  if (!ok) return NextResponse.json({ erreur: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { questions } = body as { questions: QuestionInput[] }

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ erreur: 'Aucune question à importer' }, { status: 400 })
  }

  // Valider les questions
  const VALIDES = new Set(['a', 'b', 'c', 'd'])
  for (const q of questions) {
    const texte = q.enonce || q.question
    if (!texte || !q.choix_a || !q.choix_b || !q.choix_c || !q.choix_d || !VALIDES.has(q.bonne_rep)) {
      return NextResponse.json({ erreur: 'Données invalides dans le fichier (vérifiez les colonnes et la colonne bonne_rep)' }, { status: 400 })
    }
  }

  const { data: derniere } = await supabaseServiceRole
    .from('questions')
    .select('ordre')
    .eq('concours_id', concoursId)
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()

  let ordre = (derniere?.ordre ?? 0) + 1

  const rows = questions.map((q) => ({
    concours_id: concoursId,
    enonce: (q.enonce || q.question)!,
    choix_a: q.choix_a,
    choix_b: q.choix_b,
    choix_c: q.choix_c,
    choix_d: q.choix_d,
    bonne_rep: q.bonne_rep,
    ordre: ordre++,
  }))

  const { error } = await supabaseServiceRole.from('questions').insert(rows)

  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 })

  return NextResponse.json({ importees: rows.length })
}
