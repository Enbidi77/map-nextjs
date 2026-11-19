'use client';

import * as React from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/client';
import type { AuthContextValue, AuthModalMode, UserProfile } from './types';
import { AuthModal } from './AuthModal';

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = React.useState(() => createClient());
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState<AuthModalMode>('signin');

  const openAuthModal = React.useCallback((mode: AuthModalMode = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = React.useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const fetchProfile = React.useCallback(
    async (currentUser: User): Promise<UserProfile> => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, full_name, avatar_url, created_at, updated_at')
          .eq('id', currentUser.id)
          .single();

        if (!error && data) {
          return data as UserProfile;
        }
      } catch {
        // user_profiles table might be empty or not yet seeded
      }

      // Fallback to metadata
      return {
        id: currentUser.id,
        email: currentUser.email ?? null,
        full_name:
          (currentUser.user_metadata?.full_name as string) ??
          (currentUser.user_metadata?.name as string) ??
          currentUser.email?.split('@')[0] ??
          'User',
        avatar_url: (currentUser.user_metadata?.avatar_url as string) ?? null,
      };
    },
    [supabase]
  );

  const refreshProfile = React.useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const prof = await fetchProfile(user);
    setProfile(prof);
  }, [user, fetchProfile]);

  React.useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            const userProfile = await fetchProfile(initialSession.user);
            if (isMounted) setProfile(userProfile);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchProfile(currentUser);
        if (isMounted) setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signInWithPassword = React.useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { error };
        }

        if (data.session?.user) {
          setUser(data.session.user);
          setSession(data.session);
          const prof = await fetchProfile(data.session.user);
          setProfile(prof);
          closeAuthModal();
        }

        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [supabase, fetchProfile, closeAuthModal]
  );

  const signUp = React.useCallback(
    async (email: string, password: string, fullName?: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
            },
          },
        });

        if (error) {
          return { error };
        }

        if (data.session?.user) {
          setUser(data.session.user);
          setSession(data.session);
          const prof = await fetchProfile(data.session.user);
          setProfile(prof);
          closeAuthModal();
        }

        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [supabase, fetchProfile, closeAuthModal]
  );

  const signInWithOAuth = React.useCallback(
    async (provider: 'github' | 'google') => {
      try {
        const redirectTo =
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined;

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
          },
        });

        if (error) {
          return { error };
        }

        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [supabase]
  );

  const signOut = React.useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }, [supabase]);

  const value: AuthContextValue = React.useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      setAuthModalMode,
      signInWithPassword,
      signUp,
      signInWithOAuth,
      signOut,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      isLoading,
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      setAuthModalMode,
      signInWithPassword,
      signUp,
      signInWithOAuth,
      signOut,
      refreshProfile,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={(open) => {
          if (!open) closeAuthModal();
        }}
        initialMode={authModalMode}
      />
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
