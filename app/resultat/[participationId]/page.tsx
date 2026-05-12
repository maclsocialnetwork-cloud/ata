import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import Navbar from '@/components/Navbar'
import Confetti from '@/components/quiz/Confetti'

export default async function PageResultat({
  params,
}: {
  params: Promise<{ participationId: string }>
}) {
  const { participationId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/connexion?redirect=/resultat/${participationId}`)

  const { data: participation } = await supabaseServiceRole
    .from('participations')
    .select('score, est_gagnant, temps_secondes, score_paye, concours_id, statut')
    .eq('id', participationId)
    .eq('user_id', user.id)
    .single()

  if (!participation) notFound()

  // La participation doit être terminée pour afficher un résultat
  if (participation.statut !== 'termine') {
    redirect(`/quiz/${participationId}`)
  }

  const [profilRes, concoursRes, questionsCountRes] = await Promise.all([
    supabaseServiceRole.from('profiles').select('prenom').eq('id', user.id).single(),
    supabaseServiceRole
      .from('concours')
      .select('titre, description_lot')
      .eq('id', participation.concours_id)
      .single(),
    supabaseServiceRole
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('concours_id', participation.concours_id),
  ])

  const prenom = profilRes.data?.prenom ?? 'Participant'
  const concours = concoursRes.data
  const totalQuestions = questionsCountRes.count ?? 0
  const score = participation.score ?? 0
  const tempsSecondes = participation.temps_secondes ?? 0
  const minutes = Math.floor(tempsSecondes / 60)
  const secondes = tempsSecondes % 60
  const tempsFormate = `${minutes}min ${String(secondes).padStart(2, '0')}s`

  // ─── CAS GAGNANT ────────────────────────────────────────────────────────────
  if (participation.est_gagnant) {
    return (
      <>
        <Navbar />
        <Confetti />
        <main className="min-h-screen bg-ata-green flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full text-center text-white">
            {/* Médaille */}
            <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-14 h-14 text-white"
              >
                <path
                  fillRule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h1 className="text-4xl font-extrabold mb-2 leading-tight">
              Félicitations {prenom} !
            </h1>
            <p className="text-xl font-semibold mb-1 opacity-95">Vous avez gagné !</p>
            {concours?.description_lot && (
              <p className="text-base opacity-80 mb-6">{concours.description_lot}</p>
            )}

            {/* Stats */}
            <div className="bg-white/20 rounded-2xl px-6 py-4 mb-8 flex justify-around text-sm font-medium">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Score</p>
                <p className="text-2xl font-bold">{score}<span className="text-base font-normal opacity-70">/{totalQuestions}</span></p>
              </div>
              <div className="w-px bg-white/30" />
              <div>
                <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Temps</p>
                <p className="text-2xl font-bold">{tempsFormate}</p>
              </div>
            </div>

            <Link
              href="/profil/verification-identite"
              className="block bg-white text-ata-green font-bold py-4 rounded-2xl text-lg hover:bg-gray-50 transition mb-4"
            >
              Réclamer mon lot
            </Link>
            <Link
              href="/"
              className="text-white/75 text-sm underline hover:text-white transition"
            >
              Retour à l'accueil
            </Link>
          </div>
        </main>
      </>
    )
  }

  // ─── CAS PERDANT ─────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {/* Icône neutre */}
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-ata-blue mb-2">
            Vous n'avez pas remporté ce lot
          </h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            Un autre participant a répondu à toutes les questions correctement avant vous.
          </p>

          {participation.score_paye ? (
            /* Score déjà payé → afficher directement */
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Votre score</p>
              <p className="text-5xl font-extrabold text-ata-blue mb-1">
                {score}
                <span className="text-xl font-normal text-gray-400">/{totalQuestions}</span>
              </p>
              <p className="text-gray-500 text-sm mt-2">Temps : {tempsFormate}</p>
            </div>
          ) : (
            /* Score non payé → bouton vers CinetPay */
            <div className="mb-8">
              <p className="text-gray-500 text-sm mb-4">
                Débloquez votre score pour découvrir votre résultat.
              </p>
              <Link
                href={`/paiement/${participationId}`}
                className="block bg-ata-orange text-white font-bold py-4 rounded-2xl text-lg hover:opacity-90 transition"
              >
                Voir mon score
              </Link>
            </div>
          )}

          <Link
            href="/"
            className="text-ata-blue text-sm underline hover:opacity-70 transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </main>
    </>
  )
}
