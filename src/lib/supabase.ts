import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // These are inlined by Vite at BUILD time, so a missing value here means the
  // variables were not exposed to the build (vercel.json > build.env, or the
  // project's Environment Variables in the Vercel dashboard).
  throw new Error(
    'Configuration Supabase manquante : VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ne sont pas ' +
      'disponibles au moment du build. Vérifiez vercel.json (build.env) ou les variables ' +
      "d'environnement du projet Vercel, puis relancez le déploiement."
  );
}

const supabase = createClient(url, anonKey);
export default supabase;
