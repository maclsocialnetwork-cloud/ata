import Link from 'next/link'
import CompteurRebours from '@/components/CompteurRebours'

type Props = {
  id: string
  titre: string
  photo_lot_url: string | null
  organisateurs: { nom_organisation: string }[] | null
  date_fin: string
}

export default function ConcoursCard({ id, titre, photo_lot_url, organisateurs, date_fin }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
      <div className="relative h-48 bg-gray-100">
        {photo_lot_url ? (
          <img
            src={photo_lot_url}
            alt={`Lot : ${titre}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div>
          <h2 className="font-bold text-ata-blue text-lg leading-snug">{titre}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            par {organisateurs?.[0]?.nom_organisation}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col items-center gap-1">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            Temps restant
          </p>
          <CompteurRebours dateFin={date_fin} />
        </div>

        <Link
          href={`/concours/${id}`}
          className="mt-auto block text-center bg-ata-orange text-white font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity"
        >
          Voir ce concours
        </Link>
      </div>
    </div>
  )
}
