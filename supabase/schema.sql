-- =============================================================
-- PROJET ATA — Script de création des tables Supabase
-- À exécuter une seule fois dans l'éditeur SQL de Supabase
-- =============================================================

-- Active l'extension UUID si elle n'est pas déjà active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================
-- TABLE 1 : profiles
-- Un profil est créé automatiquement à chaque inscription Auth.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    prenom      TEXT NOT NULL,
    nom         TEXT NOT NULL,
    whatsapp    TEXT NOT NULL UNIQUE,
    role        TEXT NOT NULL DEFAULT 'participant'
                    CHECK (role IN ('participant', 'organisateur', 'admin')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commentaire sur la colonne whatsapp
COMMENT ON COLUMN public.profiles.whatsapp IS 'Format attendu : +2250700000000';

-- RLS : chaque utilisateur lit et modifie uniquement son propre profil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: lecture propre profil"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles: modification propre profil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Trigger : création automatique d'un profil vide à chaque inscription Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, prenom, nom, whatsapp)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
        COALESCE(NEW.raw_user_meta_data->>'nom', ''),
        COALESCE(NEW.raw_user_meta_data->>'whatsapp', '')
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================
-- TABLE 2 : organisateurs
-- Informations supplémentaires pour les comptes organisateur.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.organisateurs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
    nom_organisation        TEXT NOT NULL,
    abonnement_actif        BOOLEAN NOT NULL DEFAULT FALSE,
    date_expiration_abo     TIMESTAMP WITH TIME ZONE
);

-- RLS : l'organisateur voit uniquement son propre enregistrement
ALTER TABLE public.organisateurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organisateurs: lecture propre enregistrement"
    ON public.organisateurs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "organisateurs: modification propre enregistrement"
    ON public.organisateurs FOR UPDATE
    USING (auth.uid() = user_id);


-- =============================================================
-- TABLE 3 : concours
-- Les concours créés par les organisateurs.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.concours (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisateur_id     UUID NOT NULL REFERENCES public.organisateurs ON DELETE CASCADE,
    titre               TEXT NOT NULL,
    description         TEXT,
    photo_lot_url       TEXT,
    description_lot     TEXT,
    duree_minutes       INTEGER NOT NULL DEFAULT 20,
    date_debut          TIMESTAMP WITH TIME ZONE NOT NULL,
    date_fin            TIMESTAMP WITH TIME ZONE NOT NULL,
    statut              TEXT NOT NULL DEFAULT 'brouillon'
                            CHECK (statut IN ('brouillon', 'actif', 'pause', 'termine')),
    gagnant_trouve      BOOLEAN NOT NULL DEFAULT FALSE
);

-- RLS : lecture publique si statut = actif
ALTER TABLE public.concours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concours: lecture publique si actif"
    ON public.concours FOR SELECT
    USING (statut = 'actif');

