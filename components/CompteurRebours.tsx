'use client'

import { useEffect, useState } from 'react'

type Temps = {
  jours: number
  heures: number
  minutes: number
  secondes: number
  termine: boolean
}

function calculerTemps(dateFin: string): Temps {
  const diff = new Date(dateFin).getTime() - Date.now()
  if (diff <= 0) return { jours: 0, heures: 0, minutes: 0, secondes: 0, termine: true }

  return {
    jours: Math.floor(diff / 1000 / 60 / 60 / 24),
    heures: Math.floor(diff / 1000 / 60 / 60) % 24,
    minutes: Math.floor(diff / 1000 / 60) % 60,
    secondes: Math.floor(diff / 1000) % 60,
    termine: false,
  }
}

export default function CompteurRebours({ dateFin }: { dateFin: string | null }) {
  // null = pas encore monté : le serveur rend null aussi → pas de mismatch
  const [temps, setTemps] = useState<Temps | null>(null)

  useEffect(() => {
    if (!dateFin) return
    setTemps(calculerTemps(dateFin))
    const id = setInterval(() => setTemps(calculerTemps(dateFin)), 1000)
    return () => clearInterval(id)
  }, [dateFin])

  if (!dateFin) {
    return <p className="text-sm text-white font-medium">Ouvert</p>
  }

  if (!temps) {
    return <div className="h-8" />
  }

  if (temps.termine) {
    return <p className="text-sm text-gray-400 font-medium">Terminé</p>
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  const blocs = [
    { val: temps.jours, label: 'j' },
    { val: temps.heures, label: 'h' },
    { val: temps.minutes, label: 'm' },
    { val: temps.secondes, label: 's' },
  ]

  return (
    <div className="flex items-center justify-center gap-1">
      {blocs.map(({ val, label }, i) => (
        <span key={label} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-400 font-bold mb-2">:</span>}
          <span className="flex flex-col items-center">
            <span className="font-mono font-bold text-ata-blue text-xl leading-none">
              {pad(val)}
            </span>
            <span className="text-gray-400 text-[10px] mt-0.5">{label}</span>
          </span>
        </span>
      ))}
    </div>
  )
}
