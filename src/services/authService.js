import { getSupabaseClient, getSupabaseInitError, isSupabaseConfigured } from "./supabaseClient";

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    const initError = getSupabaseInitError();
    if (initError) {
      throw new Error(`Supabase init failed: ${initError.message}`);
    }
    throw new Error("Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_PUBLISHABLE_KEY.");
  }
  return client;
}

export const authService = {
  isEnabled() {
    return isSupabaseConfigured();
  },

  async signUp(email, password) {
    const client = requireClient();
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) {
      throw error;
    }
    return data;
  },

  async signInWithPassword(email, password) {
    const client = requireClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    return data;
  },

  async signOut() {
    const client = requireClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw error;
    }
  },

  async getSession() {
    const client = getSupabaseClient();
    if (!client) {
      return { session: null };
    }

    const { data, error } = await client.auth.getSession();
    if (error) {
      throw error;
    }

    return { session: data.session || null };
  },

  onAuthStateChange(callback) {
    const client = getSupabaseClient();
    if (!client) {
      return () => undefined;
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      callback(session || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  },
};
