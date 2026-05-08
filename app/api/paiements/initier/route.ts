import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import { initierPaiement } from '@/lib/cinetpay'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { type, participationId, tombolaId } = body ?? {}

  if (!type || (type !== 'score' && type !== 'ticket')) {
    return NextResponse.json({ erreur: 'Type invalide (score ou ticket)' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const notifyUrl = `${baseUrl}/api/paiements/webhook`

  let montant = 0
  let description = ''
  let returnUrl = ''
  let insertData: Record<string, unknown> = {}

  // ── Score ────────────────────────────────────────────────────────────────
  if (type === 'score') {
    if (!participationId) {
      return NextResponse.json({ erreur: 'participationId requis' }, { status: 400 })
    }

    const { data: participation } = await supabaseServiceRole
      .from('participations')
      .select('id, statut, score_paye, user_id')
      .eq('id', participationId)
      .eq('user_id', user.id)
      .single()

    if (!participation) {
      return NextResponse.json({ erreur: 'Participation introuvable' }, { status: 404 })
    }
    if (participation.statut !== 'termine') {
      return NextResponse.json({ erreur: 'Le quiz n\'est pas encore terminé' }, { status: 400 })
    }
    if (participation.score_paye) {
      return NextResponse.json({ erreur: 'Score déjà payé' }, { status: 409 })
    }

    montant = Number(process.env.MONTANT_SCORE) || 500
    description = 'Déverrouillage du score QCM'
    returnUrl = `${baseUrl}/paiement/retour?participationId=${participationId}`
    insertData = { participation_id: participationId }
  }

  // ── Ticket tombola ────────────────────────────────────────────────────────
  if (type === 'ticket') {
    if (!tombolaId) {
      return NextResponse.json({ erreur: 'tombolaId requis' }, { status: 400 })
    }

    const { data: tombola } = await supabaseServiceRole
      .from('tombola')
      .select('id, type_tombola, statut, prix_ticket, date_debut, date_fin')
      .eq('id', tombolaId)
      .single()

    if (!tombola) {
      return NextResponse.json({ erreur: 'Tombola introuvable' }, { status: 404 })
    }
    if (tombola.type_tombola !== 'achat') {
      return NextResponse.json({ erreur: 'Cette tombola n\'accepte pas d\'achat de ticket' }, { status: 400 })
    }
    if (tombola.statut !== 'active') {
      return NextResponse.json({ erreur: 'Tombola non active' }, { status: 400 })
    }
    const maintenant = new Date()
    if (maintenant < new Date(tombola.date_debut) || maintenant > new Date(tombola.date_fin)) {
      return NextResponse.json({ erreur: 'Tombola hors période d\'achat' }, { status: 400 })
    }

    // Vérifie si l'utilisateur a déjà un ticket
    const { data: ticketExistant } = await supabaseServiceRole
      .from('tickets')
      .select('id')
      .eq('tombola_id', tombolaId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (ticketExistant) {
      return NextResponse.json({ erreur: 'Vous avez déjà un ticket pour cette tombola' }, { status: 409 })
    }

    montant = tombola.prix_ticket
    description = 'Achat ticket tombola'
    returnUrl = `${baseUrl}/paiement/retour?tombolaId=${tombolaId}`
    insertData = { tombola_id: tombolaId }
  }

  // ── Insertion paiement + appel CinetPay ──────────────────────────────────
  const transactionId = `${type}-${user.id.slice(0, 8)}-${Date.now()}`

  const { data: paiement, error: insertError } = await supabaseServiceRole
    .from('paiements')
    .insert({
      user_id: user.id,
      type,
      montant,
      statut: 'en_attente',
      cinetpay_transaction_id: transactionId,
      ...insertData,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[paiements/initier] Erreur insertion:', insertError.message)
    return NextResponse.json({ erreur: insertError.message }, { status: 500 })
  }

  console.log('[paiements/initier] Paiement créé:', paiement.id, '| type:', type, '| montant:', montant)

  try {
    const { paymentUrl } = await initierPaiement({
      transactionId,
      montant,
      description,
      userId: user.id,
      returnUrl,
      notifyUrl,
    })
    return NextResponse.json({ paymentUrl })
  } catch (err) {
    console.error('[paiements/initier] Erreur CinetPay:', err)
    return NextResponse.json({ erreur: 'Erreur lors de l\'initialisation du paiement' }, { status: 500 })
  }
}
