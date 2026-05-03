import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
          {user ? (
            <Link
              href="/mon-compte"
              className="bg-ata-blue text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Mon compte
            </Link>
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
