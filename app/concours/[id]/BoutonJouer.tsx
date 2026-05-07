'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  concoursId: string
  estConnecte: boolean
  dateDebut: string
  dateFin: string
}

type Etat = 'avenir' | 'enCours' | 'termine'

function calculeEtat(dateDebut: string, dateFin: string): Etat {
  const now = new Date()
  if (now >= new Date(dateFin)) return 'termine'
  if (now >= new Date(dateDebut)) return 'enCours'
  return 'avenir'
}

export default function BoutonJouer({ concoursId, estConnecte, dateDebut, dateFin }: Props) {
  const [certifie, setCertifie] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [etat, setEtat] = useState<Etat>(() => calculeEtat(dateDebut, dateFin))
  const router = useRouter()

  useEffect(() => {
    setEtat(calculeEtat(dateDebut, dateFin))
    const interval = setInterval(() => setEtat(calculeEtat(dateDebut, dateFin)), 5000)
    return () => clearInterval(interval)
  }, [dateDebut, dateFin])

  if (etat === 'avenir') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-5 py-4 text-center font-medium text-sm">
        Ce concours n'est pas encore commencé.
      </div>
    )
  }

  if (etat === 'termine') {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-5 py-4 text-center font-medium text-sm">
        Ce concours est terminé.
      </div>
    )
  }

  async function handleJouer() {
    if (!certifie) return

    if (!estConnecte) {
      router.push(`/connexion?redirect=/concours/${concoursId}`)
      return
    }

    setChargement(true)
    setErreur(null)

    try {
      const resAcces = await fetch('/api/quiz/verifier-acces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concoursId }),
      })

      const dataAcces = await resAcces.json()

      if (!resAcces.ok) {
        setErreur(dataAcces.error || 'Accès refusé.')
        return
      }

      const resDemarrer = await fetch('/api/quiz/demarrer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concoursId }),
      })

      const dataDemarrer = await resDemarrer.json()

      if (!resDemarrer.ok) {
        setErreur(dataDemarrer.error || 'Impossible de démarrer le quiz.')
        return
      }

      router.push(`/quiz/${dataDemarrer.participationId}`)
    } catch {
      setErreur('Une erreur réseau est survenue. Veuillez réessayer.')
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
