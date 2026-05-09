'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  id: string
  archive: boolean
}

export default function BoutonsTombola({ id, archive }: Props) {
  const router = useRouter()
  const [en_cours, setEnCours] = useState<'archive' | 'delete' | null>(null)
  const [copie, setCopie] = useState(false)

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

  async function partager() {
    const url = `https://app.achatombolafrique.com/tombola/${id}?preview=true`
    try {
      await navigator.clipboard.writeText(url)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      alert(`Lien : ${url}`)
    }
  }

  const desactive = en_cours !== null

  return (
    <div className="flex gap-2 shrink-0 flex-wrap justify-end">
      <button
        onClick={partager}
        className="rounded-xl border border-gray-300 text-gray-600 text-xs font-medium px-3 py-1.5 hover:bg-gray-50 transition-colors"
      >
        {copie ? '✓ Copié' : 'Partager'}
      </button>

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
  )
}
