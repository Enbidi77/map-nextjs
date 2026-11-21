'use client';

import * as React from 'react';
import {
  Compass,
  Search,
  Navigation,
  Bookmark,
  SlidersHorizontal,
  X,
  Car,
  Bus,
  Footprints,
  Bike,
  MapPin,
  ArrowUpDown,
  Plus,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button, cn } from '@modern-maps/ui';
import { useMapStore } from '../../stores/useMapStore';
import { useResponsive } from '../../hooks/useMediaQuery';
import { SearchPanel } from '../sidebar/SearchPanel';
import { SavedPlacesView } from '../sidebar/SavedPlacesView';
import { PlaceDetailsView } from '../sidebar/PlaceDetailsView';
import type { Coordinate } from '@modern-maps/types';

interface RecentPlace {
  name: string;
  coord: Coordinate;
}

const RECENT_SEARCHES: RecentPlace[] = [
  { name: 'District 1, Ho Chi Minh City', coord: [106.6976, 10.7769] },
  { name: 'Hanoi Old Quarter', coord: [105.8522, 21.0333] },
];

const POPULAR_DESTINATIONS: Array<{ label: string; coord: Coordinate }> = [
  { label: 'Việt Nam', coord: [108.2772, 14.0583] },
  { label: 'Hà Nội', coord: [105.8342, 21.0278] },
  { label: 'Thành phố Hồ Chí Minh', coord: [106.6297, 10.8231] },
];

