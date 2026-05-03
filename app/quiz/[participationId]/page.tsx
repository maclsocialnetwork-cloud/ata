'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QuizTimer from '@/components/quiz/QuizTimer'
import ProgressBar from '@/components/quiz/ProgressBar'

type QuestionData = {
  id: string
  enonce: string
  choix: string[]
  lettres: string[]
}

export default function PageQuiz() {
  const params = useParams<{ participationId: string }>()
  const participationId = params.participationId
  const router = useRouter()

  const [questionData, setQuestionData] = useState<QuestionData | null>(null)
  const [indexCourant, setIndexCourant] = useState(0)
  const [tempsRestantInitial, setTempsRestantInitial] = useState(1800)
  const [indexSelectionne, setIndexSelectionne] = useState<number | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  // Refs stables (ne déclenchent pas de re-render)
  const timerInitialiseRef = useRef(false)
  const quizTermineRef = useRef(false)
  const montéRef = useRef(true)

  // ── Bloquer le retour arrière ──────────────────────────────────────
  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname)
    const handlePopState = () => {
      if (quizTermineRef.current) return
      window.history.pushState(null, '', window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // ── Avertir avant fermeture/rechargement ───────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (quizTermineRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // ── Nettoyage à démontage ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      montéRef.current = false
    }
  }, [])

  // ── Soumettre le quiz (fin normale ou expiration) ──────────────────
  const soumettre = useCallback(async () => {
    quizTermineRef.current = true
    await fetch('/api/quiz/soumettre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participationId }),
    })
    router.push(`/resultat/${participationId}`)
  }, [participationId, router])

  // ── Charger une question ───────────────────────────────────────────
  const fetchQuestion = useCallback(
    async (index: number) => {
      setChargement(true)
      setErreur(null)
      setIndexSelectionne(null)

      const res = await fetch(
        `/api/quiz/question?participationId=${participationId}&index=${index}`
      )

      if (!montéRef.current) return

      if (res.status === 410) {
        // Temps écoulé ou participation déjà terminée
        router.push(`/resultat/${participationId}`)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErreur(data.error ?? 'Erreur lors du chargement de la question.')
        setChargement(false)
        return
      }

      const data = await res.json()

      setQuestionData(data.question)
      setIndexCourant(data.indexCourant)

      // Initialiser le timer une seule fois avec le temps restant du serveur
      if (!timerInitialiseRef.current) {
        setTempsRestantInitial(data.tempsRestant)
        timerInitialiseRef.current = true
      }

      setChargement(false)
    },
    [participationId, router]
  )

  // ── Chargement initial ─────────────────────────────────────────────
  useEffect(() => {
    fetchQuestion(0)
  }, [fetchQuestion])

  // ── Valider une réponse ────────────────────────────────────────────
  async function handleRepondre() {
    if (indexSelectionne === null || !questionData || chargement) return

    const reponse = questionData.lettres[indexSelectionne]
    setChargement(true)
    setErreur(null)

    const res = await fetch('/api/quiz/repondre', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participationId, questionId: questionData.id, reponse }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setErreur(data.error ?? 'Erreur lors de la sauvegarde.')
      setChargement(false)
      return
    }

    if (indexCourant < 99) {
      await fetchQuestion(indexCourant + 1)
    } else {
      await soumettre()
    }
  }

  // ── Expiration du timer ────────────────────────────────────────────
  const handleExpire = useCallback(async () => {
    await soumettre()
  }, [soumettre])

  // ── Rendu ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1B3A6B] flex flex-col">
      {/* En-tête fixe */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0F2548] shadow-lg">
        <div className="h-16 px-4 flex items-center justify-between">
          <span className="text-white font-bold text-base tracking-wide">Quiz ATA</span>
          {timerInitialiseRef.current || tempsRestantInitial !== 1800 ? (
            <QuizTimer
              tempsRestantInitial={tempsRestantInitial}
              onExpire={handleExpire}
            />
          ) : (
            <div className="h-8 w-20" />
          )}
        </div>
        <ProgressBar current={indexCourant + 1} total={100} />
      </header>

      {/* Corps — décalé sous l'en-tête fixe (~96px) */}
      <main className="flex-1 pt-28 px-4 pb-10">
        {!questionData ? (
          /* Chargement initial */
          <div className="flex flex-col items-center justify-center pt-16 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            <p className="text-white/70 text-sm">Chargement du quiz…</p>
          </div>
        ) : (
          /* Carte question */
          <div
            className={`max-w-[680px] mx-auto bg-white rounded-2xl p-8 shadow-xl transition-opacity duration-150 ${
              chargement ? 'opacity-50 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* Numéro */}
            <p className="text-xs text-gray-400 font-medium mb-4">
              Question {indexCourant + 1} sur 100
            </p>

            {/* Énoncé */}
            <p className="font-bold text-[20px] text-ata-blue leading-snug mb-6">
              {questionData.enonce}
            </p>

            {/* Choix */}
            <div className="flex flex-col gap-3 mb-6">
              {questionData.choix.map((texte, i) => (
                <button
                  key={i}
                  onClick={() => setIndexSelectionne(i)}
                  className={`w-full text-left px-4 py-3 rounded-[10px] border-2 font-medium text-sm transition-all ${
                    indexSelectionne === i
                      ? 'bg-ata-orange text-white border-ata-orange'
                      : 'bg-white text-[#333] border-gray-200 hover:bg-[#EAF0FB] hover:border-ata-blue'
                  }`}
                >
                  {texte}
                </button>
              ))}
            </div>

            {/* Erreur */}
            {erreur && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4">
                {erreur}
              </p>
            )}

            {/* Bouton valider */}
            <button
              onClick={handleRepondre}
              disabled={indexSelectionne === null || chargement}
              className="w-full py-3 rounded-xl font-semibold text-white bg-ata-green disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {chargement
                ? 'Chargement…'
                : indexCourant === 99
                  ? 'Terminer le quiz'
                  : 'Répondre et passer à la suivante'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
