'use client'

import { useState } from 'react'

const MONTANTS = [100, 500, 1000, 2000, 5000, 10000] as const
type Montant = (typeof MONTANTS)[number]

interface Props {
  tombolaId: string
  dejaRepondu: number | null
}

const format = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

export default function SondageForm({ tombolaId, dejaRepondu }: Props) {
  const [selectionne, setSelectionne] = useState<Montant | null>(
    dejaRepondu as Montant | null,
  )
  const [charge, setCharge] = useState(false)
  const [confirme, setConfirme] = useState(dejaRepondu !== null)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectionne) return

    setCharge(true)
    setErreur(null)
    try {
      const res = await fetch('/api/tombola/sondage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tombolaId, montant: selectionne }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur lors de l\'envoi.')
      setConfirme(true)
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setCharge(false)
    }
  }

  if (confirme) {
    return (
      <div className="bg-ata-green/10 border border-ata-green rounded-2xl p-6 text-center space-y-2">
        <p className="text-ata-green font-bold text-lg">Merci !</p>
        <p className="text-gray-600 text-sm">
          Votre intérêt a été enregistré
          {selectionne ? ` pour ${format(selectionne)} FCFA` : ''}.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="font-semibold text-ata-blue text-base">
        Je participerai bien à cette tombola à :
      </p>

      <fieldset className="grid grid-cols-2 gap-3" disabled={charge}>
        {MONTANTS.map((montant) => {
          const actif = selectionne === montant
          return (
            <label
              key={montant}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3.5 px-4 text-sm font-semibold cursor-pointer transition-colors ${
                actif
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
              }`}
            >
              <input
                type="radio"
                name="montant"
                value={montant}
                checked={actif}
                onChange={() => setSelectionne(montant)}
                className="sr-only"
              />
              {format(montant)} FCFA
            </label>
          )
        })}
      </fieldset>

      {erreur && (
        <p className="text-sm text-red-500 text-center">{erreur}</p>
      )}

      <button
        type="submit"
        disabled={!selectionne || charge}
        className="w-full bg-ata-green text-white font-bold py-4 rounded-2xl text-base hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {charge ? 'Envoi en cours...' : 'Confirmer mon intérêt'}
      </button>
    </form>
  )
}
