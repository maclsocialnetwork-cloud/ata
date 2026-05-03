import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import RafraichisseurAuto from '@/components/RafraichisseurAuto'
import ConcoursCard from '@/components/concours/ConcoursCard'

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
                <ConcoursCard key={c.id} {...c} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
