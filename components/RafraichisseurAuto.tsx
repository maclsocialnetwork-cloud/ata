'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RafraichisseurAuto({ intervalle = 60_000 }: { intervalle?: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalle)
    return () => clearInterval(id)
  }, [router, intervalle])

  return null
}
