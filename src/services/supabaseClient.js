import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

let supabaseClient = null;
let supabaseInitError = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    supabaseInitError = error instanceof Error ? error : new Error(String(error));
    supabaseClient = null;
  }
}

export function isSupabaseConfigured() {
  return Boolean(supabaseClient);
}

export function getSupabaseClient() {
  return supabaseClient;
}

export function getSupabaseInitError() {
  return supabaseInitError;
}
