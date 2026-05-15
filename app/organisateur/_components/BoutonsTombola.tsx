'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import BoutonPartager from '@/components/BoutonPartager'

interface Props {
  id: string
  titre: string
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ata-macls-projects-ed759868.vercel.app'

export default function BoutonsTombola({ id, titre }: Props) {
  const router = useRouter()
  const [en_cours, setEnCours] = useState<string | null>(null)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const url = `${BASE_URL}/tombola/${id}`

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOuvert(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function patcher(body: Record<string, unknown>, label: string) {
    setEnCours(label)
    setMenuOuvert(false)
    const res = await fetch(`/api/organisateur/tombola/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const json = await res.json()
      alert(json.erreur || 'Erreur serveur')
    }
    setEnCours(null)
    router.refresh()
  }

  async function supprimer() {
    setMenuOuvert(false)
    if (!confirm('Êtes-vous sûr ? Cette action est irréversible.')) return
    setEnCours('delete')
    const res = await fetch(`/api/organisateur/tombola/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json()
      alert(json.erreur || 'Erreur serveur')
    }
    setEnCours(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2 shrink-0 items-center">
      <BoutonPartager url={url} titre={titre} />

      <div ref={ref} className="relative">
        <button
          onClick={() => setMenuOuvert(o => !o)}
          disabled={en_cours !== null}
          className="rounded-xl bg-ata-blue text-white text-xs font-semibold px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
        >
          {en_cours ? '…' : 'Gérer'}
        </button>

        {menuOuvert && (
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
            <button
              onClick={() => { setMenuOuvert(false); router.push(`/organisateur/tombola/${id}/modifier`) }}
              className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ✏️ Modifier
            </button>
            <div className="h-px bg-gray-100 my-1" />
            <button
              onClick={() => patcher({ archive: false, statut: 'active' }, 'activer')}
              className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors"
            >
              ✅ Activer
            </button>
            <button
              onClick={() => patcher({ statut: 'brouillon', archive: false }, 'brouillon')}
              className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors"
            >
              📝 Brouillon
            </button>
            <button
              onClick={() => patcher({ archive: true }, 'archiver')}
              className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              📦 Archiver
            </button>
            <div className="h-px bg-gray-100 my-1" />
            <button
              onClick={supprimer}
              className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              🗑️ Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
