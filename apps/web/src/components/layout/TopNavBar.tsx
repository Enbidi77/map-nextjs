'use client';

import * as React from 'react';
import {
  Users,
  LogOut,
  Globe,
  Check,
  User,
} from 'lucide-react';
import {
  Button,
  ThemeToggle,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  cn,
} from '@modern-maps/ui';
import { useAuth } from '../../features/auth/useAuth';
import { usePresence } from '../../features/realtime/usePresence';
import { useTranslation } from '../../features/i18n';

export interface TopNavBarProps {
  onToggleLayerSelector?: () => void;
  isLayerSelectorOpen?: boolean;
}

export function TopNavBar(_props: TopNavBarProps = {}) {
  const { user, profile, openAuthModal, signOut } = useAuth();
  const { peers, isConnected } = usePresence();
  const { locale, setLocale, t, languages } = useTranslation();

  return (
    <>
      {/* Floating Top-Right Controls Island (Pill Toolbar) */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg border border-black/5 dark:border-white/10 p-1.5 transition-all">
        {/* Realtime Collaboration Presence Indicator */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-xs select-none cursor-default transition-all hover:bg-muted/70"
                aria-label={`${t('nav.onlineSession')}: ${peers.length + 1} online`}
              >
                <span
                  className={`h-2 w-2 rounded-full transition-colors ${
                    isConnected
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                      : 'bg-muted-foreground/40'
                  }`}
                />
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono text-[11px] font-semibold text-foreground">
                  {peers.length + 1}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-semibold">
                {isConnected ? t('nav.sessionActive') : t('nav.sessionConnecting')}
              </p>
              <p className="text-[11px] opacity-80">
                {peers.length === 0
                  ? t('nav.sessionSolo')
                  : t('nav.sessionCollaborators', { count: peers.length + 1 })}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Language / Locale Picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label={t('nav.language')}
              title={t('nav.language')}
            >
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1">
            <DropdownMenuLabel className="text-xs font-semibold px-2 py-1">
              {t('nav.language')}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {languages.map((lang) => {
              const isSelected = lang.code === locale;
              return (
                <DropdownMenuItem
                  key={lang.code}
                  className={cn(
                    'cursor-pointer text-xs flex items-center justify-between rounded px-2 py-1.5 transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-accent'
                  )}
                  onSelect={() => setLocale(lang.code)}
                  onClick={() => setLocale(lang.code)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {lang.code}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Switcher */}
        <ThemeToggle size="icon-sm" variant="dropdown" />

        {/* Auth / Profile */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative h-8 w-8 rounded-full border border-border/80 p-0 hover:ring-2 hover:ring-primary/20 overflow-hidden"
                aria-label={t('nav.userMenu')}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User avatar'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-bold text-primary uppercase">
                    {(profile?.full_name || user.email || 'U')[0]}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold leading-none text-foreground truncate">
                    {profile?.full_name || t('nav.signedIn')}
                  </p>
                  <p className="text-[11px] leading-none text-muted-foreground truncate font-mono">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{t('nav.signOut')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openAuthModal('signin')}
            className="relative h-8 w-8 rounded-full border border-border/80 p-0 hover:ring-2 hover:ring-primary/20 overflow-hidden bg-muted/40 text-muted-foreground hover:text-foreground shrink-0"
            aria-label={t('nav.signIn')}
            title={t('nav.signIn')}
          >
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold">
              <User className="h-4 w-4" />
            </div>
          </Button>
        )}
      </div>
    </>
  );
}
