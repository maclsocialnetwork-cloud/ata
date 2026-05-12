export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import QuestionsClient from './QuestionsClient'

export default async function PageQuestions({
  params,
}: {
  params: Promise<{ concoursId: string }>
}) {
  const { concoursId } = await params
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
    .select('id, titre')
    .eq('id', concoursId)
    .eq('organisateur_id', organisateur.id)
    .single()

  if (!concours) redirect('/organisateur')

  return (
    <>
      <Navbar />
      <QuestionsClient concoursId={concoursId} concoursTitre={concours.titre} />
    </>
  )
}