CREATE POLICY "concours: organisateur lit tous ses concours"
    ON public.concours FOR SELECT
    USING (
        organisateur_id IN (
            SELECT id FROM public.organisateurs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "concours: organisateur cree un concours"
    ON public.concours FOR INSERT
    WITH CHECK (
        organisateur_id IN (
            SELECT id FROM public.organisateurs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "concours: organisateur modifie ses concours"
    ON public.concours FOR UPDATE
    USING (
        organisateur_id IN (
            SELECT id FROM public.organisateurs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "concours: organisateur supprime ses concours"
    ON public.concours FOR DELETE
    USING (
        organisateur_id IN (
            SELECT id FROM public.organisateurs WHERE user_id = auth.uid()
        )
    );


-- =============================================================
-- TABLE 4 : questions
-- Pas de lecture publique (anti-triche).
-- Les API Routes utilisent service_role pour contourner le RLS.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.questions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concours_id UUID NOT NULL REFERENCES public.concours ON DELETE CASCADE,
    enonce      TEXT NOT NULL,
    choix_a     TEXT NOT NULL,
    choix_b     TEXT NOT NULL,
    choix_c     TEXT NOT NULL,
    choix_d     TEXT NOT NULL,
    bonne_rep   TEXT NOT NULL CHECK (bonne_rep IN ('a', 'b', 'c', 'd')),
    ordre       INTEGER
);

-- RLS : seul l'organisateur propriétaire peut lire ses questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions: organisateur lit ses questions"
    ON public.questions FOR SELECT
    USING (
        concours_id IN (
            SELECT c.id FROM public.concours c
            JOIN public.organisateurs o ON o.id = c.organisateur_id
            WHERE o.user_id = auth.uid()
        )
    );

CREATE POLICY "questions: organisateur cree des questions"
    ON public.questions FOR INSERT
    WITH CHECK (
        concours_id IN (
            SELECT c.id FROM public.concours c
            JOIN public.organisateurs o ON o.id = c.organisateur_id
            WHERE o.user_id = auth.uid()
        )
    );

CREATE POLICY "questions: organisateur modifie ses questions"
    ON public.questions FOR UPDATE
    USING (
        concours_id IN (
            SELECT c.id FROM public.concours c
            JOIN public.organisateurs o ON o.id = c.organisateur_id
            WHERE o.user_id = auth.uid()
        )
    );

CREATE POLICY "questions: organisateur supprime ses questions"
    ON public.questions FOR DELETE
    USING (
        concours_id IN (
            SELECT c.id FROM public.concours c
            JOIN public.organisateurs o ON o.id = c.organisateur_id
            WHERE o.user_id = auth.uid()
        )
    );


-- =============================================================
-- TABLE 5 : participations
-- Un participant ne peut s'inscrire qu'une seule fois par concours.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.participations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES public.profiles ON DELETE RESTRICT,
    concours_id         UUID NOT NULL REFERENCES public.concours ON DELETE RESTRICT,
    ip_address          TEXT NOT NULL,
    questions_ordre     JSONB,
    reponses            JSONB NOT NULL DEFAULT '{}',
    score               INTEGER,
    temps_secondes      INTEGER,
    est_gagnant         BOOLEAN NOT NULL DEFAULT FALSE,
    statut              TEXT NOT NULL DEFAULT 'en_cours'
                            CHECK (statut IN ('en_cours', 'termine', 'expire')),
    debut_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fin_at              TIMESTAMP WITH TIME ZONE,
    score_paye          BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT participations_user_concours_unique UNIQUE (user_id, concours_id)
);

-- RLS : un user voit uniquement ses propres participations
ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participations: lecture propres participations"
    ON public.participations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "participations: creation propre participation"
    ON public.participations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participations: modification propre participation"
    ON public.participations FOR UPDATE
    USING (auth.uid() = user_id);


-- =============================================================
-- TABLE 6 : verifications_identite
-- Documents CNI + selfie pour valider l'identité du gagnant.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.verifications_identite (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participation_id    UUID NOT NULL REFERENCES public.participations ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
    url_cni             TEXT NOT NULL,
    url_selfie          TEXT NOT NULL,
    statut              TEXT NOT NULL DEFAULT 'en_attente'
                            CHECK (statut IN ('en_attente', 'valide', 'refuse')),
    motif_refus         TEXT,
    verifie_par         UUID REFERENCES public.profiles,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verifie_at          TIMESTAMP WITH TIME ZONE
);

-- RLS : le user voit sa propre vérification
-- Admin et organisateur passent par service_role (API Routes côté serveur)
ALTER TABLE public.verifications_identite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verifications: lecture propre verification"
    ON public.verifications_identite FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "verifications: creation propre verification"
    ON public.verifications_identite FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- =============================================================
-- TABLE 7 : paiements
-- Suivi des paiements CinetPay pour les gagnants.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.paiements (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID NOT NULL REFERENCES public.profiles ON DELETE RESTRICT,
    participation_id            UUID NOT NULL REFERENCES public.participations ON DELETE RESTRICT,
    montant                     NUMERIC(10, 2) NOT NULL,
    devise                      TEXT NOT NULL DEFAULT 'XOF',
    statut                      TEXT NOT NULL DEFAULT 'en_attente'
                                    CHECK (statut IN ('en_attente', 'paye', 'echoue')),
    cinetpay_transaction_id     TEXT UNIQUE,
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS : un user voit uniquement ses propres paiements
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paiements: lecture propres paiements"
    ON public.paiements FOR SELECT
    USING (auth.uid() = user_id);


-- =============================================================
-- FONCTION RPC : tenter_gain
-- Appelée par l'API /api/quiz/soumettre quand score = 100.
-- Utilise FOR UPDATE pour verrouiller la ligne concours et éviter
-- qu'un 2ème participant à 100% soit aussi déclaré gagnant.
-- Retourne TRUE si ce participant est LE gagnant, FALSE sinon.
-- =============================================================

CREATE OR REPLACE FUNCTION tenter_gain(p_participation_id UUID, p_concours_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_gagnant_trouve BOOLEAN;
BEGIN
  SELECT gagnant_trouve INTO v_gagnant_trouve
    FROM concours WHERE id = p_concours_id FOR UPDATE;

  IF v_gagnant_trouve = FALSE THEN
    UPDATE concours SET gagnant_trouve = TRUE WHERE id = p_concours_id;
    UPDATE participations SET est_gagnant = TRUE WHERE id = p_participation_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================
-- BUCKETS SUPABASE STORAGE
-- Note : les buckets ne se créent pas en SQL standard Supabase.
-- Utilise le Dashboard > Storage pour les créer manuellement,
-- ou exécute les commandes storage ci-dessous via la fonction
-- pg_net / service_role si tu veux tout automatiser.
-- Les INSERT ci-dessous fonctionnent uniquement si l'extension
-- "storage" est disponible dans ton projet Supabase.
-- =============================================================

-- Bucket public : photos des lots
INSERT INTO storage.buckets (id, name, public)
VALUES ('lots-photos', 'lots-photos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Bucket privé : CNI et selfies des gagnants
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents-identite', 'documents-identite', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Politique storage : lecture publique sur lots-photos
CREATE POLICY "lots-photos: lecture publique"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'lots-photos');

-- Politique storage : upload réservé aux organisateurs authentifiés
CREATE POLICY "lots-photos: upload organisateurs"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'lots-photos'
        AND auth.role() = 'authenticated'
    );

-- Politique storage : upload privé documents-identite (utilisateur authentifié)
CREATE POLICY "documents-identite: upload utilisateur"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents-identite'
        AND auth.role() = 'authenticated'
    );

-- Politique storage : lecture documents-identite (propre dossier uniquement)
CREATE POLICY "documents-identite: lecture propre dossier"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents-identite'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
