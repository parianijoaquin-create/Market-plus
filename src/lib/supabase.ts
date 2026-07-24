// Cliente de Supabase para el frontend (anon key, solo lectura via RLS).
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Mensaje claro en dev si falta el .env
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Revisa tu .env');
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: { persistSession: false },
});
