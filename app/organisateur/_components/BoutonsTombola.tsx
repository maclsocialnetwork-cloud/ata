'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  id: string
  titre: string
  archive: boolean
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ata-macls-projects-ed759868.vercel.app'

export default function BoutonsTombola({ id, titre, archive }: Props) {
  const router = useRouter()
  const [en_cours, setEnCours] = useState<'archive' | 'delete' | null>(null)
  const [copie, setCopie] = useState(false)

  const url = `${BASE_URL}/tombola/${id}`
  const urlEnc = encodeURIComponent(url)
  const titreEnc = encodeURIComponent(titre)

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

  async function copierLien() {
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
    <div className="flex flex-col gap-2 shrink-0 items-end">
      {/* Partage réseaux sociaux */}
      <div className="flex gap-1.5 flex-wrap justify-end">
        <a
          href={`https://wa.me/?text=${urlEnc}`}
          target="_blank" rel="noopener noreferrer"
          className="rounded-lg border border-green-400 text-green-600 text-xs font-medium px-2 py-1 hover:bg-green-50 transition-colors"
          title="Partager sur WhatsApp"
        >
          📱 WA
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${urlEnc}`}
          target="_blank" rel="noopener noreferrer"
          className="rounded-lg border border-blue-500 text-blue-600 text-xs font-medium px-2 py-1 hover:bg-blue-50 transition-colors"
          title="Partager sur Facebook"
        >
          📘 FB
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${urlEnc}`}
          target="_blank" rel="noopener noreferrer"
          className="rounded-lg border border-blue-700 text-blue-800 text-xs font-medium px-2 py-1 hover:bg-blue-50 transition-colors"
          title="Partager sur LinkedIn"
        >
          💼 LI
        </a>
        <a
          href={`mailto:?subject=${titreEnc}&body=${urlEnc}`}
          className="rounded-lg border border-gray-400 text-gray-600 text-xs font-medium px-2 py-1 hover:bg-gray-50 transition-colors"
          title="Partager par Email"
        >
          📧
        </a>
        <button
          onClick={copierLien}
          className="rounded-lg border border-gray-300 text-gray-500 text-xs font-medium px-2 py-1 hover:bg-gray-50 transition-colors"
          title="Copier le lien"
        >
          {copie ? '✓' : '🔗'}
        </button>
      </div>

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
