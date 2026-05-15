import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import Navbar from '@/components/Navbar'
import CompteurRebours from '@/components/CompteurRebours'
import BoutonInteret from './BoutonInteret'
import BoutonAchat from './BoutonAchat'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

export default async function PageTombola({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // ── Étape 1 : tombola + utilisateur en parallèle ────────────────────────
  const [tombola, { data: { user } }] = await Promise.all([
    supabaseServiceRole
      .from('tombola')
      .select(
        'id, titre, description, lot, prix_ticket, date_debut, date_fin, statut, type_tombola, gagnant_user_id, numero_ticket_gagnant',
      )
      .eq('id', id)
      .single()
      .then((r) => r.data),
    supabase.auth.getUser(),
  ])

  if (!tombola) notFound()

  // ── Étape 2 : profil utilisateur (pour le rôle) ─────────────────────────
  const profilData = user
    ? await supabaseServiceRole
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then((r) => r.data)
    : null

  const estAdmin = profilData?.role === 'admin'

  // Les tombolas en brouillon ne sont visibles que pour l'admin
  if (tombola.statut === 'brouillon' && !estAdmin) notFound()

  // ── Étape 3 : intérêt + stats en parallèle ─────────────────────────────
  const [interetData, nbInteresses, nbTickets] = await Promise.all([
    user
      ? supabaseServiceRole
          .from('tombola_interet')
          .select('id')
          .eq('tombola_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),

    estAdmin
      ? supabaseServiceRole
          .from('tombola_interet')
          .select('*', { count: 'exact', head: true })
          .eq('tombola_id', id)
          .then((r) => r.count ?? 0)
      : Promise.resolve(0),

    estAdmin
      ? supabaseServiceRole
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('tombola_id', id)
          .then((r) => r.count ?? 0)
      : Promise.resolve(0),
  ])

  const interessee = !!interetData

  // ── Logique d'achat ────────────────────────────────────────────────────
  const maintenant = new Date()
  const estDansLesTemps =
    maintenant >= new Date(tombola.date_debut) &&
    maintenant <= new Date(tombola.date_fin)
  const estAchetable = tombola.statut === 'active' && estDansLesTemps

  const prixFormate = new Intl.NumberFormat('fr-FR').format(tombola.prix_ticket)

  // ── Label statut ────────────────────────────────────────────────────────
  const statutLabel =
    tombola.statut === 'active'
      ? 'Active'
      : tombola.statut === 'terminee'
        ? 'Terminée'
        : 'Brouillon'

  const statutClasses =
    tombola.statut === 'active'
      ? 'bg-ata-green/10 text-ata-green'
      : tombola.statut === 'terminee'
        ? 'bg-gray-100 text-gray-500'
        : 'bg-yellow-50 text-yellow-600'

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">

          {/* Badge statut */}
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${statutClasses}`}>
            Tombola — {statutLabel}
          </span>

          {/* Titre */}
          <h1 className="text-3xl font-extrabold text-ata-blue leading-tight">
            {tombola.titre}
          </h1>

          {/* Description */}
          {tombola.description && (
            <p className="text-gray-600 leading-relaxed">{tombola.description}</p>
          )}

          {/* Lot à gagner */}
          <div className="bg-ata-blue rounded-2xl p-5 text-white">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-1">
              Lot à gagner
            </p>
            <p className="font-bold text-xl">{tombola.lot}</p>
          </div>

          {/* Infos : prix + dates */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Prix du ticket</span>
              <span className="font-bold text-ata-orange text-base">{prixFormate} XOF</span>
            </div>
            <div className="h-px bg-gray-100" />
            {tombola.date_debut && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Début</span>
                <span className="font-medium text-gray-700">{formatDate(tombola.date_debut)}</span>
              </div>
            )}
            {tombola.date_fin && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Fin</span>
                <span className="font-medium text-gray-700">{formatDate(tombola.date_fin)}</span>
              </div>
            )}
          </div>

          {/* Compte à rebours (uniquement si pas terminée) */}
          {tombola.statut !== 'terminee' && (
            <div className="bg-ata-blue rounded-2xl px-6 py-5 flex flex-col items-center gap-1">
              <p className="text-xs text-blue-200 font-medium uppercase tracking-widest">
                Ferme dans
              </p>
              <CompteurRebours dateFin={tombola.date_fin} />
            </div>
          )}

          {/* Résultat du tirage (tombola terminée) */}
          {tombola.statut === 'terminee' && tombola.gagnant_user_id ? (
            <div className="bg-ata-green/10 border border-ata-green rounded-2xl p-5 text-center">
              <p className="text-ata-green font-bold text-lg mb-1">Tombola terminée</p>
              <p className="text-gray-600 text-sm">
                Ticket gagnant :{' '}
                <strong className="font-mono tracking-wider">
                  {tombola.numero_ticket_gagnant}
                </strong>
              </p>
            </div>
          ) : tombola.statut === 'terminee' ? (
            <div className="bg-gray-100 rounded-2xl p-4 text-center text-gray-500 text-sm">
              Tombola terminée — tirage au sort en cours.
            </div>
          ) : null}

          {/* Statistiques admin */}
          {estAdmin && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">
                Statistiques admin
              </p>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Intéressés</span>
                  <span className="font-bold text-purple-700">{nbInteresses}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Tickets vendus</span>
                  <span className="font-bold text-purple-700">{nbTickets}</span>
                </div>
              </div>
            </div>
          )}

          {/* Zone d'action */}
          <div className="space-y-3 pt-2">
            {/* Toggle Intéressé (connectés uniquement) */}
            {user && (
              <BoutonInteret tombolaId={id} initialInteressee={interessee} />
            )}

            {/* Non connecté — message différent selon le type */}
            {!user && tombola.type_tombola === 'participation' ? (
              <Link
                href={`/connexion?redirect=/tombola/${id}/sondage`}
                className="block text-center bg-purple-600 text-white font-bold py-4 rounded-2xl text-base hover:opacity-90 transition"
              >
                Intéressé.e ? Inscrivez-vous
              </Link>
            ) : !user ? (
              <Link
                href="/connexion"
                className="block text-center bg-ata-orange text-white font-bold py-4 rounded-2xl text-base hover:opacity-90 transition"
              >
                Se connecter pour acheter
              </Link>
            ) : !estAdmin ? (
              <BoutonAchat
                tombolaId={id}
                prixFormate={prixFormate}
                estAchetable={estAchetable}
              />
            ) : null}
          </div>

        </div>
      </main>
    </>
  )
}
