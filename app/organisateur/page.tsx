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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  console.log('1. Utilisateur connecté ?', user?.id || 'non connecté')

  if (!user) redirect('/connexion?redirect=/organisateur')

  const { data: profil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('2. Profil utilisateur:', profil)

  if (!profil || (profil.role !== 'organisateur' && profil.role !== 'admin')) {
    console.log('3. Rôle non autorisé, redirection vers /')
    redirect('/')
  }

  // Utiliser service_role pour contourner RLS
  console.log('4. Recherche organisateur avec user_id:', user.id)
  const { data: organisateur, error: orgError } = await supabaseServiceRole
    .from('organisateurs')
    .select('id, nom_organisation, abonnement_actif')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  console.log('5. Erreur organisateur:', orgError)
  console.log('6. Données organisateur:', organisateur)

  if (!organisateur) {
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

  const [{ data: concoursList }, { data: tombolaList }] = await Promise.all([
    supabaseServiceRole
      .from('concours')
      .select('id, titre, statut, date_debut, date_fin')
      .eq('organisateur_id', organisateur.id)
      .order('date_fin', { ascending: false }),

    supabaseServiceRole
      .from('tombola')
      .select('id, titre, lot, statut')
      .eq('organisateur_id', organisateur.id)
      .eq('type_tombola', 'participation')
      .order('id', { ascending: false }),
  ])

  const ids = concoursList?.map(c => c.id) ?? []
  const nbParticipationsMap: Record<string, number> = {}

  if (ids.length > 0) {
    const { data: parts } = await supabaseServiceRole
      .from('participations')
      .select('concours_id')
      .in('concours_id', ids)
    for (const p of parts ?? []) {
      nbParticipationsMap[p.concours_id] = (nbParticipationsMap[p.concours_id] ?? 0) + 1
    }
  }

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

        {(!concoursList || concoursList.length === 0) ? (
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
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-ata-blue truncate">{c.titre}</h2>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.classes}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {nb} participation{nb !== 1 ? 's' : ''}
                      {' · '}
                      {new Date(c.date_debut).toLocaleDateString('fr-FR')} → {new Date(c.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/organisateur/questions/${c.id}`}
                      className="rounded-xl border border-ata-blue text-ata-blue text-sm font-medium px-4 py-2 hover:bg-blue-50 transition-colors"
                    >
                      Voir questions
                    </Link>
                    <Link
                      href={`/organisateur/concours/${c.id}`}
                      className="rounded-xl bg-ata-blue text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
                    >
                      Gérer
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {/* ── Tombolas à venir ───────────────────────────────────── */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-ata-blue mb-4">Mes tombolas à venir</h2>

          {(!tombolaList || tombolaList.length === 0) ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="font-medium text-gray-500">Aucune tombola créée</p>
              <p className="text-sm text-gray-400 mt-1">
                Créez une tombola à venir pour sonder l'intérêt des participants.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tombolaList.map(t => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
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