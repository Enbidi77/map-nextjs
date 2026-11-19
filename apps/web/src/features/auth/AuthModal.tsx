'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@modern-maps/ui';
import { Button } from '@modern-maps/ui';
import { Input } from '@modern-maps/ui';
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, User } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { useTranslation } from '../i18n';
import type { AuthModalMode } from './types';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AuthModalMode;
}

export function AuthModal({
  open,
  onOpenChange,
  initialMode = 'signin',
}: AuthModalProps) {
  const { t } = useTranslation();
  const { signInWithPassword, signUp, signInWithOAuth } = useAuthContext();

  const [mode, setMode] = React.useState<AuthModalMode>(initialMode);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync initialMode when modal opens
  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setSuccessMessage(null);
    }
  }, [open, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Client-side validations
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t('auth.emailRequired'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError(t('auth.emailInvalid'));
      return;
    }
    if (!password) {
      setError(t('auth.passwordRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch'));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error: signInError } = await signInWithPassword(trimmedEmail, password);
        if (signInError) {
          setError(signInError.message || t('auth.signInError'));
        } else {
          onOpenChange(false);
        }
      } else if (mode === 'signup') {
        const { error: signUpError } = await signUp(trimmedEmail, password, fullName.trim());
        if (signUpError) {
          setError(signUpError.message || t('auth.signUpError'));
        } else {
          setSuccessMessage(t('auth.signUpSuccess'));
          setTimeout(() => {
            onOpenChange(false);
          }, 1500);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.signInError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: oAuthError } = await signInWithOAuth(provider);
      if (oAuthError) {
        setError(oAuthError.message || `Failed to sign in with ${provider}.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OAuth sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6">
        <DialogHeader className="space-y-1.5 pb-2 text-center sm:text-center">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {mode === 'signin' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {mode === 'signin' ? t('auth.welcomeDesc') : t('auth.createDesc')}
          </DialogDescription>
        </DialogHeader>

        {/* Status Messages */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in-50"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in-50"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="flex-1">{successMessage}</p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOAuth('google')}
            disabled={isSubmitting}
            className="w-full text-xs gap-2"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {t('auth.signInGoogle')}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOAuth('github')}
            disabled={isSubmitting}
            className="w-full text-xs gap-2"
          >
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            {t('auth.signInGithub')}
          </Button>
        </div>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('auth.orEmail')}
            </span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label
                htmlFor="auth-fullname"
                className="text-xs font-medium text-foreground"
              >
                {t('auth.fullName')}
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-fullname"
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-8 text-xs"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="auth-email"
              className="text-xs font-medium text-foreground"
            >
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="auth-email"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="pl-8 text-xs"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="auth-password"
              className="text-xs font-medium text-foreground"
            >
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="pl-8 text-xs"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="space-y-1">
              <label
                htmlFor="auth-confirm-password"
                className="text-xs font-medium text-foreground"
              >
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pl-8 text-xs"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full text-xs font-medium h-9"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === 'signin' ? (
              t('auth.submitSignIn')
            ) : (
              t('auth.submitSignUp')
            )}
          </Button>
        </form>

        {/* Footer Toggle Mode */}
        <div className="mt-3 text-center text-xs text-muted-foreground">
          {mode === 'signin' ? (
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className="font-semibold text-primary hover:underline focus:outline-none"
            >
              {t('auth.noAccount')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className="font-semibold text-primary hover:underline focus:outline-none"
            >
              {t('auth.hasAccount')}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
