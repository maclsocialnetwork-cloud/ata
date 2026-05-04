-- =============================================================
-- PROJET ATA — Module Tombola
-- Migration à exécuter dans Supabase Dashboard > SQL Editor
-- Prérequis : le script schema.sql principal a déjà été exécuté
--             (tables profiles et paiements existantes).
-- =============================================================


-- =============================================================
-- TABLE 1 : tombola
-- Chaque tombola est gérée par l'admin via service_role.
-- Lecture publique uniquement quand statut = 'active'.
-- Le champ gagnant_user_id est rempli après tirage au sort.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.tombola (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    titre                 TEXT        NOT NULL,
    description           TEXT,
    lot                   TEXT        NOT NULL,
    prix_ticket           NUMERIC(10, 2) NOT NULL,
    date_debut            TIMESTAMP WITH TIME ZONE NOT NULL,
    date_fin              TIMESTAMP WITH TIME ZONE NOT NULL,
    statut                TEXT        NOT NULL DEFAULT 'brouillon'
                              CHECK (statut IN ('brouillon', 'active', 'terminee')),
    gagnant_user_id       UUID        REFERENCES public.profiles(id),
    numero_ticket_gagnant TEXT,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS : tout le monde peut lire les tombolas actives ;
-- les opérations d'écriture passent exclusivement par service_role (pas de policy INSERT/UPDATE/DELETE).
ALTER TABLE public.tombola ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tombola: lecture publique si active"
    ON public.tombola FOR SELECT
    USING (statut = 'active');


-- =============================================================
-- TABLE 2 : tombola_interet
-- Un utilisateur peut marquer son intérêt pour une tombola
-- avant d'acheter un ticket. Une seule ligne par (tombola, user).
-- =============================================================

CREATE TABLE IF NOT EXISTS public.tombola_interet (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tombola_id  UUID NOT NULL REFERENCES public.tombola(id)   ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT tombola_interet_unique UNIQUE (tombola_id, user_id)
);

-- Index pour lister efficacement les intérêts par tombola
CREATE INDEX IF NOT EXISTS idx_tombola_interet_tombola
    ON public.tombola_interet (tombola_id);

-- RLS : un utilisateur lit, crée et supprime uniquement ses propres intérêts.
ALTER TABLE public.tombola_interet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tombola_interet: lecture propres interets"
    ON public.tombola_interet FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "tombola_interet: creation propre interet"
    ON public.tombola_interet FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tombola_interet: suppression propre interet"
    ON public.tombola_interet FOR DELETE
    USING (auth.uid() = user_id);


-- =============================================================
-- MODIFICATION DE LA TABLE paiements (déjà existante)
--
-- Pourquoi rendre participation_id nullable ?
-- Un achat de ticket tombola (type='ticket') n'est pas lié à une
-- participation QCM. La contrainte NOT NULL existante empêcherait
-- d'enregistrer ces paiements. Cette modification est sans perte
-- de données : les lignes existantes ne sont pas affectées.
-- =============================================================

-- Rendre participation_id nullable pour supporter les paiements tombola
ALTER TABLE public.paiements
    ALTER COLUMN participation_id DROP NOT NULL;

-- Colonne type : distingue les paiements QCM ('score') des achats tombola ('ticket')
ALTER TABLE public.paiements
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'score'
        CHECK (type IN ('score', 'ticket'));

-- Lien optionnel vers la tombola (renseigné uniquement si type='ticket')
ALTER TABLE public.paiements
    ADD COLUMN IF NOT EXISTS tombola_id UUID REFERENCES public.tombola(id);


-- =============================================================
-- TABLE 3 : tickets
-- Un ticket est créé après validation du paiement CinetPay.
-- Le numéro de ticket est généré par l'application (format : TOM-{timestamp}-{random}).
-- Un utilisateur peut acheter plusieurs tickets pour la même tombola.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.tickets (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    tombola_id      UUID          NOT NULL REFERENCES public.tombola(id)   ON DELETE CASCADE,
    user_id         UUID          NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
    numero_ticket   TEXT          NOT NULL UNIQUE,
    prix_paye       NUMERIC(10, 2) NOT NULL,
    paiement_id     UUID          REFERENCES public.paiements(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour lister tous les tickets d'une tombola (tirage, stats)
CREATE INDEX IF NOT EXISTS idx_tickets_tombola
    ON public.tickets (tombola_id);

-- RLS : un utilisateur voit uniquement ses propres tickets.
-- La création de tickets se fait via service_role après validation du paiement.
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets: lecture propres tickets"
    ON public.tickets FOR SELECT
    USING (auth.uid() = user_id);
