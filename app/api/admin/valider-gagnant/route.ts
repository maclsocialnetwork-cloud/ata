import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/brevo'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  // Vérifier le rôle admin
  const { data: profilAdmin } = await supabaseServiceRole
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profilAdmin?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { verificationId, action, motif } = body ?? {}

  if (!verificationId || !['valider', 'refuser'].includes(action)) {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })
  }

  if (action === 'refuser' && !String(motif ?? '').trim()) {
    return NextResponse.json({ error: 'Motif de refus requis.' }, { status: 400 })
  }

  // Charger la vérification pour l'email de notification
  const { data: verification } = await supabaseServiceRole
    .from('verifications_identite')
    .select(
      `id, user_id,
       participations!participation_id (
         concours!concours_id (titre, description_lot)
       )`,
    )
    .eq('id', verificationId)
    .single()

  if (!verification) {
    return NextResponse.json({ error: 'Vérification introuvable.' }, { status: 404 })
  }

  // Mettre à jour le statut
  const { error: updateError } = await supabaseServiceRole
    .from('verifications_identite')
    .update({
      statut: action === 'valider' ? 'valide' : 'refuse',
      verifie_par: user.id,
      verifie_at: new Date().toISOString(),
      ...(action === 'refuser' ? { motif_refus: String(motif).trim() } : {}),
    })
    .eq('id', verificationId)

  if (updateError) {
    console.error('[valider-gagnant] Erreur update:', updateError.message)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
  }

  // Notification email uniquement en cas de validation
  if (action === 'valider') {
    const [userRes, profilRes] = await Promise.all([
      supabaseServiceRole.auth.admin.getUserById(verification.user_id),
      supabaseServiceRole.from('profiles').select('prenom').eq('id', verification.user_id).single(),
    ])

    const email = userRes.data.user?.email
    const prenom = profilRes.data?.prenom ?? 'Participant'
    const concours = (verification.participations as unknown as { concours: { titre: string; description_lot: string | null } | null } | null)?.concours

    if (email) {
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#5BAD2F;padding:40px 32px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#fff;margin:0;">Dossier validé !</h1>
          </div>
          <div style="padding:32px;background:#f9f9f9;border-radius:0 0 8px 8px;">
            <p>Bonjour ${prenom},</p>
            <p>
              Votre dossier de vérification d'identité pour le concours
              <strong>${concours?.titre ?? ''}</strong> a été validé.
            </p>
            ${concours?.description_lot ? `<p>Lot : <strong>${concours.description_lot}</strong></p>` : ''}
            <p>Vous serez contacté prochainement par l'organisateur pour recevoir votre lot.</p>
            <p style="color:#999;font-size:13px;margin-top:24px;">L'équipe ATA — Achat Ombol Afrique</p>
          </div>
        </div>
      `
      await sendEmail(email, 'Votre dossier a été validé — ATA', html).catch(err =>
        console.error('[valider-gagnant] Erreur email:', err),
      )
    }
  }

  console.log('[valider-gagnant] → 200 action:', action, 'verificationId:', verificationId)
  return NextResponse.json({ ok: true })
}
