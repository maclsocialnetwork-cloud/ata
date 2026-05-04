import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import Navbar from '@/components/Navbar'
import ListeGagnants, { type GagnantItem } from './ListeGagnants'

export default async function PageAdminGagnants() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  // Vérifier le rôle admin
  const { data: profil } = await supabaseServiceRole
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profil?.role !== 'admin') redirect('/')

  // Charger les vérifications en attente avec les données jointes
  const { data: rows } = await supabaseServiceRole
    .from('verifications_identite')
    .select(
      `id, url_cni, url_selfie, statut, created_at,
       profiles!user_id (prenom, nom),
       participations!participation_id (
         concours!concours_id (titre)
       )`,
    )
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: false })

  // Générer les URLs signées (1h) côté serveur pour ne pas exposer les chemins privés
  const verifications: GagnantItem[] = await Promise.all(
    (rows ?? []).map(async (row) => {
      const r = row as unknown as {
        id: string
        url_cni: string
        url_selfie: string
        created_at: string
        profiles: { prenom: string; nom: string } | null
        participations: { concours: { titre: string } | null } | null
      }

      const [cniSigned, selfieSigned] = await Promise.all([
        supabaseServiceRole.storage
          .from('documents-identite')
          .createSignedUrl(r.url_cni, 3600),
        supabaseServiceRole.storage
          .from('documents-identite')
          .createSignedUrl(r.url_selfie, 3600),
      ])

      return {
        id: r.id,
        prenom: r.profiles?.prenom ?? '—',
        nom: r.profiles?.nom ?? '—',
        titreConcours: r.participations?.concours?.titre ?? '—',
        dateDepot: r.created_at,
        urlCni: cniSigned.data?.signedUrl ?? null,
        urlSelfie: selfieSigned.data?.signedUrl ?? null,
      }
    }),
  )

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-ata-blue mb-1">Vérifications en attente</h1>
          <p className="text-gray-500 text-sm mb-8">
            {verifications.length} dossier{verifications.length !== 1 ? 's' : ''} à traiter
          </p>
          <ListeGagnants verifications={verifications} />
        </div>
      </main>
    </>
  )
}
