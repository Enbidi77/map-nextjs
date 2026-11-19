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
  Maximize,
  Minimize,
  Bell,
  Search,
  LayoutDashboard,
  Map as MapIcon,
  X,
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
  const viewMode = useMapStore((state) => state.viewMode);
  const setViewMode = useMapStore((state) => state.setViewMode);

  const { user, profile, openAuthModal, signOut } = useAuth();
  const { peers, isConnected } = usePresence();

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isMac, setIsMac] = React.useState(false);

  // Detect platform for Cmd+K vs Ctrl+K
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    }
  }, []);

  // Track fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  // Global keyboard shortcut for ⌘K / Ctrl+K search focus
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setViewMode('map');
        searchInputRef.current?.focus();
        setSidebarView('search');
        setSidebarOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSidebarView, setSidebarOpen, setViewMode]);

  return (
    <header className="fixed top-3 left-3 right-3 sm:left-4 sm:right-4 z-40 flex h-14 items-center justify-between gap-2 sm:gap-3 rounded-full border border-white/40 dark:border-white/10 bg-white/75 dark:bg-zinc-900/75 px-3 sm:px-4 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all">
      {/* Brand & Sidebar Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="rounded-full text-muted-foreground hover:text-foreground"
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
            setViewMode('dashboard');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setViewMode('dashboard');
            }
          }}
          className="flex cursor-pointer items-center gap-2 select-none group"
          title="Go to Fusion Dashboard"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
            <Compass className="h-4 w-4" />
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
              Modern Maps
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Geospatial Fusion
            </span>
          </div>
        </div>

        {/* View Mode Toggle Pill (Dashboard <-> Map) */}
        <div className="hidden lg:flex items-center rounded-full border border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 p-0.5 ml-2 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setViewMode('dashboard')}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
              viewMode === 'dashboard'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
              viewMode === 'map'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* Center Search Pill with Ctrl+K shortcut badge */}
      <div className="flex-1 max-w-sm sm:max-w-md mx-1 sm:mx-2">
        <div className="relative flex items-center w-full rounded-full border border-white/40 dark:border-white/15 bg-white/60 dark:bg-zinc-800/50 px-3 py-1.5 backdrop-blur-xl shadow-inner transition-all focus-within:border-primary/50 focus-within:bg-white/90 dark:focus-within:bg-zinc-800/80 focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (val) {
                setViewMode('map');
                if (sidebarView !== 'search') setSidebarView('search');
                setSidebarOpen(true);
              }
            }}
            onFocus={() => {
              if (searchQuery) {
                setViewMode('map');
                setSidebarView('search');
                setSidebarOpen(true);
              }
            }}
            placeholder={
              isMobile ? 'Search places...' : 'Search places, coordinates, or landmarks...'
            }
            className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-0.5 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-0.5 rounded-md border border-white/40 dark:border-white/10 bg-white/60 dark:bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground shrink-0 select-none">
              <span>{isMac ? '⌘' : 'Ctrl'}</span>
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Directions Shortcut */}
        <Button
          variant={sidebarView === 'directions' && sidebarOpen && viewMode === 'map' ? 'secondary' : 'ghost'}
          size={isMobile ? 'icon-sm' : 'sm'}
          onClick={() => {
            setViewMode('map');
            if (sidebarView === 'directions' && sidebarOpen) {
              setSidebarOpen(false);
            } else {
              setSidebarView('directions');
              setSidebarOpen(true);
            }
          }}
          className="rounded-full gap-1 text-xs font-medium"
          aria-label="Directions"
        >
          <Navigation className="h-4 w-4 text-blue-500" />
          <span className="hidden md:inline">Directions</span>
        </Button>

        {/* Saved Places Shortcut */}
        <Button
          variant={sidebarView === 'saved' && sidebarOpen && viewMode === 'map' ? 'secondary' : 'ghost'}
          size={isMobile ? 'icon-sm' : 'sm'}
          onClick={() => {
            setViewMode('map');
            if (sidebarView === 'saved' && sidebarOpen) {
              setSidebarOpen(false);
            } else {
              setSidebarView('saved');
              setSidebarOpen(true);
            }
          }}
          className="relative rounded-full gap-1 text-xs font-medium"
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
            onClick={() => {
              setViewMode('map');
              onToggleLayerSelector();
            }}
            className="rounded-full"
            aria-label="Map layers & styles"
            title="Map layers & styles"
          >
            <Layers className="h-4 w-4 text-emerald-500" />
          </Button>
        )}

        {/* Fullscreen Button */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleFullscreen}
                className="rounded-full text-muted-foreground hover:text-foreground hidden sm:inline-flex"
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Notifications Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-2">
            <DropdownMenuLabel className="font-semibold text-xs flex items-center justify-between">
              <span>Notifications</span>
              <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-mono">
                3 unread
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-xs flex flex-col items-start gap-0.5 p-2"
              onClick={() => {
                setViewMode('dashboard');
              }}
            >
              <span className="font-semibold text-foreground">Mentioned in Embarcadero Route</span>
              <span className="text-[11px] text-muted-foreground">@sarah commented on your waypoint</span>
              <span className="text-[9px] text-muted-foreground font-mono">5m ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-xs flex flex-col items-start gap-0.5 p-2"
              onClick={() => {
                setViewMode('dashboard');
              }}
            >
              <span className="font-semibold text-foreground">New collaborative waypoint</span>
              <span className="text-[11px] text-muted-foreground">Alex added 3 vantage points</span>
              <span className="text-[9px] text-muted-foreground font-mono">28m ago</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer justify-center text-xs text-primary font-medium"
              onClick={() => setViewMode('dashboard')}
            >
              View all on Dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Realtime Collaboration Indicator */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/40 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 px-2.5 py-1 text-xs select-none cursor-default transition-all"
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
                className="relative h-8 w-8 rounded-full border border-white/50 dark:border-white/20 p-0 hover:ring-2 hover:ring-primary/40 overflow-hidden shadow-sm"
                aria-label="User account menu"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User avatar'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase">
                    {(profile?.full_name || user.email || 'N')[0]}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold leading-none text-foreground truncate">
                    {profile?.full_name || 'Nguyen Bao Duy'}
                  </p>
                  <p className="text-[11px] leading-none text-muted-foreground truncate font-mono">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-xs"
                onClick={() => setViewMode('dashboard')}
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-blue-500" />
                <span>Fusion Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-xs"
                onClick={() => {
                  setViewMode('map');
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
                  setViewMode('map');
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
            className="h-8 rounded-full gap-1.5 px-3 text-xs font-semibold shadow-md"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        )}
      </div>
    </header>
  );
}
