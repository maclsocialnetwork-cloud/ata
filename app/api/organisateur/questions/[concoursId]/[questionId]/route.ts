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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ concoursId: string; questionId: string }> }
) {
  const { concoursId, questionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const ok = await verifieAcces(supabase, user.id, concoursId)
  if (!ok) return NextResponse.json({ erreur: 'Accès refusé' }, { status: 403 })

  const { error } = await supabaseServiceRole
    .from('questions')
    .delete()
    .eq('id', questionId)
    .eq('concours_id', concoursId)

  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
