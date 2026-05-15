import { supabaseServiceRole } from '@/lib/supabase/service'

// Génère un code parrainage côté JS (miroir du trigger Postgres).
// La génération réelle à l'inscription est faite par le trigger —
// cette fonction sert aux tests et à l'affichage d'un aperçu.
export function generateCodeParrainage(prenom: string): string {
  const digits = String(Date.now() % 1_000_000).padStart(6, '0')
  const letters = prenom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // supprime les accents
    .replace(/[^a-zA-Z]/g, '')        // garde uniquement les lettres
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, 'X')                   // complète si prénom < 4 lettres
  return `ATA${digits}${letters}`
}

// Crédite le parrain du filleul d'une commission de 5 %.
// À appeler depuis le webhook paiement (Phase 2).
// Utilise le service role pour lire les profils tiers et modifier solde_gains.
export async function crediterParrain(
  filleulId: string,
  montantPaiement: number,
  typeAction: 'participation' | 'abonnement'
): Promise<void> {
  // 1. Récupère le code parrain du filleul
  const { data: filleul, error: errFilleul } = await supabaseServiceRole
    .from('profiles')
    .select('parraine_par')
    .eq('id', filleulId)
    .single()

  if (errFilleul || !filleul?.parraine_par) return // pas de parrain, rien à faire

  // 2. Trouve le parrain via son code
  const { data: parrain, error: errParrain } = await supabaseServiceRole
    .from('profiles')
    .select('id, solde_gains')
    .eq('code_parrainage', filleul.parraine_par)
    .single()

  if (errParrain || !parrain) return // code obsolète ou supprimé

  const commission = Math.floor(montantPaiement * 0.05)
  if (commission <= 0) return

  // 3. Insère le gain
  const { error: errGain } = await supabaseServiceRole
    .from('gains_parrainage')
    .insert({
      parrain_id: parrain.id,
      filleul_id: filleulId,
      montant_paiement: montantPaiement,
      commission,
      type_action: typeAction,
      statut: 'en_attente',
    })

  if (errGain) throw new Error(`Erreur insertion gain : ${errGain.message}`)

  // 4. Crédite le solde du parrain
  const { error: errSolde } = await supabaseServiceRole
    .from('profiles')
    .update({ solde_gains: parrain.solde_gains + commission })
    .eq('id', parrain.id)

  if (errSolde) throw new Error(`Erreur mise à jour solde : ${errSolde.message}`)
}

// Crée une demande de retrait et déduit le montant du solde.
// À appeler depuis un route handler (jamais côté client directement).
export async function demanderRetrait(
  userId: string,
  montant: number,
  numeroMobile: string,
  operateur: string
): Promise<void> {
  // 1. Vérifie le solde actuel
  const { data: profil, error: errProfil } = await supabaseServiceRole
    .from('profiles')
    .select('solde_gains')
    .eq('id', userId)
    .single()

  if (errProfil || !profil) throw new Error('Profil introuvable')

  if (profil.solde_gains < 2000) {
    throw new Error('Solde insuffisant (minimum 2 000 FCFA pour retirer)')
  }
  if (montant > profil.solde_gains) {
    throw new Error('Le montant demandé dépasse votre solde disponible')
  }
  if (montant < 2000) {
    throw new Error('Le montant minimum de retrait est 2 000 FCFA')
  }

  // 2. Insère la demande de retrait
  const { error: errRetrait } = await supabaseServiceRole
    .from('retraits')
    .insert({
      user_id: userId,
      montant,
      numero_mobile: numeroMobile,
      operateur,
      statut: 'en_attente',
    })

  if (errRetrait) throw new Error(`Erreur création retrait : ${errRetrait.message}`)

  // 3. Déduit du solde
  const { error: errSolde } = await supabaseServiceRole
    .from('profiles')
    .update({ solde_gains: profil.solde_gains - montant })
    .eq('id', userId)

  if (errSolde) throw new Error(`Erreur déduction solde : ${errSolde.message}`)
}
