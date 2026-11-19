'use client';

import * as React from 'react';
import {
  Compass,
  Navigation,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Bookmark,
  Users,
  LogIn,
  LogOut,
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
} from '@modern-maps/ui';
import { useMapStore } from '../../stores/useMapStore';
import { useResponsive } from '../../hooks/useMediaQuery';
import { useAuth } from '../../features/auth/useAuth';
import { usePresence } from '../../features/realtime/usePresence';

export interface TopNavBarProps {
  onToggleLayerSelector?: () => void;
  isLayerSelectorOpen?: boolean;
}

export function TopNavBar({
  onToggleLayerSelector,
  isLayerSelectorOpen = false,
}: TopNavBarProps) {
  const { isMobile } = useResponsive();
  const sidebarOpen = useMapStore((state) => state.sidebarOpen);
  const toggleSidebar = useMapStore((state) => state.toggleSidebar);
  const setSidebarOpen = useMapStore((state) => state.setSidebarOpen);
  const sidebarView = useMapStore((state) => state.sidebarView);
  const setSidebarView = useMapStore((state) => state.setSidebarView);
  const searchQuery = useMapStore((state) => state.searchQuery);
  const setSearchQuery = useMapStore((state) => state.setSearchQuery);
  const savedPlacesCount = useMapStore((state) => state.savedPlaces.length);

  const { user, profile, openAuthModal, signOut } = useAuth();
  const { peers, isConnected } = usePresence();

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Global keyboard shortcut for ⌘K / Ctrl+K search focus
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSidebarView('search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSidebarView]);

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-3 backdrop-blur-md transition-all sm:px-4">
      {/* Brand & Sidebar Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>

        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setSidebarView('search');
            setSidebarOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSidebarView('search');
              setSidebarOpen(true);
            }
          }}
          className="flex cursor-pointer items-center gap-2 select-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Compass className="h-5 w-5 animate-pulse" />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-bold text-sm tracking-tight text-foreground">
              Modern Maps
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Geospatial Platform
            </span>
          </div>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md">
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
          showDirectionsButton={true}
          onDirectionsClick={() => {
            setSidebarView('directions');
            setSidebarOpen(true);
          }}
          placeholder={
            isMobile ? 'Search places...' : 'Search places, coordinates, or addresses...'
          }
          className="h-9 py-0 shadow-sm"
        />
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Directions View Shortcut */}
        <Button
          variant={sidebarView === 'directions' && sidebarOpen ? 'secondary' : 'ghost'}
          size={isMobile ? 'icon-sm' : 'sm'}
          onClick={() => {
            if (sidebarView === 'directions' && sidebarOpen) {
              setSidebarOpen(false);
            } else {
              setSidebarView('directions');
              setSidebarOpen(true);
            }
          }}
          className="gap-1.5 text-xs font-medium"
          aria-label="Directions"
        >
          <Navigation className="h-4 w-4 text-primary" />
          <span className="hidden md:inline">Directions</span>
        </Button>

        {/* Saved Places Shortcut */}
        <Button
          variant={sidebarView === 'saved' && sidebarOpen ? 'secondary' : 'ghost'}
          size={isMobile ? 'icon-sm' : 'sm'}
          onClick={() => {
            if (sidebarView === 'saved' && sidebarOpen) {
              setSidebarOpen(false);
            } else {
              setSidebarView('saved');
              setSidebarOpen(true);
            }
          }}
          className="relative gap-1.5 text-xs font-medium"
          aria-label="Saved places"
        >
          <Bookmark className="h-4 w-4 text-amber-500" />
          <span className="hidden md:inline">Saved</span>
          {savedPlacesCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/20 px-1 text-[10px] font-bold text-primary">
              {savedPlacesCount}
            </span>
          )}
        </Button>

        {/* Layers & Styles Button */}
        {onToggleLayerSelector && (
          <Button
            variant={isLayerSelectorOpen ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={onToggleLayerSelector}
            aria-label="Map layers & styles"
            title="Map layers & styles"
          >
            <Layers className="h-4 w-4" />
          </Button>
        )}

        {/* Realtime Collaboration Indicator */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs select-none cursor-default transition-all hover:bg-muted/70"
                aria-label={`Collaborative session: ${peers.length + 1} online`}
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
                {isConnected ? 'Realtime Session Active' : 'Connecting to session...'}
              </p>
              <p className="text-[11px] opacity-80">
                {peers.length === 0
                  ? 'Only you are currently in this session.'
                  : `${peers.length + 1} active collaborators online.`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Theme Switcher */}
        <ThemeToggle size="icon-sm" variant="dropdown" />

        {/* Supabase Auth State / User Profile Avatar Dropdown */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative h-8 w-8 rounded-full border border-border/80 p-0 hover:ring-2 hover:ring-primary/20 overflow-hidden"
                aria-label="User account menu"
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
            <DropdownMenuContent align="end" className="w-56 p-1">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold leading-none text-foreground truncate">
                    {profile?.full_name || 'Signed In'}
                  </p>
                  <p className="text-[11px] leading-none text-muted-foreground truncate font-mono">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-xs"
                onClick={() => {
                  setSidebarView('saved');
                  setSidebarOpen(true);
                }}
              >
                <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                <span>My Saved Places</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-xs"
                onClick={() => {
                  setSidebarView('search');
                  setSidebarOpen(true);
                }}
              >
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span>Explore Map</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
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
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        )}
      </div>
    </header>
  );
}
