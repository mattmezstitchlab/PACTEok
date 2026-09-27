import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  // Fail loudly and legibly instead of letting createClient throw "supabaseUrl is required"
  // with no indication of which variable is missing.
  const missing = [
    !SUPABASE_URL && 'SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)',
    !SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean);
  throw new Error(
    `Configuration Supabase incomplète. Variable(s) manquante(s) : ${missing.join(', ')}. ` +
      'Ajoutez-les dans Vercel > Settings > Environment Variables, puis redéployez.'
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: async (url, options) => {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500) triggerRestore();
      return res;
    },
  },
});

export default supabase;
