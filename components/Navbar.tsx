'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const [prenom, setPrenom] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function chargerUtilisateur() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const res = await fetch('/api/mon-role')
      const profil = res.ok ? await res.json() : null
      setPrenom(profil?.prenom ?? null)
      setRole(profil?.role ?? null)
    }

    chargerUtilisateur()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUserId(null)
        setPrenom(null)
        setRole(null)
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
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Logo et nom */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo-ata.jpg" alt="ATA" width={40} height={40} className="rounded-full object-cover" />
          <span className="inline-block text-ata-blue text-sm font-medium">
            Achat Tombola Afrique
          </span>
        </Link>

        {/* Navigation droite (wrap sur mobile) */}
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <Link href="/" className="text-gray-600 hover:text-ata-blue transition-colors">
            Accueil
          </Link>

          {userId ? (
            <>
              <Link href="/jeux" className="text-gray-600 hover:text-ata-blue transition-colors">
                Jeux
              </Link>
              <Link href="/mon-compte" className="text-gray-600 hover:text-ata-blue transition-colors">
                Mon compte
              </Link>
              {(role === 'organisateur' || role === 'admin') && (
                <Link href="/organisateur" className="text-gray-600 hover:text-ata-blue transition-colors">
                  Organisateur
                </Link>
              )}
              {prenom && (
                <span className="text-gray-700 whitespace-nowrap">
                  Bonjour <span className="font-semibold text-ata-blue">{prenom}</span>
                </span>
              )}
              <button
                onClick={handleDeconnexion}
                className="border border-ata-orange text-ata-orange text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-ata-orange hover:text-white transition-colors"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <Link
              href="/connexion"
              className="bg-ata-orange text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}