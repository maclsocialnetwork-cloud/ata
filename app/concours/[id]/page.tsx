import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import Navbar from '@/components/Navbar'
import CompteurRebours from '@/components/CompteurRebours'
import BoutonJouer from './BoutonJouer'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ata-macls-projects-ed759868.vercel.app'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { data } = await supabaseServiceRole
    .from('concours')
    .select('titre, description_lot, photo_lot_url, organisateurs(nom_organisation)')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Concours — ATA' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nomOrg = (data as any).organisateurs?.[0]?.nom_organisation as string | null ?? null
  const lot = (data as any).description_lot ?? data.titre
  const description = `Testez vos connaissances et gagnez ${lot}${nomOrg ? `. Organisé par ${nomOrg} sur ATA !` : ' sur ATA !'}`
  const image = data.photo_lot_url ?? `${BASE_URL}/icons/icon-512x512.png`

  return {
    title: `${data.titre} — ATA`,
    description,
    openGraph: {
      title: data.titre,
      description,
      images: [{ url: image, alt: data.titre }],
      locale: 'fr_FR',
      type: 'website',
      siteName: 'ATA — Achat Tombola Afrique',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.titre,
      description,
      images: [image],
    },
  }
}

type Concours = {
  id: string
  titre: string
  description: string | null
  photo_lot_url: string | null
  date_debut: string
  date_fin: string
  organisateurs: { nom_organisation: string }[] | null
}

export default async function PageConcours({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: concours } = await supabase
    .from('concours')
    .select('id, titre, description, photo_lot_url, date_debut, date_fin, organisateurs(nom_organisation)')
    .eq('id', id)
    .single()

  if (!concours) notFound()

  const c = concours as unknown as Concours

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let dejaParticipe = false
  if (user) {
    const { data: participation } = await supabase
      .from('participations')
      .select('id')
      .eq('concours_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    dejaParticipe = !!participation
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#F9F9F9] pb-16">
        {/* Photo du lot */}
        <div className="w-full bg-gray-100 flex items-center justify-center overflow-hidden" style={{ maxHeight: '480px' }}>
          {c.photo_lot_url ? (
            <img
              src={c.photo_lot_url}
              alt={`Lot : ${c.titre}`}
              className="w-full object-cover"
              style={{ maxHeight: '480px' }}
            />
          ) : (
            <div className="w-full flex items-center justify-center bg-gray-100" style={{ height: '320px' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-24 h-24 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
          {/* Titre + organisateur */}
          <div>
            <h1 className="text-2xl font-bold text-ata-blue leading-tight">{c.titre}</h1>
            {c.organisateurs?.[0]?.nom_organisation && (
              <p className="text-sm text-gray-500 mt-1">
                Organisé par{' '}
                <span className="font-medium text-ata-orange">
                  {c.organisateurs[0].nom_organisation}
                </span>
              </p>
            )}
          </div>

          {/* Compte à rebours */}
          <div className="bg-ata-blue rounded-2xl px-6 py-5 flex flex-col items-center gap-1">
            <p className="text-xs text-blue-200 font-medium uppercase tracking-widest">
              Temps restant
            </p>
            <CompteurRebours dateFin={c.date_fin} />
          </div>

          {/* Description */}
          {c.description && (
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{c.description}</p>
          )}

          {/* Zone d'action */}
          {dejaParticipe ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-5 py-4 text-center font-medium text-sm">
              Vous avez déjà participé à ce concours.
            </div>
          ) : (
            <BoutonJouer
              concoursId={id}
              estConnecte={!!user}
              dateDebut={c.date_debut}
              dateFin={c.date_fin}
            />
          )}
        </div>
      </main>
    </>
  )
}
