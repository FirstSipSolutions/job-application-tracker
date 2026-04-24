// TODO: wire to supabase.auth — return { user, session, signIn, signOut, loading }
export function useAuth() {
  return { user: null, session: null, loading: false };
}
