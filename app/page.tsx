import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import CompteurRebours from '@/components/CompteurRebours'
import RafraichisseurAuto from '@/components/RafraichisseurAuto'

type Concours = {
  id: string
  titre: string
  photo_lot_url: string | null
  organisateurs: { nom_organisation: string }[] | null
  date_fin: string
}

export default async function PageAccueil() {
  const supabase = await createClient()

  const maintenant = new Date().toISOString()

  const { data: concours, error } = await supabase
    .from('concours')
    .select('id, titre, photo_lot_url, organisateurs(nom_organisation), date_fin')
    .eq('statut', 'actif')
    .lte('date_debut', maintenant)
    .gte('date_fin', maintenant)
    .order('date_fin', { ascending: true })

  if (error) {
    console.error('[PageAccueil] Erreur Supabase:', error.message, error.details)
  }

  return (
    <>
      <RafraichisseurAuto />
      <Navbar />

      <main className="flex-1 bg-[#F9F9F9] px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-ata-blue mb-8">Concours en cours</h1>

          {!concours || concours.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-lg font-medium text-gray-600">
                Aucun concours en cours.
              </p>
              <p className="text-sm text-gray-400 mt-1">Revenez bientôt !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(concours as unknown as Concours[]).map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col"
                >
                  {/* Photo du lot */}
                  <div className="relative h-48 bg-gray-100">
                    {c.photo_lot_url ? (
                      <img
                        src={c.photo_lot_url}
                        alt={`Lot : ${c.titre}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-16 h-16"
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

                  <div className="p-5 flex flex-col flex-1 gap-3">
                    {/* Titre + organisateur */}
                    <div>
                      <h2 className="font-bold text-ata-blue text-lg leading-snug">
                        {c.titre}
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">par {c.organisateurs?.[0]?.nom_organisation}</p>
                    </div>

                    {/* Compte à rebours */}
                    <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col items-center gap-1">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        Temps restant
                      </p>
                      <CompteurRebours dateFin={c.date_fin} />
                    </div>

                    {/* Bouton */}
                    <Link
                      href={`/concours/${c.id}`}
                      className="mt-auto block text-center bg-ata-orange text-white font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity"
                    >
                      Voir ce concours
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
