'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

export default function PageNouvelleTombola() {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [nomOrganisation, setNomOrganisation] = useState<string | null>(null)

  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [lot, setLot] = useState('')
  const [photoFichier, setPhotoFichier] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrg() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('organisateurs')
        .select('nom_organisation')
        .eq('user_id', user.id)
        .maybeSingle()
      setNomOrganisation(data?.nom_organisation ?? null)
    }
    fetchOrg()
  }, [])

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFichier(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    setChargement(true)

    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      let photo_url: string | null = null

      if (photoFichier) {
        const ext = photoFichier.name.split('.').pop()
        const path = `tombola-${Date.now()}.${ext}`
        const { data: upload, error: uploadError } = await supabase.storage
          .from('lots-photos')
          .upload(path, photoFichier)

        if (uploadError) throw new Error(`Erreur upload photo : ${uploadError.message}`)

        const { data: urlData } = supabase.storage.from('lots-photos').getPublicUrl(upload.path)
        photo_url = urlData.publicUrl
      }

      const res = await fetch('/api/organisateur/tombola', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre,
          description: description || null,
          lot,
          photo_url,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.erreur || 'Erreur serveur')

      router.push('/organisateur')
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setChargement(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400'
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5'

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/organisateur" className="text-sm text-gray-400 hover:text-ata-blue transition-colors">
            ← Retour
          </Link>
          <h1 className="text-2xl font-bold text-ata-blue">Nouvelle tombola à venir</h1>
        </div>

        {nomOrganisation && (
          <p className="text-sm text-gray-500 -mt-4 mb-2">
            Organisé par :{' '}
            <span className="font-semibold text-ata-blue">{nomOrganisation}</span>
          </p>
        )}

        <div className="mb-5 rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 text-sm text-purple-800">
          Cette tombola sera de type <strong>participation</strong> — les utilisateurs peuvent exprimer
          leur intérêt et indiquer le montant qu'ils seraient prêts à dépenser. Les dates et le prix
          du ticket seront définis plus tard par l'administrateur.
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {erreur && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {erreur}
            </div>
          )}

          <div>
            <label className={labelClass}>
              Titre de la tombola <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="ex : Grande Tombola de Noël 2026"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Lot à gagner <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={lot}
              onChange={e => setLot(e.target.value)}
              placeholder="ex : Smartphone Samsung Galaxy S25"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez la tombola, les conditions de participation..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass}>Photo du lot</label>
            {photoPreview && (
              <div className="mb-3 rounded-xl overflow-hidden h-44 bg-gray-100">
                <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
              </div>
            )}
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <span className="rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors">
                {photoPreview ? 'Changer la photo' : 'Choisir une photo'}
              </span>
              <input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
            </label>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
            <span className="font-medium text-gray-600">Type :</span> Tombola à venir (participation) —
            prix et dates fixés par l'administrateur
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={chargement}
              className="bg-purple-600 text-white font-semibold rounded-xl px-6 py-3 text-sm hover:bg-purple-700 transition-colors disabled:opacity-60"
            >
              {chargement ? 'Création en cours...' : 'Créer la tombola'}
            </button>
          </div>
        </form>
      </main>
    </>
  )
}
