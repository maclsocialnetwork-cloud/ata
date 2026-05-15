'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  url: string
  titre: string
}

export default function BoutonPartager({ url, titre }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [copie, setCopie] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const urlEnc = encodeURIComponent(url)
  const titreEnc = encodeURIComponent(titre)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOuvert(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(url)
      setCopie(true)
      setTimeout(() => { setCopie(false); setOuvert(false) }, 1500)
    } catch {
      alert(`Lien : ${url}`)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOuvert(o => !o)}
        className="rounded-xl border border-ata-green text-ata-green text-xs font-semibold px-3 py-1.5 hover:bg-ata-green/10 transition-colors flex items-center gap-1.5"
      >
        📤 Partager
      </button>

      {ouvert && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[170px]">
          <a
            href={`https://wa.me/?text=${urlEnc}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => setOuvert(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            📱 WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${urlEnc}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => setOuvert(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            📘 Facebook
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${urlEnc}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => setOuvert(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            💼 LinkedIn
          </a>
          <a
            href={`mailto:?subject=${titreEnc}&body=${urlEnc}`}
            onClick={() => setOuvert(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            📧 Email
          </a>
          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={copierLien}
            className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copie ? '✓ Copié !' : '🔗 Copier le lien'}
          </button>
        </div>
      )}
    </div>
  )
}
