import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
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

  const { data: organisateur } = await supabaseServiceRole
    .from('organisateurs')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!organisateur) {
    console.error('[tombola/POST] Organisateur non trouvé pour user_id:', user.id)
    return NextResponse.json({ erreur: 'Profil organisateur introuvable' }, { status: 404 })
  }

  const body = await req.json()
  const { titre, description, lot, photo_url } = body

  if (!titre?.trim() || !lot?.trim()) {
    return NextResponse.json({ erreur: 'Titre et lot sont requis' }, { status: 400 })
  }

  const { data: tombola, error } = await supabaseServiceRole
    .from('tombola')
    .insert({
      titre: titre.trim(),
      description: description?.trim() || null,
      lot: lot.trim(),
      photo_url: photo_url || null,
      type_tombola: 'participation',
      statut: 'active',
      prix_ticket: null,
      date_debut: null,
      date_fin: null,
      organisateur_id: organisateur.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 })

  return NextResponse.json({ id: tombola.id })
}
