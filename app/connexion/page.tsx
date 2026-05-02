'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Onglet = 'connexion' | 'inscription'

export default function PageConnexion() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [onglet, setOnglet] = useState<Onglet>('connexion')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)

  // Champs connexion
  const [emailConnexion, setEmailConnexion] = useState('')
  const [mdpConnexion, setMdpConnexion] = useState('')

  // Champs inscription
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [emailInscription, setEmailInscription] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [mdpInscription, setMdpInscription] = useState('')
  const [mdpConfirmation, setMdpConfirmation] = useState('')

  function traduitErreurSupabase(message: string): string {
    if (message.includes('Invalid login credentials'))
      return 'Email ou mot de passe incorrect.'
    if (message.includes('Email not confirmed'))
      return 'Veuillez confirmer votre adresse email avant de vous connecter.'
    if (message.includes('User already registered') || message.includes('already been registered'))
      return 'Cette adresse email est déjà utilisée.'
    if (message.includes('Password should be at least'))
      return 'Le mot de passe doit contenir au moins 6 caractères.'
    if (message.includes('Unable to validate email address'))
      return 'Adresse email invalide.'
    if (message.includes('Email rate limit exceeded'))
      return 'Trop de tentatives. Veuillez patienter avant de réessayer.'
    return 'Une erreur est survenue. Veuillez réessayer.'
  }

  async function handleConnexion(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    setChargement(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: emailConnexion,
      password: mdpConnexion,
    })

    setChargement(false)

    if (error) {
      setErreur(traduitErreurSupabase(error.message))
      return
    }

    router.push(redirect)
    router.refresh()
  }

  async function handleInscription(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    setSucces(null)

    if (mdpInscription !== mdpConfirmation) {
      setErreur('Les mots de passe ne correspondent pas.')
      return
    }
    if (mdpInscription.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setChargement(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: emailInscription,
      password: mdpInscription,
      options: {
        data: { prenom, nom, whatsapp },
      },
    })

    if (error) {
      setChargement(false)
      setErreur(traduitErreurSupabase(error.message))
      return
    }

    // Insérer dans la table profiles
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        prenom,
        nom,
        email: emailInscription,
        whatsapp,
      })
    }

    setChargement(false)
    setSucces(
      'Compte créé avec succès ! Vérifiez votre email pour confirmer votre inscription.'
    )
  }

  return (
    <main className="min-h-screen bg-ata-blue flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Logo / Titre */}
        <div className="bg-ata-blue px-8 py-6 text-center">
          <h1 className="text-white text-2xl font-bold tracking-wide">
            Achat Ombol Afrique
          </h1>
          <p className="text-white/70 text-sm mt-1">Jeux concours QCM</p>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setOnglet('connexion'); setErreur(null); setSucces(null) }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              onglet === 'connexion'
                ? 'text-ata-blue border-b-2 border-ata-blue'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Se connecter
          </button>
          <button
            onClick={() => { setOnglet('inscription'); setErreur(null); setSucces(null) }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              onglet === 'inscription'
                ? 'text-ata-blue border-b-2 border-ata-blue'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Créer un compte
          </button>
        </div>

        <div className="px-8 py-6">
          {/* Message d'erreur */}
          {erreur && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {erreur}
            </div>
          )}

          {/* Message de succès */}
          {succes && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {succes}
            </div>
          )}

          {/* ── Onglet Connexion ── */}
          {onglet === 'connexion' && (
            <form onSubmit={handleConnexion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  type="email"
                  required
                  value={emailConnexion}
                  onChange={e => setEmailConnexion(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={mdpConnexion}
                  onChange={e => setMdpConnexion(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue"
                />
              </div>

              <button
                type="submit"
                disabled={chargement}
                className="w-full bg-ata-green text-white font-semibold rounded-lg py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {chargement ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          )}

          {/* ── Onglet Inscription ── */}
          {onglet === 'inscription' && (
            <form onSubmit={handleInscription} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={e => setPrenom(e.target.value)}
                    placeholder="Jean"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    placeholder="Dupont"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  type="email"
                  required
                  value={emailInscription}
                  onChange={e => setEmailInscription(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="+2250700000000"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue"
                />
                <p className="text-xs text-gray-400 mt-1">Format : +225 suivi du numéro</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={mdpInscription}
                  onChange={e => setMdpInscription(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={mdpConfirmation}
                  onChange={e => setMdpConfirmation(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue"
                />
              </div>

              <button
                type="submit"
                disabled={chargement}
                className="w-full bg-ata-green text-white font-semibold rounded-lg py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {chargement ? 'Création du compte…' : 'Créer mon compte'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
