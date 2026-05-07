'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  id: string
  titre: string
  description: string
  date_debut: string
  date_fin: string
  duree_minutes: number
  photo_lot_url: string | null
}

export default function ConcoursCard({
  id,
  titre,
  description,
  date_debut,
  date_fin,
  duree_minutes,
  photo_lot_url,
}: Props) {
  const router = useRouter()
  const [tempsRestant, setTempsRestant] = useState<string | null>(null)
  const [etat, setEtat] = useState<'avenir' | 'enCours' | 'termine'>('avenir')

  useEffect(() => {
    const interval = setInterval(() => {
      const maintenant = new Date()
      const debut = new Date(date_debut)
      const fin = new Date(date_fin)

      if (maintenant >= fin) {
        setEtat('termine')
        setTempsRestant('Terminé')
        clearInterval(interval)
        return
      }

      if (maintenant >= debut) {
        setEtat('enCours')
        const diff = fin.getTime() - maintenant.getTime()
        const jours = Math.floor(diff / (1000 * 60 * 60 * 24))
        const heures = Math.floor((diff % (86400000)) / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const secondes = Math.floor((diff % 60000) / 1000)
        setTempsRestant(`${jours}j ${heures}h ${minutes}m ${secondes}s`)
      } else {
        setEtat('avenir')
        const diff = debut.getTime() - maintenant.getTime()
        const jours = Math.floor(diff / (1000 * 60 * 60 * 24))
        const heures = Math.floor((diff % (86400000)) / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const secondes = Math.floor((diff % 60000) / 1000)
        setTempsRestant(`${jours}j ${heures}h ${minutes}m ${secondes}s`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [date_debut, date_fin])

  const badge = (() => {
    if (etat === 'termine') return { text: 'Terminé', className: 'bg-gray-500' }
    if (etat === 'enCours') return { text: 'En cours', className: 'bg-green-500' }
    return { text: 'À venir', className: 'bg-yellow-500' }
  })()

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      {photo_lot_url && (
        <div className="relative w-full h-40 bg-gray-100">
          <img src={photo_lot_url} alt={titre} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2">
          <h2 className="font-bold text-ata-blue text-lg leading-snug">{titre}</h2>
          <span className={`text-xs text-white px-2 py-1 rounded-full shrink-0 ${badge.className}`}>
            {badge.text}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
        <div className="mt-3 text-xs text-gray-400">
          Durée : {duree_minutes} minutes
        </div>
        <div className="mt-3 p-2 bg-gray-50 rounded-xl text-center">
          <p className="text-xs font-medium text-gray-500">
            {etat === 'avenir' ? 'Démarre dans' : etat === 'enCours' ? 'Ferme dans' : 'Concours terminé'}
          </p>
          <p className="font-mono font-bold text-ata-orange text-sm">
            {tempsRestant ?? '—'}
          </p>
        </div>
        <button
          onClick={() => router.push(`/concours/${id}`)}
          className="mt-4 w-full bg-ata-orange text-white text-sm font-semibold rounded-xl py-2.5 hover:opacity-90 transition-opacity"
        >
          Voir ce concours
        </button>
      </div>
    </div>
  )
}