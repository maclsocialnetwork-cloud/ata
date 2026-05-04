import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  console.log('[notifications/email] À implémenter —', body)
  // TODO Session 8 : intégrer Brevo pour envoyer l'email au gagnant
  return NextResponse.json({ sent: false })
}
