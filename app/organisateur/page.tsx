import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './_components/LogoutButton'

export default async function PageOrganisateur() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    redirect('/connexion?redirect=/organisateur')
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <p className="text-lg font-semibold text-gray-800 mb-2">
        Tableau de bord – version test
      </p>
      <p className="text-sm text-gray-500 mb-8">
        Utilisateur connecté : {data.user.id}
      </p>
      <LogoutButton />
    </main>
  )
}
