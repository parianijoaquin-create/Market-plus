// Cliente de Supabase con service_role (SOLO para el sync — ignora RLS).
// NUNCA importar este archivo desde el frontend.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    'Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno. ' +
      'En local: archivo .env. En GitHub Actions: repo Secrets.'
  );
}

export const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// IDs de data_sources (deben coincidir con el seed de 0001_init.sql).
export const SOURCE = {
  dolarapi: 1,
  data912: 2,
  bluelytics: 3,
} as const;
