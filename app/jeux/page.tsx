import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import Navbar from '@/components/Navbar'
// import RafraichisseurAuto from '@/components/RafraichisseurAuto'
import ConcoursCard from '@/components/concours/ConcoursCard'
import TombolaCard from '@/components/tombola/TombolaCard'

type Concours = {
  id: string
  titre: string
  photo_lot_url: string | null
  organisateurs: { nom_organisation: string }[] | null
  date_debut: string
  date_fin: string
  duree_minutes: number
  description: string
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

export default async function PageJeux() {
  // Le client authentifié sert uniquement aux requêtes liées à l'utilisateur.
  // Les données publiques (concours, tombolas) passent par supabaseServiceRole
  // pour contourner les éventuels problèmes de RLS liés aux cookies/domaine.
  const supabase = await createClient()
  const maintenant = new Date().toISOString()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('[jeux] user:', user?.id ?? 'anonyme')

  // ── Concours actifs ────────────────────────────────────────────────────────
  let concours: Concours[] | null = null
  try {
    const { data, error } = await supabaseServiceRole
      .from('concours')
      .select('id, titre, description, duree_minutes, photo_lot_url, date_debut, date_fin, organisateurs(nom_organisation)')
      .eq('statut', 'actif')
      .gte('date_fin', maintenant)
      .order('date_debut', { ascending: true })
    if (error) console.error('[jeux] erreur concours:', error.message)
    else console.log('[jeux] concours chargés:', data?.length ?? 0)
    concours = (data as unknown as Concours[]) ?? []
  } catch (err) {
    console.error('[jeux] exception concours:', err)
    concours = []
  }

  // ── Tombolas visibles ─────────────────────────────────────────────────────
  // archive et deleted peuvent être NULL sur les anciennes lignes → .or() pour les deux.
  // type participation : pas de contrainte de date (tombola à venir).
  // type achat         : doit être dans la fenêtre date_debut/date_fin.
  let tombolas: Tombola[] | null = null
  try {
    const { data, error } = await supabaseServiceRole
      .from('tombola')
      .select('id, titre, lot, description, prix_ticket, date_fin, photo_url, type_tombola')
      .eq('statut', 'active')
      .or('archive.is.null,archive.eq.false')
      .or('deleted.is.null,deleted.eq.false')
      .or(
        `type_tombola.eq.participation,and(type_tombola.eq.achat,date_debut.lte.${maintenant},date_fin.gte.${maintenant})`,
      )
      .order('type_tombola', { ascending: true })
      .order('date_fin', { ascending: true })
    if (error) console.error('[jeux] erreur tombolas:', error.message)
    else console.log('[jeux] tombolas chargées:', data?.length ?? 0, data?.map(t => ({ id: t.id, type: t.type_tombola, archive: (t as Record<string, unknown>).archive, deleted: (t as Record<string, unknown>).deleted })))
    tombolas = (data as Tombola[]) ?? []
  } catch (err) {
    console.error('[jeux] exception tombolas:', err)
    tombolas = []
  }

  // ── Profil (rôle) — optionnel ─────────────────────────────────────────────
  let profilData: { role: string } | null = null
  if (user) {
    try {
      const { data } = await supabaseServiceRole
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      profilData = data
    } catch (err) {
      console.error('[jeux] exception profiles:', err)
    }
  }

  const estAdmin = profilData?.role === 'admin'
  const isOrganisateur = profilData?.role === 'organisateur'
  const tombolaIds = (tombolas ?? []).map((t) => t.id)

  // ── Intérêts de l'utilisateur ─────────────────────────────────────────────
  let interetsUser: Set<string> = new Set()
  if (user && tombolaIds.length > 0) {
    try {
      const { data: interets } = await supabase
        .from('tombola_interet')
        .select('tombola_id')
        .in('tombola_id', tombolaIds)
      interets?.forEach((i) => interetsUser.add(i.tombola_id))
    } catch (err) {
      console.error('[jeux] exception tombola_interet:', err)
    }
  }

  // ── Comptage total des intérêts (admin uniquement) ────────────────────────
  let compteInterets: Record<string, number> = {}
  if (estAdmin && tombolaIds.length > 0) {
    try {
      const { data: tous } = await supabaseServiceRole
        .from('tombola_interet')
        .select('tombola_id')
        .in('tombola_id', tombolaIds)
      tous?.forEach((i) => {
        compteInterets[i.tombola_id] = (compteInterets[i.tombola_id] ?? 0) + 1
      })
    } catch (err) {
      console.error('[jeux] exception tombola_interet admin:', err)
    }
  }

  const aucunContenu =
    (!concours || concours.length === 0) && (!tombolas || tombolas.length === 0)

  console.log('[jeux] rendu – concours:', concours?.length ?? 0, '– tombolas:', tombolas?.length ?? 0, '– aucunContenu:', aucunContenu)

  return (
    <>
      {/* <RafraichisseurAuto /> */}
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
                {concours.map((c) => (
                  <ConcoursCard
                    key={c.id}
                    id={c.id}
                    titre={c.titre}
                    description={c.description}
                    date_debut={c.date_debut}
                    date_fin={c.date_fin}
                    duree_minutes={c.duree_minutes}
                    photo_lot_url={c.photo_lot_url}
                    isOrganisateur={isOrganisateur}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Tombolas ───────────────────────────────────────────── */}
          {tombolas && tombolas.length > 0 && (
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tombolas.map((t) => (
                  <TombolaCard
                    key={t.id}
                    {...t}
                    estConnecte={!!user}
                    interessee={interetsUser.has(t.id)}
                    totalInterets={estAdmin ? (compteInterets[t.id] ?? 0) : null}
                    isOrganisateur={isOrganisateur}
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
