'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CompteurRebours from '@/components/CompteurRebours'

type Props = {
  id: string
  titre: string
  lot: string
  description: string | null
  prix_ticket: number
  date_fin: string
  photo_url: string | null
  type_tombola: 'participation' | 'achat'
  estConnecte: boolean
  interessee: boolean
  totalInterets: number | null
}

export default function TombolaCard({
  id,
  titre,
  lot,
  description,
  date_fin,
  photo_url,
  type_tombola,
  estConnecte,
  interessee: initialInteressee,
  totalInterets,
}: Props) {
  const router = useRouter()
  const [interessee, setInteressee] = useState(initialInteressee)
  const [total, setTotal] = useState(totalInterets ?? 0)
  const [charge, setCharge] = useState(false)

  const handleCardClick = () => {
    // Pour les deux types, on va vers la page détail (les tombolas participation
    // redirigeaient vers /sondage, mais tu veux maintenant sur la carte active
    // un bouton "Voir cette tombola". On garde toutefois la redirection différente
    // selon le type quand on clique sur la carte elle‑même.
    if (type_tombola === 'participation') {
      router.push(`/tombola/${id}/sondage`)
    } else {
      router.push(`/tombola/${id}`)
    }
  }

  const handleVoirTombola = (e: React.MouseEvent) => {
    e.stopPropagation()
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

  const estParticipation = type_tombola === 'participation'

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
    >
      {/* En-tête */}
      <div
        className={`px-5 pt-4 pb-3 flex items-start justify-between gap-2 ${
          estParticipation ? 'bg-purple-100' : 'bg-ata-blue'
        }`}
      >
        <span
          className={`text-xs font-bold uppercase tracking-widest ${
            estParticipation ? 'text-purple-700' : 'text-blue-200'
          }`}
        >
          {estParticipation ? 'Tombola à venir' : 'Tombola active'}
        </span>

        {totalInterets !== null && (
          <span className="bg-purple-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0">
            {total} intéressé{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Image */}
      {photo_url && (
        <div className="relative w-full h-40 bg-gray-100">
          <img
            src={photo_url}
            alt={titre}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Titre + lot */}
        <div>
          <h2 className="font-bold text-ata-blue text-lg leading-snug">{titre}</h2>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lot}</p>
        </div>

        {/* Description (pour les deux types) */}
        {description && (
          <p className="text-xs text-gray-400 mt-1.5 line-clamp-3">{description}</p>
        )}

        {/* Compte à rebours — achat uniquement */}
        {!estParticipation && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col items-center gap-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              Ferme dans
            </p>
            <CompteurRebours dateFin={date_fin} />
          </div>
        )}

        {/* Bouton selon le type */}
        {estParticipation ? (
          // Tombola "à venir" : bouton "Intéressé" (toggle)
          <button
            onClick={handleInteret}
            disabled={charge}
            className={`mt-auto w-full text-center font-semibold rounded-xl py-3 text-sm transition-opacity disabled:opacity-50 ${
              interessee
                ? 'bg-ata-green text-white hover:opacity-90'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
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
        ) : (
          // Tombola active : bouton "Voir cette tombola"
          <button
            onClick={handleVoirTombola}
            className="mt-auto w-full bg-ata-orange text-white font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity"
          >
            Voir cette tombola
          </button>
        )}
      </div>
    </div>
  )
}