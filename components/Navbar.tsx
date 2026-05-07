'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const [prenom, setPrenom] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function chargerUtilisateur() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: profil } = await supabase
        .from('profiles')
        .select('prenom')
        .eq('id', user.id)
        .single()

      setPrenom(profil?.prenom ?? null)
    }

    chargerUtilisateur()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUserId(null)
        setPrenom(null)
      } else if (event === 'SIGNED_IN') {
        chargerUtilisateur()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleDeconnexion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-ata-orange font-extrabold text-2xl tracking-tight">ATA</span>
          <span className="hidden sm:block text-ata-blue text-sm font-medium">
            Achat Ombol Afrique
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-600 hover:text-ata-blue transition-colors hidden sm:block">
            Accueil
          </Link>

          {userId ? (
            <>
              <Link href="/mon-compte" className="text-sm text-gray-600 hover:text-ata-blue transition-colors hidden sm:block">
                Mon compte
              </Link>
              {prenom && (
                <span className="text-sm text-gray-700 hidden sm:block">
                  Bonjour <span className="font-semibold text-ata-blue">{prenom}</span>
                </span>
              )}
              <button
                onClick={handleDeconnexion}
                className="border border-ata-orange text-ata-orange text-sm font-semibold px-5 py-2 rounded-full hover:bg-ata-orange hover:text-white transition-colors"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <Link
              href="/connexion"
              className="bg-ata-orange text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
