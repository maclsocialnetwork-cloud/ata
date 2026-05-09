import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

export default async function PageOrganisateur() {
  console.log('[organisateur] 1. Début du rendu')

  const supabase = await createClient()
  console.log('[organisateur] 2. Client Supabase créé')

  const { data: { user } } = await supabase.auth.getUser()
  console.log('[organisateur] 3. Utilisateur:', user?.id ?? 'non connecté')

  if (!user) {
    console.log('[organisateur] 4. Redirection vers /connexion')
    redirect('/connexion?redirect=/organisateur')
  }

  console.log('[organisateur] 5. Rendu de la page minimale')

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-ata-blue mb-4">
          Tableau de bord – version minimaliste
        </h1>
        <p className="text-gray-500 mb-6">
          Utilisateur connecté : <span className="font-mono text-sm">{user.id}</span>
        </p>
        <Link
          href="/organisateur/concours/nouveau"
          className="inline-block bg-ata-orange text-white font-semibold rounded-xl px-6 py-3 text-sm hover:opacity-90 transition-opacity"
        >
          Nouveau concours
        </Link>
      </main>
    </>
  )
}
