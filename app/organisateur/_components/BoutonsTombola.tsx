'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import BoutonPartager from '@/components/BoutonPartager'

interface Props {
  id: string
  titre: string
  archive: boolean
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ata-macls-projects-ed759868.vercel.app'

export default function BoutonsTombola({ id, titre, archive }: Props) {
  const router = useRouter()
  const [en_cours, setEnCours] = useState<'archive' | 'delete' | null>(null)

  const url = `${BASE_URL}/tombola/${id}`

  async function patcher(valeur: boolean) {
    setEnCours('archive')
    const res = await fetch(`/api/organisateur/tombola/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archive: valeur }),
    })
    if (!res.ok) {
      const json = await res.json()
      alert(json.erreur || 'Erreur serveur')
    }
    setEnCours(null)
    router.refresh()
  }

  async function supprimer() {
    if (!confirm('Supprimer définitivement cette tombola ? Cette action est irréversible.')) return
    setEnCours('delete')
    const res = await fetch(`/api/organisateur/tombola/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json()
      alert(json.erreur || 'Erreur serveur')
    }
    setEnCours(null)
    router.refresh()
  }

  const desactive = en_cours !== null

  return (
    <div className="flex flex-col gap-2 shrink-0 items-end">
      {/* Partage */}
      <BoutonPartager url={url} titre={titre} />

      {/* Actions */}
      <div className="flex gap-1.5">
        {archive ? (
          <button
            onClick={() => patcher(false)}
            disabled={desactive}
            className="rounded-xl border border-green-500 text-green-600 text-xs font-medium px-3 py-1.5 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {en_cours === 'archive' ? '…' : 'Réactiver'}
          </button>
        ) : (
          <button
            onClick={() => patcher(true)}
            disabled={desactive}
            className="rounded-xl border border-yellow-500 text-yellow-600 text-xs font-medium px-3 py-1.5 hover:bg-yellow-50 transition-colors disabled:opacity-50"
          >
            {en_cours === 'archive' ? '…' : 'Archiver'}
          </button>
        )}

        <button
          onClick={supprimer}
          disabled={desactive}
          className="rounded-xl border border-red-400 text-red-500 text-xs font-medium px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {en_cours === 'delete' ? '…' : 'Supprimer'}
        </button>
      </div>
    </div>
  )
}
