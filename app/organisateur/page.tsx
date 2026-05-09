import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import Navbar from '@/components/Navbar'

const STATUT_CONFIG: Record<string, { label: string; classes: string }> = {
  brouillon: { label: 'Brouillon', classes: 'bg-gray-100 text-gray-600' },
  actif:     { label: 'Actif',     classes: 'bg-green-100 text-green-700' },
  pause:     { label: 'En pause',  classes: 'bg-yellow-100 text-yellow-700' },
  termine:   { label: 'Terminé',   classes: 'bg-red-100 text-red-600' },
}

export default async function PageOrganisateur() {
  console.log('[dashboard] 1. Début du rendu')

  // ── Auth ──────────────────────────────────────────────────────────────────
  let user
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
    console.log('[dashboard] 2. Auth OK – user_id:', user?.id ?? 'null')
  } catch (err) {
    console.error('[dashboard] 2. ERREUR auth:', err)
    redirect('/connexion?redirect=/organisateur')
  }

  if (!user) {
    console.log('[dashboard] 3. Non connecté → redirection')
    redirect('/connexion?redirect=/organisateur')
  }

  // ── Profil (rôle) ─────────────────────────────────────────────────────────
  let profil: { role: string } | null = null
  try {
    const supabase = await createClient()
    console.log('[dashboard] 4. Requête profiles pour user_id:', user.id)
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (error) console.error('[dashboard] 4. Erreur profiles:', error.message)
    else console.log('[dashboard] 4. Profil OK – rôle:', data?.role)
    profil = data
  } catch (err) {
    console.error('[dashboard] 4. EXCEPTION profiles:', err)
  }

  if (!profil || (profil.role !== 'organisateur' && profil.role !== 'admin')) {
    console.log('[dashboard] 5. Rôle non autorisé:', profil?.role, '→ redirection /')
    redirect('/')
  }

  // ── Organisateur ──────────────────────────────────────────────────────────
  let organisateur: { id: string; nom_organisation: string; abonnement_actif: boolean } | null = null
  try {
    console.log('[dashboard] 6. Requête organisateurs pour user_id:', user.id)
    const { data, error } = await supabaseServiceRole
      .from('organisateurs')
      .select('id, nom_organisation, abonnement_actif')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    if (error) console.error('[dashboard] 6. Erreur organisateurs:', error.message)
    else console.log('[dashboard] 6. Organisateur OK – id:', data?.id, 'org:', data?.nom_organisation)
    organisateur = data
  } catch (err) {
    console.error('[dashboard] 6. EXCEPTION organisateurs:', err)
  }

  if (!organisateur) {
    console.log('[dashboard] 7. Organisateur introuvable → affichage message')
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <p className="text-yellow-800 font-semibold text-lg mb-2">Compte organisateur non configuré</p>
            <p className="text-yellow-700 text-sm">
              Votre compte n'est pas encore rattaché à un profil organisateur.
              Contactez l'administrateur pour activer votre espace.
            </p>
          </div>
        </main>
      </>
    )
  }

  // ── Concours ──────────────────────────────────────────────────────────────
  let concoursList: { id: string; titre: string; statut: string; date_debut: string | null; date_fin: string | null }[] = []
  try {
    console.log('[dashboard] 8. Requête concours pour organisateur_id:', organisateur.id)
    const { data, error } = await supabaseServiceRole
      .from('concours')
      .select('id, titre, statut, date_debut, date_fin')
      .eq('organisateur_id', organisateur.id)
      .order('date_fin', { ascending: false })
    if (error) console.error('[dashboard] 8. Erreur concours:', error.message)
    else console.log('[dashboard] 8. Concours OK – nb:', data?.length ?? 0)
    concoursList = data ?? []
  } catch (err) {
    console.error('[dashboard] 8. EXCEPTION concours:', err)
  }

  // ── Tombolas ──────────────────────────────────────────────────────────────
  let tombolaList: { id: string; titre: string; lot: string; statut: string }[] = []
  try {
    console.log('[dashboard] 9. Requête tombola pour organisateur_id:', organisateur.id)
    const { data, error } = await supabaseServiceRole
      .from('tombola')
      .select('id, titre, lot, statut')
      .eq('organisateur_id', organisateur.id)
      .eq('type_tombola', 'participation')
      .order('id', { ascending: false })
    if (error) console.error('[dashboard] 9. Erreur tombola:', error.message)
    else console.log('[dashboard] 9. Tombola OK – nb:', data?.length ?? 0, '– data:', JSON.stringify(data))
    tombolaList = data ?? []
  } catch (err) {
    console.error('[dashboard] 9. EXCEPTION tombola:', err)
  }

  // ── Participations ────────────────────────────────────────────────────────
  const nbParticipationsMap: Record<string, number> = {}
  if (concoursList.length > 0) {
    try {
      const ids = concoursList.map(c => c.id)
      console.log('[dashboard] 10. Requête participations pour', ids.length, 'concours')
      const { data, error } = await supabaseServiceRole
        .from('participations')
        .select('concours_id')
        .in('concours_id', ids)
      if (error) console.error('[dashboard] 10. Erreur participations:', error.message)
      else console.log('[dashboard] 10. Participations OK – nb lignes:', data?.length ?? 0)
      for (const p of data ?? []) {
        nbParticipationsMap[p.concours_id] = (nbParticipationsMap[p.concours_id] ?? 0) + 1
      }
    } catch (err) {
      console.error('[dashboard] 10. EXCEPTION participations:', err)
    }
  }

  console.log('[dashboard] 11. Rendu JSX – concours:', concoursList.length, '– tombolas:', tombolaList.length)

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ata-blue">Tableau de bord</h1>
            <p className="text-sm text-gray-500 mt-0.5">{organisateur.nom_organisation}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/organisateur/concours/nouveau"
              className="inline-flex items-center gap-2 bg-ata-orange text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:opacity-90 transition-opacity"
            >
              <span className="text-base">+</span> Nouveau concours
            </Link>
            <Link
              href="/organisateur/tombola/nouveau"
              className="inline-flex items-center gap-2 bg-purple-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-purple-700 transition-colors"
            >
              <span className="text-base">+</span> Tombola à venir
            </Link>
          </div>
        </div>

        {/* ── Concours ──────────────────────────────────────────────────────── */}
        {concoursList.length === 0 ? (
          <div className="text-center py-24">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium text-gray-500">Aucun concours pour l'instant</p>
            <p className="text-sm text-gray-400 mt-1">Créez votre premier concours pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {concoursList.map(c => {
              const config = STATUT_CONFIG[c.statut] ?? { label: c.statut, classes: 'bg-gray-100 text-gray-600' }
              const nb = nbParticipationsMap[c.id] ?? 0
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-ata-blue truncate">{c.titre}</h2>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.classes}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {nb} participation{nb !== 1 ? 's' : ''}
                      {c.date_debut && c.date_fin && (
                        <> · {new Date(c.date_debut).toLocaleDateString('fr-FR')} → {new Date(c.date_fin).toLocaleDateString('fr-FR')}</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/organisateur/questions/${c.id}`} className="rounded-xl border border-ata-blue text-ata-blue text-sm font-medium px-4 py-2 hover:bg-blue-50 transition-colors">
                      Voir questions
                    </Link>
                    <Link href={`/organisateur/concours/${c.id}`} className="rounded-xl bg-ata-blue text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity">
                      Gérer
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Tombolas à venir ───────────────────────────────────────────────── */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-ata-blue mb-4">Mes tombolas à venir</h2>

          {tombolaList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="font-medium text-gray-500">Aucune tombola créée</p>
              <p className="text-sm text-gray-400 mt-1">
                Créez une tombola à venir pour sonder l'intérêt des participants.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tombolaList.map(t => (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-ata-blue truncate">{t.titre}</h3>
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700">
                        Participation
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate">Lot : {t.lot}</p>
                  </div>
                  <Link
                    href={`/tombola/${t.id}`}
                    className="rounded-xl border border-purple-400 text-purple-600 text-sm font-medium px-4 py-2 hover:bg-purple-50 transition-colors shrink-0"
                  >
                    Voir la page publique
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
