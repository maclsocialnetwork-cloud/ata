'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Concours = {
  id: string
  titre: string
  description: string | null
  photo_lot_url: string | null
  description_lot: string | null
  duree_minutes: number
  date_debut: string
  statut: string
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function FormulaireModification({ concours }: { concours: Concours }) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const [titre, setTitre] = useState(concours.titre)
  const [description, setDescription] = useState(concours.description ?? '')
  const [photoFichier, setPhotoFichier] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(concours.photo_lot_url)
  const [descriptionLot, setDescriptionLot] = useState(concours.description_lot ?? '')
  const [dureeMinutes, setDureeMinutes] = useState(concours.duree_minutes)
  const [dateDebut, setDateDebut] = useState(toDatetimeLocal(concours.date_debut))
  const [statut, setStatut] = useState(concours.statut)

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
      let photo_lot_url = concours.photo_lot_url

      if (photoFichier) {
        const supabase = createClient()
        const ext = photoFichier.name.split('.').pop()
        const path = `lot-${Date.now()}.${ext}`
        const { data: upload, error: uploadError } = await supabase.storage
          .from('lots-photos')
          .upload(path, photoFichier)

        if (uploadError) throw new Error(`Erreur upload photo : ${uploadError.message}`)

        const { data: urlData } = supabase.storage.from('lots-photos').getPublicUrl(upload.path)
        photo_lot_url = urlData.publicUrl
      }

      const res = await fetch(`/api/organisateur/concours/${concours.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre,
          description: description || null,
          photo_lot_url,
          description_lot: descriptionLot || null,
          duree_minutes: dureeMinutes,
          date_debut: dateDebut,
          statut,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.erreur || 'Erreur serveur')

      router.push('/organisateur')
      router.refresh()
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setChargement(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue'
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5'

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/organisateur" className="text-sm text-gray-400 hover:text-ata-blue transition-colors">
          ← Retour
        </Link>
        <h1 className="text-2xl font-bold text-ata-blue">Modifier le concours</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {erreur && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {erreur}
          </div>
        )}

        <div>
          <label className={labelClass}>
            Titre du concours <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={titre}
            onChange={e => setTitre(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>Photo du lot</label>
          {photoPreview && (
            <div className="mb-3 rounded-xl overflow-hidden h-44 bg-gray-100">
              <img src={photoPreview} alt="Aperçu lot" className="w-full h-full object-cover" />
            </div>
          )}
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <span className="rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-500 hover:border-ata-orange hover:text-ata-orange transition-colors">
              {photoPreview ? 'Changer la photo' : 'Choisir une photo'}
            </span>
            <input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
          </label>
        </div>

        <div>
          <label className={labelClass}>Description du lot</label>
          <textarea
            rows={2}
            value={descriptionLot}
            onChange={e => setDescriptionLot(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>Durée (minutes)</label>
          <input
            type="number"
            min={1}
            max={180}
            value={dureeMinutes}
            onChange={e => setDureeMinutes(Number(e.target.value))}
            className="w-28 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue"
          />
        </div>

        <div>
          <label className={labelClass}>
            Date de début <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            required
            value={dateDebut}
            onChange={e => setDateDebut(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Statut</label>
          <select
            value={statut}
            onChange={e => setStatut(e.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="brouillon">Brouillon</option>
            <option value="actif">Actif</option>
            <option value="pause">En pause</option>
            <option value="termine">Terminé</option>
          </select>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={chargement}
            className="bg-ata-blue text-white font-semibold rounded-xl px-6 py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {chargement ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </main>
  )
}
