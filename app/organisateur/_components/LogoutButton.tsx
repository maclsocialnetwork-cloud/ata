'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function deconnecter() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={deconnecter}
      className="rounded-xl bg-red-500 text-white text-sm font-semibold px-6 py-2.5 hover:bg-red-600 transition-colors"
    >
      Se déconnecter
    </button>
  )
}
