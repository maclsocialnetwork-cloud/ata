import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseServiceRole } from '@/lib/supabase/service';
import { shuffle } from '@/lib/utils/shuffle';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[demarrer] Requête reçue');

  // Authentification
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.log('[demarrer] Non authentifié');
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  console.log('[demarrer] Utilisateur:', user.id);

  // Récupérer le body
  const { concoursId } = await request.json();
  if (!concoursId) {
    return NextResponse.json({ error: 'concoursId manquant' }, { status: 400 });
  }
  console.log('[demarrer] concoursId:', concoursId);

  // 1. Lire toutes les questions du concours (avec service_role pour contourner RLS)
  const { data: questions, error: qError } = await supabaseServiceRole
    .from('questions')
    .select('id')  // On ne prend que l'id pour l'ordre
    .eq('concours_id', concoursId);

  if (qError || !questions || questions.length === 0) {
    console.error('[demarrer] Erreur ou aucune question trouvée', qError);
    return NextResponse.json({ error: 'Aucune question trouvée pour ce concours.' }, { status: 500 });
  }
  console.log('[demarrer] Questions trouvées :', questions.length);

  // Vérifier qu'il y a 100 questions (optionnel)
  if (questions.length !== 100) {
    console.warn(`[demarrer] Attention: ${questions.length} questions (100 attendues)`);
  }

  // 2. Mélanger l'ordre des IDs
  const shuffledIds = shuffle(questions.map(q => q.id));

  // 3. Récupérer l'adresse IP du client
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // 4. Créer la participation
  const { data: participation, error: insertError } = await supabaseServiceRole
    .from('participations')
    .insert({
      user_id: user.id,
      concours_id: concoursId,
      ip_address: ip,
      questions_ordre: shuffledIds,
      reponses: {},
      statut: 'en_cours',
      debut_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[demarrer] Erreur insertion participation', insertError);
    return NextResponse.json({ error: 'Impossible de créer la participation.' }, { status: 500 });
  }

  console.log('[demarrer] Participation créée :', participation.id);
  return NextResponse.json({ participationId: participation.id });
}