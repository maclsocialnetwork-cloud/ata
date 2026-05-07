import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

async function verifieAcces(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  concoursId: string
): Promise<boolean> {
  const { data: org } = await supabase
    .from('organisateurs')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (!org) return false

  const { data: c } = await supabase
    .from('concours')
    .select('id')
    .eq('id', concoursId)
    .eq('organisateur_id', org.id)
    .single()
  return !!c
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ concoursId: string }> }
) {
  const { concoursId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const ok = await verifieAcces(supabase, user.id, concoursId)
  if (!ok) return NextResponse.json({ erreur: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { sujet, nombre } = body

  if (!sujet?.trim()) return NextResponse.json({ erreur: 'Le sujet est requis' }, { status: 400 })

  const nb = Math.min(Math.max(parseInt(nombre) || 5, 1), 20)

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Génère ${nb} questions QCM en français sur le sujet suivant : "${sujet}".

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après. Format exact de chaque objet :
{
  "enonce": "texte de la question",
  "choix_a": "premier choix",
  "choix_b": "deuxième choix",
  "choix_c": "troisième choix",
  "choix_d": "quatrième choix",
  "bonne_rep": "a"
}

La valeur de "bonne_rep" doit être exactement "a", "b", "c" ou "d".
Questions claires, choix plausibles, une seule bonne réponse par question.`,
        },
      ],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur IA'
    return NextResponse.json({ erreur: `Erreur lors de la génération : ${msg}` }, { status: 500 })
  }

  const texte = message.content[0].type === 'text' ? message.content[0].text : ''

  let questions: unknown[]
  try {
    const match = texte.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Format de réponse invalide')
    questions = JSON.parse(match[0])
    if (!Array.isArray(questions)) throw new Error('Réponse non tableau')
  } catch {
    return NextResponse.json({ erreur: 'La réponse de l\'IA n\'est pas au bon format' }, { status: 500 })
  }

  return NextResponse.json({ questions })
}
