import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const { data: profil } = await supabaseServiceRole
    .from('profiles')
    .select('code_parrainage, solde_gains')
    .eq('id', user.id)
    .single()

  if (!profil) return NextResponse.json({ erreur: 'Profil introuvable' }, { status: 404 })

  // Filleuls : personnes qui ont utilisé ce code à l'inscription
  const { data: filleulProfiles } = await supabaseServiceRole
    .from('profiles')
    .select('id, prenom, created_at')
    .eq('parraine_par', profil.code_parrainage)
    .order('created_at', { ascending: false })

  const filleulIds = (filleulProfiles ?? []).map(f => f.id)

  // Gains par filleul (somme des commissions)
  const gainsMap: Record<string, number> = {}
  if (filleulIds.length > 0) {
    const { data: gains } = await supabaseServiceRole
      .from('gains_parrainage')
      .select('filleul_id, commission')
      .eq('parrain_id', user.id)
      .in('filleul_id', filleulIds)

    for (const g of gains ?? []) {
      gainsMap[g.filleul_id] = (gainsMap[g.filleul_id] ?? 0) + g.commission
    }
  }

  const filleuls = (filleulProfiles ?? []).map(f => ({
    prenom: f.prenom,
    created_at: f.created_at,
    gains: gainsMap[f.id] ?? 0,
  }))

  return NextResponse.json({
    code_parrainage: profil.code_parrainage,
    solde_gains: profil.solde_gains,
    filleuls,
  })
}
