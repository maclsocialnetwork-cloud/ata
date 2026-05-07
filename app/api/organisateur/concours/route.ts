import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { data: organisateur } = await supabase
    .from('organisateurs')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!organisateur) {
    return NextResponse.json({ erreur: 'Profil organisateur introuvable' }, { status: 404 })
  }

  const body = await req.json()
  const { titre, description, photo_lot_url, description_lot, duree_minutes, date_debut, statut } = body

  if (!titre || !date_debut || !duree_minutes) {
    return NextResponse.json({ erreur: 'Titre, date de début et durée sont requis' }, { status: 400 })
  }

  const nb = Math.max(1, Number(duree_minutes) || 15)
  const date_fin = new Date(new Date(date_debut).getTime() + nb * 60 * 1000).toISOString()

  const { data: concours, error } = await supabase
    .from('concours')
    .insert({
      organisateur_id: organisateur.id,
      titre,
      description: description || null,
      photo_lot_url: photo_lot_url || null,
      description_lot: description_lot || null,
      duree_minutes: nb,
      date_debut,
      date_fin,
      statut: statut || 'brouillon',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 })

  return NextResponse.json({ id: concours.id })
}
