import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'

async function resolveOrganisateurId(userId: string): Promise<string | null> {
  const { data } = await supabaseServiceRole
    .from('organisateurs')
    .select('id')
    .eq('user_id', userId)
    .single()
  return data?.id ?? null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const organisateurId = await resolveOrganisateurId(user.id)
  if (!organisateurId) return NextResponse.json({ erreur: 'Organisateur introuvable' }, { status: 403 })

  const body = await req.json()
  const { archive, statut } = body

  const updates: Record<string, unknown> = {}
  if (typeof archive === 'boolean') updates.archive = archive
  if (typeof statut === 'string') updates.statut = statut

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ erreur: 'Aucun champ valide à mettre à jour' }, { status: 400 })
  }

  const { error } = await supabaseServiceRole
    .from('tombola')
    .update(updates)
    .eq('id', id)
    .eq('organisateur_id', organisateurId)

  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const organisateurId = await resolveOrganisateurId(user.id)
  if (!organisateurId) return NextResponse.json({ erreur: 'Organisateur introuvable' }, { status: 403 })

  const { error } = await supabaseServiceRole
    .from('tombola')
    .update({ deleted: true })
    .eq('id', id)
    .eq('organisateur_id', organisateurId)

  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
