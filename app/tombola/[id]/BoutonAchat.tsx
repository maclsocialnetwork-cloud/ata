'use client'

import { useState } from 'react'

interface Props {
  tombolaId: string
  prixFormate: string
  estAchetable: boolean
}

export default function BoutonAchat({ tombolaId, prixFormate, estAchetable }: Props) {
  const [charge, setCharge] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleAchat = async () => {
    setCharge(true)
    setErreur(null)
    try {
      const res = await fetch('/api/paiements/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ticket', tombolaId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erreur ?? 'Erreur lors de la demande.')
      window.location.href = data.paymentUrl
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setCharge(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleAchat}
        disabled={!estAchetable || charge}
        className="w-full bg-ata-green text-white font-bold py-4 rounded-2xl text-base hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {charge ? 'Redirection…' : `Acheter un ticket à ${prixFormate} XOF`}
      </button>

      {!estAchetable && (
        <p className="text-xs text-gray-400 text-center">
          La tombola n'est pas disponible pour l'achat actuellement.
        </p>
      )}

      {erreur && (
        <p className="text-sm text-red-500 text-center">{erreur}</p>
      )}
    </div>
  )
}
