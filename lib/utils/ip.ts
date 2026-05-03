import { NextRequest } from 'next/server'

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP.trim()

  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) return cfIP.trim()

  return 'unknown'
}
