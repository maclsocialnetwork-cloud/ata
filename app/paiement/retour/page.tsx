'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'

function ContenuRetour() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const participationId = searchParams.get('participationId')
  const tombolaId = searchParams.get('tombolaId')

  const [etape, setEtape] = useState<'verification' | 'succes' | 'erreur'>('verification')

  useEffect(() => {
    // Simule la vérification du paiement (2s)
    const timer = setTimeout(() => {
      setEtape('succes')

      // Redirige après 1.5s supplémentaire
      const redirect = setTimeout(() => {
        if (participationId) {
          router.push(`/resultat/${participationId}`)
        } else if (tombolaId) {
          router.push(`/tombola/${tombolaId}`)
        } else {
          router.push('/')
        }
      }, 1500)

      return () => clearTimeout(redirect)
    }, 2000)

    return () => clearTimeout(timer)
  }, [participationId, tombolaId, router])

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="max-w-md w-full text-center space-y-5">

          {etape === 'verification' && (
            <>
              <div className="w-14 h-14 border-4 border-ata-blue border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-lg font-semibold text-ata-blue">
                  Vérification de votre paiement…
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Veuillez patienter quelques instants.
                </p>
              </div>
            </>
          )}

          {etape === 'succes' && (
            <>
              <div className="w-16 h-16 rounded-full bg-ata-green/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-ata-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-ata-green">Paiement confirmé !</p>
                <p className="text-sm text-gray-400 mt-1">Redirection en cours…</p>
              </div>
            </>
          )}

        </div>
      </main>
    </>
  )
}

export default function PageRetourPaiement() {
  return (
    <Suspense>
      <ContenuRetour />
    </Suspense>
  )
}
