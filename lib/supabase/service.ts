import { createClient } from '@supabase/supabase-js'

// Client avec droits administrateur — contourne les RLS.
// À n'utiliser que côté serveur (route handlers, server actions).
export const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
