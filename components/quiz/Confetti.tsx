'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export default function Confetti() {
  useEffect(() => {
    const end = Date.now() + 3500
    const colors = ['#F47920', '#1B3A6B', '#5BAD2F', '#ffffff']

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
      })

      if (Date.now() < end) requestAnimationFrame(frame)
    }

    frame()
  }, [])

  return null
}
