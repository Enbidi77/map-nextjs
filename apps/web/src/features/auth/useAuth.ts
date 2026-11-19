import { useAuthContext } from './AuthProvider';

/**
 * Hook for consuming Supabase authentication and user profile state.
 */
export function useAuth() {
  return useAuthContext();
}
