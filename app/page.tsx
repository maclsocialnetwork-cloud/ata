import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import Navbar from '@/components/Navbar'
import RafraichisseurAuto from '@/components/RafraichisseurAuto'
import ConcoursCard from '@/components/concours/ConcoursCard'
import TombolaCard from '@/components/tombola/TombolaCard'

type Concours = {
  id: string
  titre: string
  photo_lot_url: string | null
  organisateurs: { nom_organisation: string }[] | null
  date_fin: string
}

type Tombola = {
  id: string
  titre: string
  lot: string
  description: string | null
  prix_ticket: number
  date_fin: string
  photo_url: string | null
  type_tombola: 'participation' | 'achat'
}

export default async function PageAccueil() {
  const supabase = await createClient()
  const maintenant = new Date().toISOString()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Charger concours, tombolas et profil en parallèle
  const [{ data: concours }, { data: tombolas }, { data: profilData }] =
    await Promise.all([
      supabase
        .from('concours')
        .select('id, titre, photo_lot_url, organisateurs(nom_organisation), date_fin')
        .eq('statut', 'actif')
        .lte('date_debut', maintenant)
        .gte('date_fin', maintenant)
        .order('date_fin', { ascending: true }),

      supabase
        .from('tombola')
        .select('id, titre, lot, description, prix_ticket, date_fin, photo_url, type_tombola')
        .eq('statut', 'active')
        .or(
          `type_tombola.eq.participation,and(type_tombola.eq.achat,date_debut.lte.${maintenant},date_fin.gte.${maintenant})`,
        )
        .order('type_tombola', { ascending: true })
        .order('date_fin', { ascending: true }),

      user
        ? supabaseServiceRole
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        : Promise.resolve({ data: null, error: null }),
    ])

  const estAdmin = profilData?.role === 'admin'
  const tombolaIds = (tombolas ?? []).map((t) => t.id)

  // Intérêts de l'utilisateur connecté pour les tombolas visibles
  let interetsUser: Set<string> = new Set()
  if (user && tombolaIds.length > 0) {
    const { data: interets } = await supabase
      .from('tombola_interet')
      .select('tombola_id')
      .in('tombola_id', tombolaIds)
    interets?.forEach((i) => interetsUser.add(i.tombola_id))
  }

  // Comptage des intérêts par tombola (admin uniquement)
  let compteInterets: Record<string, number> = {}
  if (estAdmin && tombolaIds.length > 0) {
    const { data: tous } = await supabaseServiceRole
      .from('tombola_interet')
      .select('tombola_id')
      .in('tombola_id', tombolaIds)
    tous?.forEach((i) => {
      compteInterets[i.tombola_id] = (compteInterets[i.tombola_id] ?? 0) + 1
    })
  }

  const aucunContenu =
    (!concours || concours.length === 0) && (!tombolas || tombolas.length === 0)

  return (
    <>
      <RafraichisseurAuto />
      <Navbar />

      <main className="flex-1 bg-[#F9F9F9] px-4 py-10">
        <div className="max-w-6xl mx-auto space-y-14">

          <h1 className="text-2xl font-bold text-ata-blue">Concours &amp; Tombola</h1>

          {/* ── Concours ───────────────────────────────────────────── */}
          <section>
            {!concours || concours.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun concours en cours.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(concours as unknown as Concours[]).map((c) => (
                  <ConcoursCard key={c.id} {...c} />
                ))}
              </div>
            )}
          </section>

          {/* ── Tombolas ───────────────────────────────────────────── */}
          {tombolas && tombolas.length > 0 && (
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(tombolas as Tombola[]).map((t) => (
                  <TombolaCard
                    key={t.id}
                    {...t}
                    estConnecte={!!user}
                    interessee={interetsUser.has(t.id)}
                    totalInterets={estAdmin ? (compteInterets[t.id] ?? 0) : null}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Vide total ─────────────────────────────────────────── */}
          {aucunContenu && (
            <div className="text-center py-24">
              <p className="text-lg font-medium text-gray-600">
                Aucun concours ni tombola en cours.
              </p>
              <p className="text-sm text-gray-400 mt-1">Revenez bientôt !</p>
            </div>
          )}

        </div>
      </main>
    </>
  )
}
