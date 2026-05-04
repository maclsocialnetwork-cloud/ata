'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CompteurRebours from '@/components/CompteurRebours'

type Props = {
  id: string
  titre: string
  lot: string
  prix_ticket: number
  date_fin: string
  estConnecte: boolean
  interessee: boolean
  // null = utilisateur non admin (badge masqué)
  // number = admin (badge visible même à 0)
  totalInterets: number | null
}

export default function TombolaCard({
  id,
  titre,
  lot,
  prix_ticket,
  date_fin,
  estConnecte,
  interessee: initialInteressee,
  totalInterets,
}: Props) {
  const router = useRouter()
  const [interessee, setInteressee] = useState(initialInteressee)
  const [total, setTotal] = useState(totalInterets ?? 0)
  const [charge, setCharge] = useState(false)

  const handleCardClick = () => {
    router.push(`/tombola/${id}`)
  }

  const handleInteret = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!estConnecte) {
      router.push('/connexion')
      return
    }

    setCharge(true)
    try {
      const res = await fetch('/api/tombola/interet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tombolaId: id }),
      })
      if (res.ok) {
        const data = await res.json()
        setInteressee(data.interessee)
        setTotal(data.total)
      }
    } finally {
      setCharge(false)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
    >
      {/* En-tête coloré */}
      <div className="bg-ata-blue px-5 pt-4 pb-3 flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">
          Tombola
        </span>

        {/* Badge admin : nombre d'intéressés */}
        {totalInterets !== null && (
          <span className="bg-purple-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0">
            {total} intéressé{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Titre et lot */}
        <div>
          <h2 className="font-bold text-ata-blue text-lg leading-snug">{titre}</h2>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lot}</p>
        </div>

        {/* Compte à rebours */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col items-center gap-1">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            Ferme dans
          </p>
          <CompteurRebours dateFin={date_fin} />
        </div>

        {/* Bouton Intéressé */}
        <button
          onClick={handleInteret}
          disabled={charge}
          className={`mt-auto w-full text-center font-semibold rounded-xl py-3 text-sm transition-opacity disabled:opacity-50 ${
            interessee
              ? 'bg-ata-green text-white hover:opacity-90'
              : 'bg-ata-orange text-white hover:opacity-90'
          }`}
        >
          {charge
            ? '...'
            : interessee
              ? 'Intéressé(e) ✓'
              : estConnecte
                ? 'Je suis intéressé(e)'
                : 'Intéressé(e) ? Connectez-vous'}
        </button>
      </div>
    </div>
  )
}
