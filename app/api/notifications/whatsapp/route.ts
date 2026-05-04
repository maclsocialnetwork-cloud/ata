import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  console.log('[notifications/whatsapp] À implémenter —', body)
  // TODO Session 8 : intégrer l'API WhatsApp pour notifier le gagnant
  return NextResponse.json({ sent: false })
}
