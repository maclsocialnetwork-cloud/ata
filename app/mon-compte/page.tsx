'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

type Profil = {
  prenom: string
  nom: string
  whatsapp: string | null
  role: string
}

type Participation = {
  id: string
  debut_at: string
  score: number | null
  statut: string
  concours: { titre: string } | null
}

type TicketTombola = {
  id: string
  numero_ticket: string
  created_at: string
  tombola: { titre: string } | null
}

type OrgData = {
  id: string
  nom_organisation: string
  abonnement_actif: boolean
  date_expiration_abo: string | null
}

const STATUT_LABEL: Record<string, { label: string; classes: string }> = {
  en_cours: { label: 'En cours', classes: 'bg-yellow-100 text-yellow-700' },
  termine:  { label: 'Terminé',  classes: 'bg-green-100 text-green-700' },
  expire:   { label: 'Expiré',   classes: 'bg-red-100 text-red-600' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function PageMonCompte() {
  const router = useRouter()

  const [chargement, setChargement] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [participations, setParticipations] = useState<Participation[]>([])
  const [tickets, setTickets] = useState<TicketTombola[]>([])
  const [org, setOrg] = useState<OrgData | null>(null)
  const [nbConcours, setNbConcours] = useState<number>(0)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    async function charger() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/connexion?redirect=/mon-compte')
        return
      }

      setEmail(user.email ?? null)

      const { data: profilData, error: profilErr } = await supabase
        .from('profiles')
        .select('prenom, nom, whatsapp, role')
        .eq('id', user.id)
        .single()

      if (profilErr || !profilData) {
        setErreur('Impossible de charger votre profil.')
        setChargement(false)
        return
      }

      setProfil(profilData)

      if (profilData.role === 'participant') {
        const [partsRes, ticksRes] = await Promise.all([
          supabase
            .from('participations')
            .select('id, debut_at, score, statut, concours(titre)')
            .eq('user_id', user.id)
            .order('debut_at', { ascending: false })
            .limit(30),
          supabase
            .from('tickets_tombola')
            .select('id, numero_ticket, created_at, tombola(titre)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30),
        ])

        setParticipations((partsRes.data as Participation[]) ?? [])
        setTickets((ticksRes.data as TicketTombola[]) ?? [])
      }

      if (profilData.role === 'organisateur') {
        const { data: orgData } = await supabase
          .from('organisateurs')
          .select('id, nom_organisation, abonnement_actif, date_expiration_abo')
          .eq('user_id', user.id)
          .single()

        if (orgData) {
          setOrg(orgData)
          const { count } = await supabase
            .from('concours')
            .select('*', { count: 'exact', head: true })
            .eq('organisateur_id', orgData.id)
          setNbConcours(count ?? 0)
        }
      }

      setChargement(false)
    }

    charger()
  }, [router])

  if (chargement) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400">
          Chargement…
        </main>
      </>
    )
  }

  if (erreur) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-16">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
            {erreur}
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Informations personnelles */}
        <section>
          <h1 className="text-2xl font-bold text-ata-blue mb-4">Mon compte</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Informations personnelles
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-400">Prénom</dt>
                <dd className="font-medium text-gray-800 mt-0.5">{profil?.prenom}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Nom</dt>
                <dd className="font-medium text-gray-800 mt-0.5">{profil?.nom}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Email</dt>
                <dd className="font-medium text-gray-800 mt-0.5">{email}</dd>
              </div>
              <div>
                <dt className="text-gray-400">WhatsApp</dt>
                <dd className="font-medium text-gray-800 mt-0.5">
                  {profil?.whatsapp ?? <span className="text-gray-300">—</span>}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Rôle</dt>
                <dd className="mt-0.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    profil?.role === 'organisateur'
                      ? 'bg-ata-orange/10 text-ata-orange'
                      : 'bg-ata-blue/10 text-ata-blue'
                  }`}>
                    {profil?.role === 'organisateur' ? 'Entreprise' : 'Participant'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ── Bloc participant ── */}
        {profil?.role === 'participant' && (
          <>
            {/* Participations aux concours */}
            <section>
              <h2 className="text-lg font-bold text-ata-blue mb-3">Mes participations</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {participations.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">
                    Vous n'avez pas encore participé à un concours.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-gray-400 font-medium">Concours</th>
                        <th className="text-left px-3 py-3 text-gray-400 font-medium hidden sm:table-cell">Date</th>
                        <th className="text-center px-3 py-3 text-gray-400 font-medium">Score</th>
                        <th className="text-center px-3 py-3 text-gray-400 font-medium hidden sm:table-cell">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {participations.map(p => {
                        const cfg = STATUT_LABEL[p.statut] ?? { label: p.statut, classes: 'bg-gray-100 text-gray-600' }
                        return (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-800 max-w-[160px] truncate">
                              {p.concours?.titre ?? <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-3 py-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                              {formatDate(p.debut_at)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {p.score !== null
                                ? <span className="font-semibold text-ata-green">{p.score} pts</span>
                                : <span className="text-gray-300">—</span>
                              }
                            </td>
                            <td className="px-3 py-3 text-center hidden sm:table-cell">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.classes}`}>
                                {cfg.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Tickets de tombola */}
            <section>
              <h2 className="text-lg font-bold text-ata-blue mb-3">Mes tickets de tombola</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {tickets.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">
                    Vous n'avez pas encore acheté de ticket de tombola.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-gray-400 font-medium">Tombola</th>
                        <th className="text-left px-3 py-3 text-gray-400 font-medium">N° ticket</th>
                        <th className="text-left px-3 py-3 text-gray-400 font-medium hidden sm:table-cell">Date d'achat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tickets.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-800 max-w-[160px] truncate">
                            {t.tombola?.titre ?? <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-3 font-mono text-ata-blue text-xs">
                            {t.numero_ticket}
                          </td>
                          <td className="px-3 py-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                            {formatDate(t.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}

        {/* ── Bloc organisateur ── */}
        {profil?.role === 'organisateur' && (
          <section>
            <h2 className="text-lg font-bold text-ata-blue mb-3">Espace entreprise</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

              {org ? (
                <>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div>
                      <dt className="text-gray-400">Organisation</dt>
                      <dd className="font-semibold text-gray-800 mt-0.5">{org.nom_organisation}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-400">Concours créés</dt>
                      <dd className="font-semibold text-gray-800 mt-0.5">{nbConcours}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-400">Abonnement</dt>
                      <dd className="mt-0.5">
                        {org.abonnement_actif ? (
                          <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700">
                            En attente de validation
                          </span>
                        )}
                      </dd>
                    </div>
                    {org.date_expiration_abo && (
                      <div>
                        <dt className="text-gray-400">Expire le</dt>
                        <dd className="font-medium text-gray-800 mt-0.5">
                          {formatDate(org.date_expiration_abo)}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {!org.abonnement_actif && (
                    <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
                      Votre compte est en attente de validation par l'administrateur.
                      Vous pourrez créer des concours une fois votre abonnement activé.
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">Profil organisateur non configuré.</p>
              )}

              <Link
                href="/organisateur"
                className="inline-flex items-center gap-2 bg-ata-blue text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Accéder au tableau de bord
              </Link>
            </div>
          </section>
        )}

      </main>
    </>
  )
}
