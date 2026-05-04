import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/brevo'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const { userId, concoursId, type } = body ?? {}

  if (!userId || !concoursId || type !== 'gagnant') {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })
  }

  const [userRes, profilRes, concoursRes] = await Promise.all([
    supabaseServiceRole.auth.admin.getUserById(userId),
    supabaseServiceRole.from('profiles').select('prenom, nom').eq('id', userId).single(),
    supabaseServiceRole
      .from('concours')
      .select('titre, description_lot')
      .eq('id', concoursId)
      .single(),
  ])

  const email = userRes.data.user?.email
  const profil = profilRes.data
  const concours = concoursRes.data

  if (!email || !profil || !concours) {
    console.error('[notifications/email] Données manquantes:', { email: !!email, profil: !!profil, concours: !!concours })
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 404 })
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#5BAD2F;padding:40px 32px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:28px;">Félicitations ${profil.prenom} !</h1>
        <p style="color:#fff;margin:12px 0 0;font-size:18px;">Vous avez gagné !</p>
      </div>
      <div style="padding:32px;background:#f9f9f9;border-radius:0 0 8px 8px;">
        <p style="font-size:16px;color:#333;">
          Vous avez remporté le concours <strong>${concours.titre}</strong>.
        </p>
        ${concours.description_lot ? `<p style="font-size:15px;color:#555;">Lot gagné : <strong>${concours.description_lot}</strong></p>` : ''}
        <p style="font-size:14px;color:#666;margin-top:24px;">
          Connectez-vous sur
          <a href="https://jeu.achatombolafrique.com" style="color:#F47920;font-weight:bold;">
            jeu.achatombolafrique.com
          </a>
          pour réclamer votre lot.
        </p>
      </div>
    </div>
  `

  const sent = await sendEmail(
    email,
    `Félicitations ! Vous avez gagné — ${concours.titre}`,
    html,
  )

  console.log('[notifications/email] sent:', sent, '→', email)
  return NextResponse.json({ sent })
}
