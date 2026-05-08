import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/service';

export async function POST(request: Request) {
  console.log('SUPABASE_SERVICE_ROLE_KEY chargée ?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await request.json();
    console.log('Body reçu:', body);

    const { prenom, nom, whatsapp, role, nom_organisation, userId } = body;

    if (!userId) {
      console.error('userId manquant');
      return NextResponse.json({ error: 'userId manquant' }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe dans auth.users
    const { data: user, error: userError } = await supabaseServiceRole.auth.admin.getUserById(userId);
    if (userError || !user) {
      console.error('Erreur récupération utilisateur:', userError);
      return NextResponse.json({ error: `Utilisateur introuvable: ${userError?.message}` }, { status: 404 });
    }

    // Insérer dans profiles
    const { error: profileError } = await supabaseServiceRole
      .from('profiles')
      .upsert({
        id: userId,
        prenom,
        nom,
        whatsapp,
        role: role,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Erreur insertion profile:', profileError);
      return NextResponse.json({ error: `Erreur profile: ${profileError.message}` }, { status: 500 });
    }

    // Si organisateur, gérer l'organisateur (sans upsert)
    if (role === 'organisateur') {
      // Vérifier si une ligne existe déjà pour cet user_id
      const { data: existing, error: checkError } = await supabaseServiceRole
        .from('organisateurs')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Erreur vérification organisateur:', checkError);
        return NextResponse.json({ error: `Erreur lors de la vérification organisateur: ${checkError.message}` }, { status: 500 });
      }

      let orgError = null;
      if (existing) {
        // Mettre à jour l'existant
        const { error } = await supabaseServiceRole
          .from('organisateurs')
          .update({
            nom_organisation: nom_organisation,
            abonnement_actif: false,
            date_expiration_abo: null,
          })
          .eq('user_id', userId);
        orgError = error;
      } else {
        // Insérer un nouveau
        const { error } = await supabaseServiceRole
          .from('organisateurs')
          .insert({
            user_id: userId,
            nom_organisation: nom_organisation,
            abonnement_actif: false,
            date_expiration_abo: null,
          });
        orgError = error;
      }

      if (orgError) {
        console.error('Erreur insertion/mise à jour organisateur:', orgError);
        return NextResponse.json({ error: `Erreur organisateur: ${orgError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erreur générale:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 });
  }
}