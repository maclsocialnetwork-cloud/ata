import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getOrganisateurId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('organisateurs')
    .select('id')
    .eq('user_id', userId)
    .single()
  return data?.id ?? null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const organisateurId = await getOrganisateurId(supabase, user.id)
  if (!organisateurId) return NextResponse.json({ erreur: 'Accès refusé' }, { status: 403 })

  const { data: concours } = await supabase
    .from('concours')
    .select('*')
    .eq('id', id)
    .eq('organisateur_id', organisateurId)
    .single()

  if (!concours) return NextResponse.json({ erreur: 'Concours introuvable' }, { status: 404 })

  return NextResponse.json(concours)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const { data: profil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profil || (profil.role !== 'organisateur' && profil.role !== 'admin')) {
    return NextResponse.json({ erreur: 'Accès refusé' }, { status: 403 })
  }

  const organisateurId = await getOrganisateurId(supabase, user.id)
  if (!organisateurId) return NextResponse.json({ erreur: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { titre, description, photo_lot_url, description_lot, duree_minutes, date_debut, date_fin, statut } = body

  if (!titre || !date_debut || !date_fin) {
    return NextResponse.json({ erreur: 'Titre, date de début et date de fin sont requis' }, { status: 400 })
  }

  const { error } = await supabase
    .from('concours')
    .update({
      titre,
      description: description || null,
      photo_lot_url: photo_lot_url || null,
      description_lot: description_lot || null,
      duree_minutes: Number(duree_minutes) || 20,
      date_debut,
      date_fin,
      statut,
    })
    .eq('id', id)
    .eq('organisateur_id', organisateurId)

  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