export function FloatingMapCards() {
  const { isMobile } = useResponsive();

  const sidebarOpen = useMapStore((state) => state.sidebarOpen);
  const toggleSidebar = useMapStore((state) => state.toggleSidebar);
  const setSidebarOpen = useMapStore((state) => state.setSidebarOpen);
  const sidebarView = useMapStore((state) => state.sidebarView);
  const setSidebarView = useMapStore((state) => state.setSidebarView);
  const searchQuery = useMapStore((state) => state.searchQuery);
  const setSearchQuery = useMapStore((state) => state.setSearchQuery);
  const savedCount = useMapStore((state) => state.savedPlaces.length);

  const directions = useMapStore((state) => state.directions);
  const setOrigin = useMapStore((state) => state.setOrigin);
  const setDestination = useMapStore((state) => state.setDestination);
  const setTransitMode = useMapStore((state) => state.setTransitMode);
  const calculateRoute = useMapStore((state) => state.calculateRoute);
  const swapOriginDestination = useMapStore((state) => state.swapOriginDestination);
  const clearDirections = useMapStore((state) => state.clearDirections);
  const userLocation = useMapStore((state) => state.userLocation);
  const setCamera = useMapStore((state) => state.setCamera);

  const [originInput, setOriginInput] = React.useState(directions.originName || '');
  const [destInput, setDestInput] = React.useState(directions.destinationName || '');

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync inputs with store
  React.useEffect(() => {
    setOriginInput(directions.originName || '');
  }, [directions.originName]);

  React.useEffect(() => {
    setDestInput(directions.destinationName || '');
  }, [directions.destinationName]);

  // Global ⌘K / Ctrl+K shortcut
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
  }, [setSidebarOpen, setSidebarView]);

  // Use current location handler
  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setOrigin(userLocation, 'Current Location');
      setOriginInput('Current Location');
      return;
    }
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coord: Coordinate = [pos.coords.longitude, pos.coords.latitude];
          setOrigin(coord, 'Current Location');
          setOriginInput('Current Location');
        },
        () => {
          const fallback: Coordinate = [-122.2979, 37.5629];
          setOrigin(fallback, 'Current Location');
          setOriginInput('Current Location');
        }
      );
    } else {
      const fallback: Coordinate = [-122.2979, 37.5629];
      setOrigin(fallback, 'Current Location');
      setOriginInput('Current Location');
    }
  };

  // Calculate route handler
  const handleGetDirections = async () => {
    if (!directions.origin && originInput) {
      if (originInput === 'Current Location') {
        const loc = userLocation || [-122.2979, 37.5629];
        setOrigin(loc, 'Current Location');
      } else if (originInput === 'Việt Nam') {
        setOrigin([108.2772, 14.0583], 'Việt Nam');
      } else {
        setOrigin([-122.2979, 37.5629], originInput);
      }
    } else if (!directions.origin) {
      const loc = userLocation || [-122.2979, 37.5629];
      setOrigin(loc, 'Current Location');
      setOriginInput('Current Location');
    }

    if (!directions.destination && destInput) {
      const pop = POPULAR_DESTINATIONS.find((p) => p.label === destInput);
      if (pop) {
        setDestination(pop.coord, pop.label);
      } else {
        setDestination([-122.285, 37.565], destInput);
      }
    } else if (!directions.destination) {
      // Default destination for demonstration
      setDestination([-122.285, 37.565], 'Foster City Canal');
      setDestInput('Foster City Canal');
    }

    setTimeout(() => {
      calculateRoute();
    }, 50);
  };

  // Recent item click
  const handleSelectRecent = (recent: RecentPlace) => {
    setDestInput(recent.name);
    setDestination(recent.coord, recent.name);
    if (!directions.origin) {
      const loc = userLocation || [-122.2979, 37.5629];
      setOrigin(loc, 'Current Location');
      setOriginInput('Current Location');
    }
    setCamera({ center: recent.coord, zoom: 14 });
    setTimeout(() => {
      calculateRoute();
    }, 50);
  };

  // If on mobile viewport, skip floating desktop panels (mobile bottom sheet handles mobile view)
  if (isMobile) {
    return null;
  }

  const activeMode = directions.mode || 'driving';

  return (
    <div
      className="absolute top-4 left-4 z-20 flex flex-col gap-3 w-80 sm:w-[380px] md:w-[400px] pointer-events-none max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar pb-6 [&>*]:pointer-events-auto"
      data-testid="floating-cards-container"
    >
      {/* 1. Top-Left Floating Header Card */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl border border-black/5 dark:border-white/10 p-2.5 sm:p-3 flex flex-col gap-2.5 transition-all">
        {/* Row 1: Brand Blue Button + Search Input with ⌘K & Sidebar Toggle */}
        <div className="flex items-center gap-2">
          {/* Blue circular logo/brand button with link/compass icon */}
          <button
            type="button"
            onClick={() => {
              setSidebarView('search');
              setSidebarOpen(true);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title="Modern Maps"
            aria-label="Modern Maps Brand"
          >
            <Compass className="h-5 w-5" />
          </button>

          {/* Search input with placeholder 'Search places, coordinates, or ad...', ⌘K badge, and right sidebar toggle */}
          <div className="relative flex-1 min-w-0 flex items-center rounded-xl bg-muted/40 hover:bg-muted/60 focus-within:bg-background border border-border/60 focus-within:border-primary/50 transition-colors h-9 px-2.5 gap-1.5">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value && sidebarView !== 'search') {
                  setSidebarView('search');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSidebarView('search');
                  setSidebarOpen(true);
                }
              }}
              placeholder="Search places, coordinates, or ad..."
              className="flex-1 min-w-0 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="h-5 w-5 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded bg-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground border border-border/50">
                ⌘K
              </kbd>
            )}
            <button
              type="button"
              onClick={toggleSidebar}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title={sidebarOpen ? 'Hide panels' : 'Show panels'}
              aria-label="Toggle panels"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: 3 Pill Buttons: Explore, Directions, Saved */}
        <div className="flex items-center gap-1.5 rounded-xl bg-muted/40 p-1 w-full min-w-0">
          {/* Explore Pill */}
          <button
            type="button"
            onClick={() => {
              setSidebarView('search');
              setSidebarOpen(true);
            }}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs transition-all cursor-pointer select-none',
              sidebarView === 'search' || sidebarView === 'place'
                ? 'bg-white dark:bg-slate-800 text-foreground border border-border/80 shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
            )}
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span>Explore</span>
          </button>

          {/* Directions Pill (Active state in screenshot: white background, outline, bold text, navigation arrow) */}
          <button
            type="button"
            onClick={() => {
              setSidebarView('directions');
              setSidebarOpen(true);
            }}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs transition-all cursor-pointer select-none',
              sidebarView === 'directions'
                ? 'bg-white dark:bg-slate-800 text-foreground border border-border/80 shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
            )}
          >
            <Navigation className="h-3.5 w-3.5 shrink-0 rotate-45 text-blue-600 dark:text-blue-400" />
            <span>Directions</span>
          </button>

          {/* Saved Pill (bookmark icon + badge 2) */}
          <button
            type="button"
            onClick={() => {
              setSidebarView('saved');
              setSidebarOpen(true);
            }}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs transition-all cursor-pointer select-none',
              sidebarView === 'saved'
                ? 'bg-white dark:bg-slate-800 text-foreground border border-border/80 shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
            )}
          >
            <Bookmark className="h-3.5 w-3.5 shrink-0" />
            <span>Saved</span>
            {savedCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/80 px-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Content Cards under Header Card (Rendered when sidebarOpen is true) */}
      {sidebarOpen && sidebarView === 'directions' && (
        <>
          {/* Floating Directions Card */}
          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl border border-black/5 dark:border-white/10 p-3.5 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
            {/* Mode selector tabs: Drive, Transit, Walk, Bike */}
            <div className="grid grid-cols-4 gap-1.5">
              {/* Drive */}
              <button
                type="button"
                onClick={() => setTransitMode('driving')}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-xs transition-all cursor-pointer select-none',
                  activeMode === 'driving'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-transparent font-medium'
                )}
              >
                <Car className="h-4 w-4" />
                <span className="text-[11px]">Drive</span>
              </button>

              {/* Transit */}
              <button
                type="button"
                onClick={() => setTransitMode('transit')}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-xs transition-all cursor-pointer select-none',
                  activeMode === 'transit'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-transparent font-medium'
                )}
              >
                <Bus className="h-4 w-4" />
                <span className="text-[11px]">Transit</span>
              </button>

              {/* Walk */}
              <button
                type="button"
                onClick={() => setTransitMode('walking')}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-xs transition-all cursor-pointer select-none',
                  activeMode === 'walking'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-transparent font-medium'
                )}
              >
                <Footprints className="h-4 w-4" />
                <span className="text-[11px]">Walk</span>
              </button>

              {/* Bike */}
              <button
                type="button"
                onClick={() => setTransitMode('cycling')}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-xs transition-all cursor-pointer select-none',
                  activeMode === 'cycling'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-transparent font-medium'
                )}
              >
                <Bike className="h-4 w-4" />
                <span className="text-[11px]">Bike</span>
              </button>
            </div>

            {/* Origin & Destination Inputs with Dotted Line & Swap */}
            <div className="flex gap-2.5 items-stretch relative">
              {/* Left Indicator Column: Green Dot, Dotted Vertical Line, Red Pin */}
              <div className="flex flex-col items-center justify-between py-2 shrink-0 w-4">
                {/* Green Origin Dot */}
                <div className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0" />
                {/* Dotted Vertical Line */}
                <div className="w-0.5 flex-1 border-l-2 border-dotted border-muted-foreground/40 my-1" />
                {/* Red Destination Pin */}
                <MapPin className="h-4 w-4 text-red-500 shrink-0" />
              </div>

              {/* Right Column: Inputs and Chips */}
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                {/* Origin Input Row */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={originInput}
                    onChange={(e) => {
                      setOriginInput(e.target.value);
                      if (!e.target.value) setOrigin(null);
                    }}
                    placeholder="Choose starting point..."
                    className="flex-1 min-w-0 rounded-xl bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/60 focus:border-primary/50 text-xs h-9 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                  />
                  {/* Swap Button on Right */}
                  <button
                    type="button"
                    onClick={swapOriginDestination}
                    className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                    title="Swap origin and destination"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Sub-row under Origin: 'Use Current Location' (blue arrow) + 'Việt Nam' chip */}
                <div className="flex items-center gap-2 pl-0.5">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer select-none"
                  >
                    <Navigation className="h-3 w-3 fill-blue-600 dark:fill-blue-400 rotate-45" />
                    <span>Use Current Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrigin([108.2772, 14.0583], 'Việt Nam');
                      setOriginInput('Việt Nam');
                    }}
                    className="inline-flex items-center rounded-full bg-muted/60 hover:bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer select-none"
                  >
                    Việt Nam
                  </button>
                </div>

                {/* Destination Input Row */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={destInput}
                    onChange={(e) => {
                      setDestInput(e.target.value);
                      if (!e.target.value) setDestination(null);
                    }}
                    placeholder="Choose destination..."
                    className="flex-1 min-w-0 rounded-xl bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/60 focus:border-primary/50 text-xs h-9 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                  />
                  {destInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setDestInput('');
                        setDestination(null);
                      }}
                      className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground flex items-center justify-center shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* '+ Add stop' button */}
            <div className="flex items-center justify-between px-0.5">
              <button
                type="button"
                onClick={() => {
                  /* Optional multi-stop extension */
                }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium py-0.5 w-fit cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add stop</span>
              </button>
            </div>

            {/* 'Popular:' chips: 'Việt Nam', 'Hà Nội', 'Thành phố Hồ Chí Minh' */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                Popular:
              </span>
              {POPULAR_DESTINATIONS.map((pop) => (
                <button
                  key={pop.label}
                  type="button"
                  onClick={() => {
                    setDestInput(pop.label);
                    setDestination(pop.coord, pop.label);
                  }}
                  className="rounded-full bg-muted/60 hover:bg-muted px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer select-none"
                >
                  {pop.label}
                </button>
              ))}
            </div>

            {/* Large primary blue button: 'Get Directions' with navigation arrow icon */}
            <Button
              type="button"
              onClick={handleGetDirections}
              disabled={directions.isLoading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-lg active:scale-[0.99]"
            >
              {directions.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Navigation className="h-4 w-4 fill-white rotate-45" />
              )}
              <span>Get Directions</span>
            </Button>

            {/* Route Summary (if calculated) */}
            {directions.isActive && directions.distanceMeters !== null && (
              <div className="flex flex-col gap-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 p-2.5 mt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {directions.durationSeconds !== null
                        ? `${Math.round(directions.durationSeconds / 60)} min`
                        : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (
                      {directions.distanceMeters >= 1000
                        ? `${(directions.distanceMeters / 1000).toFixed(1)} km`
                        : `${directions.distanceMeters} m`}
                      )
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearDirections}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                {directions.steps.length > 0 && (
                  <div className="text-[11px] text-muted-foreground truncate">
                    Next: {directions.steps[0]?.instruction}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Floating Recent Searches Card (below Directions card) */}
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl border border-black/5 dark:border-white/10 p-3 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
            {/* Title 'Recent' */}
            <h4 className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase px-1">
              Recent
            </h4>

            {/* List with clock icon: 'District 1, Ho Chi Minh City' and 'Hanoi Old Quarter' */}
            <div className="flex flex-col gap-1">
              {RECENT_SEARCHES.map((item) => (
                <div
                  key={item.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectRecent(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSelectRecent(item);
                  }}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors select-none"
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Explore / Search Card (when sidebarView === 'search') */}
      {sidebarOpen && sidebarView === 'search' && (
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl border border-black/5 dark:border-white/10 p-3 sm:p-3.5 flex flex-col gap-3 max-h-[calc(100vh-140px)] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200">
          <SearchPanel />
        </div>
      )}

      {/* Saved Places Card (when sidebarView === 'saved') */}
      {sidebarOpen && sidebarView === 'saved' && (
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl border border-black/5 dark:border-white/10 p-3 sm:p-3.5 flex flex-col gap-3 max-h-[calc(100vh-140px)] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200">
          <SavedPlacesView />
        </div>
      )}

      {/* Place Details Card (when sidebarView === 'place') */}
      {sidebarOpen && sidebarView === 'place' && (
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl border border-black/5 dark:border-white/10 p-3 sm:p-3.5 flex flex-col gap-3 max-h-[calc(100vh-140px)] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200">
          <PlaceDetailsView />
        </div>
      )}
    </div>
  );
}
