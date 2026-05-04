-- =============================================================
-- PROJET ATA — Module Tombola : sondage de prix
-- Ajouter les nouvelles colonnes à la table tombola
-- et créer la table tombola_sondage.
-- Prérequis : migration_tombola.sql déjà exécutée.
-- =============================================================

-- Colonnes ajoutées pour le type et la photo (utilisées par TombolaCard)
ALTER TABLE public.tombola
    ADD COLUMN IF NOT EXISTS type_tombola TEXT NOT NULL DEFAULT 'achat'
        CHECK (type_tombola IN ('participation', 'achat'));

ALTER TABLE public.tombola
    ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Mettre à jour la policy de lecture : les tombolas de type 'participation'
-- peuvent être visibles même hors plage de dates (ex: à venir).
-- On élargit donc la policy existante pour inclure toutes les tombolas actives.
-- (La tombola RLS actuelle autorise SELECT si statut = 'active', pas de filtre date.)


-- =============================================================
-- TABLE : tombola_sondage
-- Enregistre la réponse d'un utilisateur au sondage de prix.
-- Une seule réponse par (tombola, user) — contrainte UNIQUE.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.tombola_sondage (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    tombola_id  UUID    NOT NULL REFERENCES public.tombola(id)  ON DELETE CASCADE,
    user_id     UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    montant     INTEGER NOT NULL
                    CHECK (montant IN (100, 500, 1000, 2000, 5000, 10000)),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT tombola_sondage_unique UNIQUE (tombola_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tombola_sondage_tombola
    ON public.tombola_sondage (tombola_id);

ALTER TABLE public.tombola_sondage ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut lire uniquement sa propre réponse
CREATE POLICY "tombola_sondage: lecture propre reponse"
    ON public.tombola_sondage FOR SELECT
    USING (auth.uid() = user_id);

-- Un utilisateur peut insérer uniquement sa propre réponse
CREATE POLICY "tombola_sondage: insertion propre reponse"
    ON public.tombola_sondage FOR INSERT
    WITH CHECK (auth.uid() = user_id);
