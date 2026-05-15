export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import Navbar from '@/components/Navbar'
import FormulaireModificationTombola from './FormulaireModificationTombola'

export default async function PageModifierTombola({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion?redirect=/organisateur')

  const { data: organisateur } = await supabaseServiceRole
    .from('organisateurs')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!organisateur) redirect('/organisateur')

  const { data: tombola } = await supabaseServiceRole
    .from('tombola')
    .select('id, titre, lot, description, photo_url')
    .eq('id', id)
    .eq('organisateur_id', organisateur.id)
    .single()

  if (!tombola) redirect('/organisateur')

  return (
    <>
      <Navbar />
      <FormulaireModificationTombola tombola={tombola} />
    </>
  )
}
