import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://ddrezpdjiiugdmadthjb.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkcmV6cGRqaWl1Z2RtYWR0aGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NDk5NjksImV4cCI6MjA5ODQyNTk2OX0.Jfole8s9dwdGhx45PdJqBKaLiBpNa_nnfrMKLJpw1P8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Isolated client for creating/managing sub-accounts without interfering
 * with the currently logged-in parent session in localStorage.
 */
export const createIsolatedSupabaseClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
};
