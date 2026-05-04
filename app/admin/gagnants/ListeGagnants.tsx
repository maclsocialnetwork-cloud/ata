'use client'

import { useState } from 'react'

export type GagnantItem = {
  id: string
  prenom: string
  nom: string
  titreConcours: string
  dateDepot: string
  urlCni: string | null
  urlSelfie: string | null
}

type EtatItem = { motif: string; charge: boolean; traite: boolean }

export default function ListeGagnants({ verifications }: { verifications: GagnantItem[] }) {
  const [etats, setEtats] = useState<Record<string, EtatItem>>({})

  const getEtat = (id: string): EtatItem => etats[id] ?? { motif: '', charge: false, traite: false }

  const setMotif = (id: string, motif: string) =>
    setEtats(prev => ({ ...prev, [id]: { ...getEtat(id), motif } }))

  const traiter = async (id: string, action: 'valider' | 'refuser') => {
    const etat = getEtat(id)

    if (action === 'refuser' && !etat.motif.trim()) {
      alert('Veuillez saisir un motif de refus avant de confirmer.')
      return
    }

    setEtats(prev => ({ ...prev, [id]: { ...etat, charge: true } }))

    const res = await fetch('/api/admin/valider-gagnant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId: id, action, motif: etat.motif }),
    })

    if (res.ok) {
      setEtats(prev => ({ ...prev, [id]: { ...getEtat(id), charge: false, traite: true } }))
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Une erreur est survenue.')
      setEtats(prev => ({ ...prev, [id]: { ...getEtat(id), charge: false } }))
    }
  }

  if (verifications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
        Aucun dossier en attente de vérification.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {verifications.map(v => {
        const etat = getEtat(v.id)
        const date = new Date(v.dateDepot).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })

        if (etat.traite) {
          return (
            <div
              key={v.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 opacity-40 select-none"
            >
              <p className="text-sm text-gray-500">
                Dossier de <strong>{v.prenom} {v.nom}</strong> traité.
              </p>
            </div>
          )
        }

        return (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {/* En-tête */}
            <div className="flex flex-wrap gap-4 justify-between items-start mb-5">
              <div>
                <p className="font-bold text-ata-blue text-lg leading-tight">
                  {v.prenom} {v.nom}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{v.titreConcours}</p>
                <p className="text-xs text-gray-400 mt-1">Déposé le {date}</p>
              </div>

              {/* Boutons documents */}
              <div className="flex gap-2 flex-shrink-0">
                {v.urlCni ? (
                  <a
                    href={v.urlCni}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-ata-blue text-white font-medium px-4 py-2 rounded-lg hover:opacity-90 transition"
                  >
                    Voir CNI
                  </a>
                ) : (
                  <span className="text-sm text-gray-400 px-4 py-2">CNI indisponible</span>
                )}
                {v.urlSelfie ? (
                  <a
                    href={v.urlSelfie}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-gray-500 text-white font-medium px-4 py-2 rounded-lg hover:opacity-90 transition"
                  >
                    Voir Selfie
                  </a>
                ) : (
                  <span className="text-sm text-gray-400 px-4 py-2">Selfie indisponible</span>
                )}
              </div>
            </div>

            {/* Champ motif */}
            <input
              type="text"
              placeholder="Motif de refus (obligatoire en cas de refus)"
              value={etat.motif}
              onChange={e => setMotif(v.id, e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-ata-blue/30 placeholder:text-gray-300"
            />

            {/* Boutons action */}
            <div className="flex gap-3">
              <button
                onClick={() => traiter(v.id, 'valider')}
                disabled={etat.charge}
                className="flex-1 bg-ata-green text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50"
              >
                {etat.charge ? '...' : 'Valider'}
              </button>
              <button
                onClick={() => traiter(v.id, 'refuser')}
                disabled={etat.charge}
                className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50"
              >
                {etat.charge ? '...' : 'Refuser'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
