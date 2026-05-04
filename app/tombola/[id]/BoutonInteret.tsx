'use client'

import { useState } from 'react'

interface Props {
  tombolaId: string
  initialInteressee: boolean
}

export default function BoutonInteret({ tombolaId, initialInteressee }: Props) {
  const [interessee, setInteressee] = useState(initialInteressee)
  const [charge, setCharge] = useState(false)

  const toggle = async () => {
    setCharge(true)
    try {
      const res = await fetch('/api/tombola/interet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tombolaId }),
      })
      if (res.ok) {
        const data = await res.json()
        setInteressee(data.interessee)
      }
    } finally {
      setCharge(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={charge}
      className={`w-full font-semibold py-3.5 rounded-2xl text-base transition disabled:opacity-50 ${
        interessee
          ? 'bg-ata-green text-white hover:opacity-90'
          : 'border-2 border-ata-green text-ata-green hover:bg-ata-green/10'
      }`}
    >
      {charge ? '...' : interessee ? 'Intéressé(e) ✓' : 'Je suis intéressé(e)'}
    </button>
  )
}
