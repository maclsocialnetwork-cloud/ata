import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prenom, nom, whatsapp, role, nom_organisation, userId } = body;

    // 1. Crée un client normal (utilise la session du navigateur)
    const supabase = await createClient();

    // 2. Vérifie que l'utilisateur est bien celui qui a initié la requête
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    // 3. Insère ou met à jour les infos dans la table `profiles`
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        prenom,
        nom,
        whatsapp,
        role: role,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Erreur profile:', profileError);
      return NextResponse.json({ error: `Erreur profile: ${profileError.message}` }, { status: 500 });
    }

    // 4. Si c'est un organisateur, gère la table `organisateurs`
    if (role === 'organisateur') {
      // Vérifie si une ligne existe déjà pour cet utilisateur
      const { data: existing } = await supabase
        .from('organisateurs')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Met à jour
        const { error } = await supabase
          .from('organisateurs')
          .update({
            nom_organisation: nom_organisation,
            abonnement_actif: false,
            date_expiration_abo: null,
          })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insère
        const { error } = await supabase
          .from('organisateurs')
          .insert({
            user_id: userId,
            nom_organisation: nom_organisation,
            abonnement_actif: false,
            date_expiration_abo: null,
          });
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erreur générale:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 });
  }
}