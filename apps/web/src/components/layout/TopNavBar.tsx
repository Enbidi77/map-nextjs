'use client';

import * as React from 'react';
import {
  PanelLeftOpen,
  Users,
  LogIn,
  LogOut,
  Globe,
  Check,
} from 'lucide-react';
import {
  Button,
  SearchBar,
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
import { useMapStore } from '../../stores/useMapStore';
import { useResponsive } from '../../hooks/useMediaQuery';
import { useAuth } from '../../features/auth/useAuth';
import { usePresence } from '../../features/realtime/usePresence';
import { useTranslation } from '../../features/i18n';

export interface TopNavBarProps {
  onToggleLayerSelector?: () => void;
  isLayerSelectorOpen?: boolean;
}

export function TopNavBar(_props: TopNavBarProps = {}) {
  const { isMobile } = useResponsive();
  const sidebarOpen = useMapStore((state) => state.sidebarOpen);
  const toggleSidebar = useMapStore((state) => state.toggleSidebar);
  const setSidebarOpen = useMapStore((state) => state.setSidebarOpen);
  const sidebarView = useMapStore((state) => state.sidebarView);
  const setSidebarView = useMapStore((state) => state.setSidebarView);
  const searchQuery = useMapStore((state) => state.searchQuery);
  const setSearchQuery = useMapStore((state) => state.setSearchQuery);

  const { user, profile, openAuthModal, signOut } = useAuth();
  const { peers, isConnected } = usePresence();
  const { locale, setLocale, t, languages } = useTranslation();

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Global keyboard shortcut for ⌘K / Ctrl+K search focus
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSidebarOpen(true);
        setSidebarView('search');
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSidebarView, setSidebarOpen]);

  return (
    <>
      {/* Floating Top-Left Search Island (rendered ONLY when sidebar is collapsed) */}
      {!sidebarOpen && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl border border-black/5 dark:border-white/10 p-1.5 transition-all w-80 sm:w-96 animate-in fade-in zoom-in-95 duration-200">
          {/* Floating Expand Chip */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-label={t('nav.expandSidebar')}
            title={t('nav.expandSidebar')}
            className="h-8 w-8 text-primary hover:bg-primary/10 shrink-0 rounded-lg"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>

          {/* Search Input with ⌘K Shortcut */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              setSidebarOpen(true);
              setSidebarView('search');
              setTimeout(() => {
                searchInputRef.current?.focus();
              }, 50);
            }}
          >
            <SearchBar
              ref={searchInputRef}
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                if (val && sidebarView !== 'search') {
                  setSidebarView('search');
                }
              }}
              onSearch={(val) => {
                setSearchQuery(val);
                setSidebarView('search');
                setSidebarOpen(true);
              }}
              showDirectionsButton={false}
              placeholder={
                isMobile ? t('nav.searchPlaceholderMobile') : t('nav.searchPlaceholder')
              }
              className="h-8 py-0 border-0 bg-transparent shadow-none focus-within:ring-0 focus-visible:ring-0"
            />
          </div>
        </div>
      )}

      {/* Floating Top-Right Controls Island */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex items-center gap-1 sm:gap-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-black/5 dark:border-white/10 p-1.5 transition-all">
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
            variant="default"
            size="sm"
            onClick={() => openAuthModal('signin')}
            className="h-8 gap-1.5 px-3 text-xs font-medium shadow-sm"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('nav.signIn')}</span>
          </Button>
        )}
      </div>
    </>
  );
}
