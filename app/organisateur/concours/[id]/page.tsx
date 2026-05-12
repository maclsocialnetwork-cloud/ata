export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import FormulaireModification from './FormulaireModification'

export default async function PageModifierConcours({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion?redirect=/organisateur')

  const { data: profil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profil || (profil.role !== 'organisateur' && profil.role !== 'admin')) {
    redirect('/')
  }

  const { data: organisateur } = await supabase
    .from('organisateurs')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!organisateur) redirect('/organisateur')

  const { data: concours } = await supabase
    .from('concours')
    .select('id, titre, description, photo_lot_url, description_lot, duree_minutes, date_debut, date_fin, statut')
    .eq('id', id)
    .eq('organisateur_id', organisateur.id)
    .single()

  if (!concours) redirect('/organisateur')

  return (
    <>
      <Navbar />
      <FormulaireModification concours={concours} />
    </>
  )
}
