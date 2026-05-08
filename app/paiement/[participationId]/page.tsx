'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function PageInitierPaiementScore({
  params,
}: {
  params: Promise<{ participationId: string }>
}) {
  const router = useRouter()
  const [erreur, setErreur] = useState<string | null>(null)
  const [participationId, setParticipationId] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ participationId: pid }) => {
      setParticipationId(pid)

      fetch('/api/paiements/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'score', participationId: pid }),
      })
        .then(async (res) => {
          const data = await res.json()
          if (!res.ok) throw new Error(data.erreur || 'Erreur serveur')
          window.location.href = data.paymentUrl
        })
        .catch((err) => {
          setErreur(err.message)
        })
    })
  }, [params])

  if (erreur) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-5">
              <p className="font-semibold text-red-700 mb-1">Paiement indisponible</p>
              <p className="text-sm text-red-600">{erreur}</p>
            </div>
            {participationId && (
              <Link
                href={`/resultat/${participationId}`}
                className="text-sm text-ata-blue underline hover:opacity-70 transition"
              >
                Retour aux résultats
              </Link>
            )}
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-ata-orange border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Préparation du paiement…</p>
          <p className="text-sm text-gray-400">Vous allez être redirigé vers CinetPay.</p>
        </div>
      </main>
    </>
  )
}
