'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

const MONTANTS = [100, 500, 1000, 2000, 5000, 10000] as const
type Montant = (typeof MONTANTS)[number]

const format = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

type Tombola = {
  id: string
  titre: string
  lot: string
  description: string | null
  photo_url: string | null
}

export default function PageSondage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [tombola, setTombola] = useState<Tombola | null>(null)
  const [chargement, setChargement] = useState(true)
  const [selectionne, setSelectionne] = useState<Montant | null>(null)
  const [confirme, setConfirme] = useState(false)
  const [charge, setCharge] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/connexion')
        return
      }

      const [{ data: tombolaData }, { data: dejaRepondu }] = await Promise.all([
        supabase
          .from('tombola')
          .select('id, titre, lot, description, photo_url')
          .eq('id', id)
          .single(),
        supabase
          .from('tombola_sondage')
          .select('montant')
          .eq('tombola_id', id)
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      if (!tombolaData) {
        router.replace('/')
        return
      }

      setTombola(tombolaData)

      if (dejaRepondu) {
        setSelectionne(dejaRepondu.montant as Montant)
        setConfirme(true)
      }

      setChargement(false)
    }

    init()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectionne) return

    setCharge(true)
    setErreur(null)
    try {
      const res = await fetch('/api/tombola/sondage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tombolaId: id, montant: selectionne }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'envoi.")
      setConfirme(true)
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setCharge(false)
    }
  }

  if (chargement) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-400 text-sm animate-pulse">Chargement…</p>
        </main>
      </>
    )
  }

  if (!tombola) return null

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-xl mx-auto px-4 pt-8 space-y-6">

          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
            Tombola à venir
          </span>

          {tombola.photo_url && (
            <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={tombola.photo_url}
                alt={tombola.titre}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <h1 className="text-2xl font-extrabold text-ata-blue leading-tight">
              {tombola.titre}
            </h1>
            {tombola.description && (
              <p className="text-gray-600 mt-2 leading-relaxed">{tombola.description}</p>
            )}
          </div>

          <div className="bg-ata-blue rounded-2xl p-5 text-white">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-1">
              Lot à gagner
            </p>
            <p className="font-bold text-xl">{tombola.lot}</p>
          </div>

          {confirme ? (
            <div className="bg-ata-green/10 border border-ata-green rounded-2xl p-6 text-center space-y-2">
              <p className="text-ata-green font-bold text-lg">Merci !</p>
              <p className="text-gray-600 text-sm">
                Votre intérêt a été enregistré
                {selectionne ? ` pour ${format(selectionne)} FCFA` : ''}.
              </p>
            </div>
          ) : (
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
                      className={`flex items-center justify-center rounded-xl border-2 py-3.5 px-4 text-sm font-semibold cursor-pointer transition-colors ${
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
                {charge ? 'Envoi en cours…' : 'Confirmer mon intérêt'}
              </button>
            </form>
          )}

        </div>
      </main>
    </>
  )
}