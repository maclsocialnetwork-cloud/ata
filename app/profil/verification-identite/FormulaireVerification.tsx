'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type VerificationExistante = { statut: string; motif_refus: string | null } | null

interface Props {
  userId: string
  participationId: string
  verificationExistante: VerificationExistante
}

const TYPES_CNI = ['image/jpeg', 'image/png', 'application/pdf']
const TYPES_SELFIE = ['image/jpeg', 'image/png']
const MAX_OCTETS = 5 * 1024 * 1024

function validerFichier(fichier: File, typesOk: string[], label: string): string | null {
  if (!typesOk.includes(fichier.type)) {
    const formats = typesOk.map(t => t.split('/')[1].toUpperCase()).join(', ')
    return `${label} : format non accepté (${formats} uniquement).`
  }
  if (fichier.size > MAX_OCTETS) {
    return `${label} : fichier trop lourd (max 5 Mo).`
  }
  return null
}

function StatutDossier({ statut, motif }: { statut: string; motif: string | null }) {
  if (statut === 'valide') {
    return (
      <div className="bg-ata-green/10 border border-ata-green rounded-2xl p-6 text-center">
        <p className="text-ata-green font-bold text-lg mb-1">Dossier validé</p>
        <p className="text-gray-600 text-sm">
          Votre identité a été vérifiée. Vous serez contacté pour recevoir votre lot.
        </p>
      </div>
    )
  }
  if (statut === 'refuse') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-600 font-bold text-lg mb-2">Dossier refusé</p>
        {motif && <p className="text-gray-600 text-sm mb-3">Motif : {motif}</p>}
        <p className="text-gray-500 text-sm">
          Veuillez contacter le support pour soumettre un nouveau dossier.
        </p>
      </div>
    )
  }
  // en_attente
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
      <p className="text-ata-blue font-bold text-lg mb-1">Dossier en cours de vérification</p>
      <p className="text-gray-600 text-sm">
        Votre dossier est en cours de vérification. Vous serez contacté sous 48h.
      </p>
    </div>
  )
}

export default function FormulaireVerification({
  userId,
  participationId,
  verificationExistante,
}: Props) {
  const [cni, setCni] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [succes, setSucces] = useState(false)

  if (succes) {
    return <StatutDossier statut="en_attente" motif={null} />
  }

  if (verificationExistante) {
    return (
      <StatutDossier statut={verificationExistante.statut} motif={verificationExistante.motif_refus} />
    )
  }

  const handleSoumettre = async () => {
    setErreur(null)

    if (!cni || !selfie) {
      setErreur('Veuillez sélectionner les deux fichiers.')
      return
    }

    const errCni = validerFichier(cni, TYPES_CNI, "Pièce d'identité")
    if (errCni) { setErreur(errCni); return }

    const errSelfie = validerFichier(selfie, TYPES_SELFIE, 'Selfie')
    if (errSelfie) { setErreur(errSelfie); return }

    setEnvoi(true)
    try {
      const supabase = createClient()

      const extCni = cni.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const extSelfie = selfie.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const pathCni = `${userId}/${participationId}/cni.${extCni}`
      const pathSelfie = `${userId}/${participationId}/selfie.${extSelfie}`

      const [upCni, upSelfie] = await Promise.all([
        supabase.storage.from('documents-identite').upload(pathCni, cni, { upsert: true }),
        supabase.storage.from('documents-identite').upload(pathSelfie, selfie, { upsert: true }),
      ])

      if (upCni.error) throw new Error(`Erreur CNI : ${upCni.error.message}`)
      if (upSelfie.error) throw new Error(`Erreur selfie : ${upSelfie.error.message}`)

      const res = await fetch('/api/profil/soumettre-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participationId, pathCni, pathSelfie }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erreur lors de la soumission.')
      }

      setSucces(true)
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      {/* Champ CNI / Passeport */}
      <div>
        <label className="block text-sm font-semibold text-ata-blue mb-1">
          Photo CNI ou Passeport <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">JPG, PNG ou PDF — max 5 Mo</p>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={e => setCni(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-ata-blue file:text-white file:text-sm file:font-medium hover:file:opacity-90 cursor-pointer"
        />
        {cni && <p className="text-xs text-ata-green mt-1">{cni.name} sélectionné</p>}
      </div>

      {/* Champ Selfie */}
      <div>
        <label className="block text-sm font-semibold text-ata-blue mb-1">
          Selfie avec document en main <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">JPG ou PNG — max 5 Mo</p>
        <input
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={e => setSelfie(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-ata-blue file:text-white file:text-sm file:font-medium hover:file:opacity-90 cursor-pointer"
        />
        {selfie && <p className="text-xs text-ata-green mt-1">{selfie.name} sélectionné</p>}
      </div>

      {erreur && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {erreur}
        </div>
      )}

      <button
        onClick={handleSoumettre}
        disabled={envoi || !cni || !selfie}
        className="w-full bg-ata-green text-white font-bold py-3 rounded-xl disabled:opacity-50 hover:opacity-90 transition"
      >
        {envoi ? 'Envoi en cours...' : 'Envoyer mon dossier'}
      </button>
    </div>
  )
}
