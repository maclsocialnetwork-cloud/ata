export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import Navbar from '@/components/Navbar'
import BoutonsTombola from './_components/BoutonsTombola'
import BoutonsConcours from './_components/BoutonsConcours'

const STATUT_CONFIG: Record<string, { label: string; classes: string }> = {
  brouillon: { label: 'Brouillon', classes: 'bg-gray-100 text-gray-600' },
  actif:     { label: 'Actif',     classes: 'bg-green-100 text-green-700' },
  pause:     { label: 'En pause',  classes: 'bg-yellow-100 text-yellow-700' },
  termine:   { label: 'Terminé',   classes: 'bg-red-100 text-red-600' },
}

function PageErreur({ titre, message }: { titre: string; message: string }) {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
          <p className="text-yellow-800 font-semibold text-lg mb-2">{titre}</p>
          <p className="text-yellow-700 text-sm">{message}</p>
        </div>
      </main>
    </>
  )
}

export default async function PageOrganisateur() {
  console.log('[dashboard] 1. Début du rendu')

  // ── Auth ──────────────────────────────────────────────────────────────────
  // redirect() NE doit PAS être dans un catch — il lance une erreur NEXT_REDIRECT
  // qui doit pouvoir se propager librement.
  let user: { id: string } | null = null
  let erreurAuth = false
  try {
    const supabase = await createClient()
    const { data, error: authError } = await supabase.auth.getUser()
    user = data.user
    console.log('[dashboard] 2. Auth –', user ? `authentifié user_id=${user.id}` : `non authentifié (error=${authError?.message ?? 'null'})`)
  } catch (err) {
    console.error('[dashboard] 2. ERREUR auth:', err)
    erreurAuth = true
  }

  // Erreur technique : ne pas rediriger (évite la boucle si /connexion renvoie ici)
  if (erreurAuth) {
    return (
      <PageErreur
        titre="Erreur de session"
        message="Impossible de vérifier votre session. Veuillez rafraîchir la page ou vous reconnecter."
      />
    )
  }

  if (!user) {
    console.log('[dashboard] 3. Non connecté → redirection /connexion')
    redirect('/connexion?redirect=/organisateur')
  }

  // ── Profil (rôle) ─────────────────────────────────────────────────────────
  let profil: { role: string } | null = null
  let erreurProfil = false
  try {
    const supabase = await createClient()
    console.log('[dashboard] 4. Requête profiles pour user_id:', user.id)
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (error) {
      console.error('[dashboard] 4. Erreur profiles:', error.message)
      erreurProfil = true
    } else {
      console.log('[dashboard] 4. Profil OK – rôle:', data?.role)
      profil = data
    }
  } catch (err) {
    console.error('[dashboard] 4. EXCEPTION profiles:', err)
    erreurProfil = true
  }

  if (erreurProfil) {
    return (
      <PageErreur
        titre="Impossible de vérifier votre accès"
        message="Une erreur est survenue lors de la vérification de votre profil. Veuillez réessayer dans quelques instants."
      />
    )
  }

  if (!profil || (profil.role !== 'organisateur' && profil.role !== 'admin')) {
    console.log('[dashboard] 5. Rôle non autorisé:', profil?.role)
    return (
      <PageErreur
        titre="Accès non autorisé"
        message="Cette section est réservée aux organisateurs. Contactez l'administrateur si vous pensez qu'il s'agit d'une erreur."
      />
    )
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
    else console.log('[dashboard] 6. Organisateur OK – id:', data?.id)
    organisateur = data
  } catch (err) {
    console.error('[dashboard] 6. EXCEPTION organisateurs:', err)
  }

  if (!organisateur) {
    console.log('[dashboard] 7. Organisateur introuvable → affichage message')
    return (
      <PageErreur
        titre="Votre compte organisateur n'est pas encore configuré"
        message="Votre compte n'est pas encore rattaché à un profil organisateur. Contactez l'administrateur pour activer votre espace."
      />
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
      .order('date_fin', { ascending: false, nullsFirst: false })
    if (error) {
      console.error('[dashboard] 8. Erreur concours:', error.message)
    } else {
      console.log('[dashboard] 8. Concours OK – nb:', data?.length ?? 0, '– statuts:', data?.map(c => c.statut).join(', ') || 'aucun')
    }
    concoursList = data ?? []
  } catch (err) {
    console.error('[dashboard] 8. EXCEPTION concours:', err)
  }

  // ── Tombolas actives (archive=false ou null, deleted=false ou null, type=participation) ──
  type Tombola = { id: string; titre: string; lot: string; statut: string; archive: boolean }
  let tombolaList: Tombola[] = []
  try {
    console.log('[dashboard] 9. Requête tombola active pour organisateur_id:', organisateur.id)
    const { data, error } = await supabaseServiceRole
      .from('tombola')
      .select('id, titre, lot, statut, archive')
      .eq('organisateur_id', organisateur.id)
      .eq('type_tombola', 'participation')
      .or('archive.is.null,archive.eq.false')
      .or('deleted.is.null,deleted.eq.false')
      .order('id', { ascending: false })
    if (error) console.error('[dashboard] 9. Erreur tombola:', error.message)
    else console.log('[dashboard] 9. Tombola OK – nb:', data?.length ?? 0)
    tombolaList = data ?? []
  } catch (err) {
    console.error('[dashboard] 9. EXCEPTION tombola:', err)
  }

  // ── Tombolas archivées (archive=true, deleted=false ou null, type=participation) ──
  let tombolaArchiveeList: Tombola[] = []
  try {
    console.log('[dashboard] 9b. Requête tombola archivée pour organisateur_id:', organisateur.id)
    const { data, error } = await supabaseServiceRole
      .from('tombola')
      .select('id, titre, lot, statut, archive')
      .eq('organisateur_id', organisateur.id)
      .eq('type_tombola', 'participation')
      .eq('archive', true)
      .or('deleted.is.null,deleted.eq.false')
      .order('id', { ascending: false })
    if (error) console.error('[dashboard] 9b. Erreur tombola archivée:', error.message)
    else console.log('[dashboard] 9b. Tombola archivée OK – nb:', data?.length ?? 0)
    tombolaArchiveeList = data ?? []
  } catch (err) {
    console.error('[dashboard] 9b. EXCEPTION tombola archivée:', err)
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

  console.log('[dashboard] 11. Rendu JSX – concours:', concoursList.length, '– tombolas:', tombolaList.length, '– archivées:', tombolaArchiveeList.length)

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
                  <div className="flex flex-col gap-2 shrink-0 items-end">
                    <div className="flex gap-2">
                      <Link href={`/organisateur/questions/${c.id}`} className="rounded-xl border border-ata-blue text-ata-blue text-sm font-medium px-4 py-2 hover:bg-blue-50 transition-colors">
                        Voir questions
                      </Link>
                      <Link href={`/organisateur/concours/${c.id}`} className="rounded-xl bg-ata-blue text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity">
                        Gérer
                      </Link>
                    </div>
                    <BoutonsConcours id={c.id} titre={c.titre} />
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
              <p className="font-medium text-gray-500">Aucune tombola active</p>
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
                  <BoutonsTombola id={t.id} titre={t.titre} archive={false} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tombolas archivées ─────────────────────────────────────────────── */}
        {tombolaArchiveeList.length > 0 && (
          <div className="mt-8">
            <h2 className="text-base font-semibold text-gray-400 mb-3">Tombolas archivées</h2>
            <div className="space-y-2">
              {tombolaArchiveeList.map(t => (
                <div key={t.id} className="bg-gray-50 rounded-2xl border border-gray-100 px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 opacity-75">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-500 truncate">{t.titre}</h3>
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-200 text-gray-500">
                        Archivée
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">Lot : {t.lot}</p>
                  </div>
                  <BoutonsTombola id={t.id} titre={t.titre} archive={true} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
