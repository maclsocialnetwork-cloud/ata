import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseServiceRole } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Authentification (client normal pour vérifier l'utilisateur)
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  // 2. Lire les paramètres
  const { searchParams } = new URL(request.url);
  const participationId = searchParams.get('participationId');
  const indexStr = searchParams.get('index');

  if (!participationId || indexStr === null) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
  }
  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 0) {
    return NextResponse.json({ error: 'Index invalide.' }, { status: 400 });
  }

  // 3. Récupérer la participation (client normal, l'utilisateur peut voir sa propre participation)
  const { data: participation, error: partError } = await supabase
    .from('participations')
    .select('questions_ordre, statut')
    .eq('id', participationId)
    .eq('user_id', user.id)
    .single();

  if (partError || !participation) {
    return NextResponse.json({ error: 'Participation introuvable.' }, { status: 404 });
  }

  // 4. Vérifier que la participation n'est pas terminée/expirée
  if (participation.statut === 'termine' || participation.statut === 'expire') {
    return NextResponse.json({ status: participation.statut }, { status: 410 });
  }

  // 5. Récupérer l'ordre des questions
  const questionsOrdre: string[] = participation.questions_ordre || [];
  if (index >= questionsOrdre.length) {
    return NextResponse.json({ error: 'Index hors limites.' }, { status: 400 });
  }
  const questionId = questionsOrdre[index];

  // 6. Charger la question (avec service_role pour contourner RLS)
  const { data: question, error: qError } = await supabaseServiceRole
    .from('questions')
    .select('id, enonce, choix_a, choix_b, choix_c, choix_d')
    .eq('id', questionId)
    .single();

  if (qError || !question) {
    console.error('[get-question] Question non trouvée', qError);
    return NextResponse.json({ error: 'Question non trouvée.' }, { status: 404 });
  }

  // 7. Renvoyer la question
  return NextResponse.json({
    question: {
      id: question.id,
      enonce: question.enonce,
      choix: [question.choix_a, question.choix_b, question.choix_c, question.choix_d]
    },
    indexCourant: index,
    total: questionsOrdre.length
  });
}