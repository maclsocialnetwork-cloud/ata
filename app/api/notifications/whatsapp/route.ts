import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp } from '@/lib/callmebot'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const { whatsapp, prenom, lot } = body ?? {}

  if (!whatsapp || !prenom) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  const message = [
    `Félicitations ${prenom} !`,
    `Vous avez remporté le concours ATA.`,
    lot ? `Lot gagné : ${lot}.` : '',
    `Connectez-vous sur jeu.achatombolafrique.com pour réclamer votre lot.`,
  ]
    .filter(Boolean)
    .join(' ')

  const sent = await sendWhatsApp(whatsapp, message)

  console.log('[notifications/whatsapp] sent:', sent, '→', whatsapp)
  return NextResponse.json({ sent })
}
