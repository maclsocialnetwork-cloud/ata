import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import { getClientIP } from '@/lib/utils/ip'

export async function POST(request: NextRequest) {
  console.log('[verifier-acces] Requête reçue')

  // 1. Valider que l'utilisateur est authentifié
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log('[verifier-acces] → 401 Non authentifié')
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  console.log('[verifier-acces] Utilisateur authentifié :', user.id)

  const body = await request.json().catch(() => null)
  const concoursId: string | undefined = body?.concoursId

  if (!concoursId) {
    console.log('[verifier-acces] → 400 concoursId manquant')
    return NextResponse.json({ error: 'Paramètre concoursId manquant.' }, { status: 400 })
  }

  const userId = user.id
  const ip = getClientIP(request)
  console.log('[verifier-acces] concoursId:', concoursId, '| IP:', ip)

  // 2. Récupérer le WhatsApp de l'utilisateur depuis la table profiles
  const { data: profile } = await supabaseServiceRole
    .from('profiles')
    .select('whatsapp')
    .eq('id', userId)
    .single()

  const whatsappUser: string | null = profile?.whatsapp ?? null

  // 3. Vérifier une participation existante par user_id OU adresse IP
  const { data: participationByUserOrIP } = await supabaseServiceRole
    .from('participations')
    .select('id')
    .eq('concours_id', concoursId)
    .or(`user_id.eq.${userId},ip_address.eq.${ip}`)
    .maybeSingle()

  if (participationByUserOrIP) {
    console.log('[verifier-acces] → 403 Déjà participé (user_id ou IP)')
    return NextResponse.json(
      { error: 'Vous avez déjà participé à ce concours.' },
      { status: 403 }
    )
  }

  // 4. Vérifier une participation existante par numéro WhatsApp
  if (whatsappUser) {
    const { data: autresProfiles } = await supabaseServiceRole
      .from('profiles')
      .select('id')
      .eq('whatsapp', whatsappUser)

    const autresIds = (autresProfiles ?? []).map((p: { id: string }) => p.id)

    if (autresIds.length > 0) {
      const { data: participationByWhatsapp } = await supabaseServiceRole
        .from('participations')
        .select('id')
        .eq('concours_id', concoursId)
        .in('user_id', autresIds)
        .maybeSingle()

      if (participationByWhatsapp) {
        console.log('[verifier-acces] → 403 Déjà participé (WhatsApp)')
        return NextResponse.json(
          { error: 'Vous avez déjà participé à ce concours.' },
          { status: 403 }
        )
      }
    }
  }

  // 5. Vérifier que le concours n'a pas encore de gagnant
  const { data: concours } = await supabaseServiceRole
    .from('concours')
    .select('gagnant_trouve')
    .eq('id', concoursId)
    .single()

  if (concours?.gagnant_trouve === true) {
    console.log('[verifier-acces] → 403 Concours terminé')
    return NextResponse.json(
      { error: 'Ce concours est terminé. Un gagnant a été trouvé.' },
      { status: 403 }
    )
  }

  console.log('[verifier-acces] → 200 Accès autorisé')
  return NextResponse.json({ acces: true })
}
