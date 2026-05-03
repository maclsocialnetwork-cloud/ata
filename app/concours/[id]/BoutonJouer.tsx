'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  concoursId: string
  estConnecte: boolean
}

export default function BoutonJouer({ concoursId, estConnecte }: Props) {
  const [certifie, setCertifie] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const router = useRouter()

  async function handleJouer() {
    if (!certifie) return

    if (!estConnecte) {
      router.push(`/connexion?redirect=/concours/${concoursId}`)
      return
    }

    setChargement(true)
    setErreur(null)

    try {
      const res = await fetch('/api/quiz/verifier-acces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concoursId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErreur(data.message || 'Une erreur est survenue.')
        return
      }

      router.push(`/quiz/${data.participationId}`)
    } catch {
      setErreur('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={certifie}
          onChange={(e) => setCertifie(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-ata-green flex-shrink-0"
        />
        <span className="text-sm text-gray-600 leading-snug">
          Je certifie avoir au moins 16 ans. À défaut, en cas de gain, je ne pourrai pas recevoir mon lot.
        </span>
      </label>

      {erreur && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {erreur}
        </p>
      )}

      <button
        onClick={handleJouer}
        disabled={!certifie || chargement}
        className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-ata-green disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {chargement ? 'Chargement…' : 'Je joue'}
      </button>
    </div>
  )
}
