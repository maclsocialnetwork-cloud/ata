'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

function ContenuReinitialisation() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [pret, setPret] = useState(false)
  const [erreurLien, setErreurLien] = useState<string | null>(null)
  const [mdp, setMdp] = useState('')
  const [mdpConfirm, setMdpConfirm] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const code = searchParams.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setErreurLien('Ce lien est invalide ou a expiré. Veuillez redemander un email de réinitialisation.')
          return
        }
        setPret(true)
        return
      }

      // Pas de code — vérifie si une session existe déjà (token en hash géré par supabase-js)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setPret(true)
      } else {
        setErreurLien('Ce lien est invalide ou a expiré. Veuillez redemander un email de réinitialisation.')
      }
    }
    init()
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)

    if (mdp !== mdpConfirm) { setErreur('Les mots de passe ne correspondent pas.'); return }
    if (mdp.length < 6) { setErreur('Le mot de passe doit contenir au moins 6 caractères.'); return }

    setChargement(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: mdp })
    setChargement(false)

    if (error) { setErreur('Une erreur est survenue. Veuillez réessayer.'); return }

    setSucces(true)
    setTimeout(() => router.push('/connexion'), 3000)
  }

  if (erreurLien) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center space-y-3">
        <p className="text-red-700 text-sm">{erreurLien}</p>
        <Link href="/connexion" className="text-sm text-ata-blue hover:underline transition-colors">
          ← Retour à la connexion
        </Link>
      </div>
    )
  }

  if (!pret) {
    return (
      <p className="text-center text-gray-400 text-sm py-10">Vérification du lien…</p>
    )
  }

  if (succes) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-8 text-center space-y-3">
        <p className="text-xl font-bold text-green-700">Mot de passe modifié !</p>
        <p className="text-sm text-green-600">Vous allez être redirigé vers la page de connexion…</p>
      </div>
    )
  }

  const inputClass = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue'
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      {erreur && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {erreur}
        </div>
      )}

      <div>
        <label className={labelClass}>
          Nouveau mot de passe <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          required
          value={mdp}
          onChange={e => setMdp(e.target.value)}
          placeholder="••••••••"
          className={inputClass}
        />
        <p className="text-xs text-gray-400 mt-1">Minimum 6 caractères</p>
      </div>

      <div>
        <label className={labelClass}>
          Confirmer le mot de passe <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          required
          value={mdpConfirm}
          onChange={e => setMdpConfirm(e.target.value)}
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={chargement}
          className="bg-ata-blue text-white font-semibold rounded-xl px-6 py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {chargement ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
        </button>
      </div>
    </form>
  )
}

export default function PageReinitialiserMotDePasse() {
  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/connexion" className="text-sm text-gray-400 hover:text-ata-blue transition-colors">
            ← Retour
          </Link>
          <h1 className="text-2xl font-bold text-ata-blue">Nouveau mot de passe</h1>
        </div>
        <Suspense fallback={<p className="text-center text-gray-400 text-sm py-10">Chargement…</p>}>
          <ContenuReinitialisation />
        </Suspense>
      </main>
    </>
  )
}
