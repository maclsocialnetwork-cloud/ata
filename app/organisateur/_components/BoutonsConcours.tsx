'use client'

import BoutonPartager from '@/components/BoutonPartager'

interface Props {
  id: string
  titre: string
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ata-macls-projects-ed759868.vercel.app'

export default function BoutonsConcours({ id, titre }: Props) {
  const url = `${BASE_URL}/concours/${id}`
  return <BoutonPartager url={url} titre={titre} />
}
