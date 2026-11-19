import { useAuthContext } from './AuthProvider';
import type { AuthContextValue } from './types';

const DEFAULT_FALLBACK_AUTH: AuthContextValue = {
  user: null,
  profile: null,
  session: null,
  isLoading: false,
  isAuthModalOpen: false,
  authModalMode: 'signin',
  openAuthModal: () => {},
  closeAuthModal: () => {},
  setAuthModalMode: () => {},
  signInWithPassword: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithOAuth: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
};

/**
 * Hook for consuming Supabase authentication and user profile state.
 * Gracefully provides default fallback state if rendered outside AuthProvider (e.g. tests).
 */
export function useAuth(): AuthContextValue {
  try {
    return useAuthContext();
  } catch {
    return DEFAULT_FALLBACK_AUTH;
  }
}
