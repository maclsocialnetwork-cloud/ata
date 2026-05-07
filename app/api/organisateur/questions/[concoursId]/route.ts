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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ concoursId: string }> }
) {
  const { concoursId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const ok = await verifieAcces(supabase, user.id, concoursId)
  if (!ok) return NextResponse.json({ erreur: 'Accès refusé' }, { status: 403 })

  const { data: questions } = await supabaseServiceRole
    .from('questions')
    .select('id, enonce, choix_a, choix_b, choix_c, choix_d, bonne_rep, ordre')
    .eq('concours_id', concoursId)
    .order('ordre', { ascending: true })

  return NextResponse.json(questions ?? [])
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
  const { enonce, choix_a, choix_b, choix_c, choix_d, bonne_rep } = body

  if (!enonce || !choix_a || !choix_b || !choix_c || !choix_d || !bonne_rep) {
    return NextResponse.json({ erreur: 'Tous les champs sont requis' }, { status: 400 })
  }

  if (!['a', 'b', 'c', 'd'].includes(bonne_rep)) {
    return NextResponse.json({ erreur: 'Bonne réponse invalide (a, b, c ou d)' }, { status: 400 })
  }

  const { data: derniere } = await supabaseServiceRole
    .from('questions')
    .select('ordre')
    .eq('concours_id', concoursId)
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ordre = (derniere?.ordre ?? 0) + 1

  const { data, error } = await supabaseServiceRole
    .from('questions')
    .insert({ concours_id: concoursId, enonce, choix_a, choix_b, choix_c, choix_d, bonne_rep, ordre })
    .select('id, enonce, choix_a, choix_b, choix_c, choix_d, bonne_rep, ordre')
    .single()

  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 })

  return NextResponse.json(data)
}
