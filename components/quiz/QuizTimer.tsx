'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  tempsRestantInitial: number
  onExpire: () => void
}

export default function QuizTimer({ tempsRestantInitial, onExpire }: Props) {
  // null = pas encore monté → pas de mismatch d'hydratation
  const [secondesRestantes, setSecondesRestantes] = useState<number | null>(null)
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  })

  useEffect(() => {
    setSecondesRestantes(tempsRestantInitial)

    const id = setInterval(() => {
      setSecondesRestantes((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(id)
          onExpireRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [tempsRestantInitial])

  if (secondesRestantes === null) {
    return <div className="h-8 w-20" />
  }

  const minutes = Math.floor(secondesRestantes / 60)
  const secondes = secondesRestantes % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  // Couleur selon le pourcentage de temps restant
  const pct = (secondesRestantes / tempsRestantInitial) * 100
  let colorClass: string
  if (pct <= 10) {
    colorClass = 'text-red-400 animate-pulse'
  } else if (pct <= 30) {
    colorClass = 'text-orange-400'
  } else {
    colorClass = 'text-green-400'
  }

  return (
    <span className={`font-mono font-bold text-[28px] tabular-nums leading-none ${colorClass}`}>
      {pad(minutes)}:{pad(secondes)}
    </span>
  )
}
