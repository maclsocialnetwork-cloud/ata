import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ role: null, prenom: null })
  }

  const { data: profil } = await supabaseServiceRole
    .from('profiles')
    .select('prenom, role')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json({
    role: profil?.role ?? null,
    prenom: profil?.prenom ?? null,
  })
}
