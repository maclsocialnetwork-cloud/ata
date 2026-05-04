import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseServiceRole } from '@/lib/supabase/service'
import Navbar from '@/components/Navbar'
import FormulaireVerification from './FormulaireVerification'

export default async function PageVerificationIdentite() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  // Trouver la participation gagnante de cet utilisateur
  const { data: participation } = await supabaseServiceRole
    .from('participations')
    .select('id')
    .eq('user_id', user.id)
    .eq('est_gagnant', true)
    .eq('statut', 'termine')
    .maybeSingle()

  if (!participation) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-bold text-ata-blue mb-2">Accès non autorisé</h1>
            <p className="text-gray-500 text-sm">
              Cette page est réservée aux gagnants d'un concours.
            </p>
          </div>
        </main>
      </>
    )
  }

  // Vérifier si un dossier existe déjà
  const { data: existante } = await supabaseServiceRole
    .from('verifications_identite')
    .select('statut, motif_refus')
    .eq('participation_id', participation.id)
    .maybeSingle()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-ata-blue mb-1">Réclamer mon lot</h1>
          <p className="text-gray-500 text-sm mb-8">
            Veuillez télécharger une pièce d'identité et un selfie pour valider votre gain.
          </p>
          <FormulaireVerification
            userId={user.id}
            participationId={participation.id}
            verificationExistante={existante ?? null}
          />
        </div>
      </main>
    </>
  )
}
