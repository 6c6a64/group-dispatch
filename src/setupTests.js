jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
      signUp: jest.fn(async () => ({ data: { session: null }, error: null })),
      signInWithPassword: jest.fn(async () => ({ data: { session: null }, error: null })),
      signOut: jest.fn(async () => ({ error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: [], error: null })),
      insert: jest.fn(() => ({ error: null })),
      delete: jest.fn(() => ({
        not: jest.fn(() => ({ error: null })),
      })),
    })),
  })),
}));
