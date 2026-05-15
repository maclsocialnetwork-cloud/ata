'use client'

import { useState } from 'react'

interface Props {
  id: string
  titre: string
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ata-macls-projects-ed759868.vercel.app'

export default function BoutonsConcours({ id, titre }: Props) {
  const [copie, setCopie] = useState(false)

  const url = `${BASE_URL}/concours/${id}`
  const urlEnc = encodeURIComponent(url)
  const titreEnc = encodeURIComponent(titre)

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(url)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      alert(`Lien : ${url}`)
    }
  }

  return (
    <div className="flex gap-1.5 flex-wrap justify-end shrink-0">
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
  )
}
