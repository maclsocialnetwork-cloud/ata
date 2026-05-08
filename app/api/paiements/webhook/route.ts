import { NextRequest, NextResponse } from 'next/server'

// TODO: vérifier la signature CinetPay et mettre à jour le statut du paiement
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[paiements/webhook] Corps reçu:', JSON.stringify(body, null, 2))

    // TODO: extraire cpm_trans_id, vérifier avec l'API CinetPay, puis :
    // - Mettre à jour paiements.statut = 'reussi' / 'echoue'
    // - Si type = 'score' : mettre à jour participations.score_paye = true
    // - Si type = 'ticket' : créer une ligne dans tickets avec numero_ticket unique

  } catch {
    console.error('[paiements/webhook] Corps non JSON — peut-être form-data')
  }

  return NextResponse.json({ ok: true })
}
