'use client';

import * as React from 'react';
import {
  Home,
  Search,
  Navigation,
  Bookmark,
  Layers,
  Settings,
  Eye,
  EyeOff,
  Box,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useMapStore, type NavPillId } from '../../stores/useMapStore';
import { SearchPanel } from './SearchPanel';
import { PlaceDetailsView } from './PlaceDetailsView';
import { DirectionsView } from './DirectionsView';
import { SavedPlacesView } from './SavedPlacesView';

export function SidebarContent() {
  const sidebarView = useMapStore((state) => state.sidebarView);
  const setSidebarView = useMapStore((state) => state.setSidebarView);
  const setViewMode = useMapStore((state) => state.setViewMode);
  const activeNavPill = useMapStore((state) => state.activeNavPill);
  const setActiveNavPill = useMapStore((state) => state.setActiveNavPill);
  const savedCount = useMapStore((state) => state.savedPlaces.length);
  const overlays = useMapStore((state) => state.overlays);
  const toggleOverlay = useMapStore((state) => state.toggleOverlay);
  const activeStyle = useMapStore((state) => state.activeStyle);
  const setActiveStyle = useMapStore((state) => state.setActiveStyle);
  const camera = useMapStore((state) => state.camera);
  const setCamera = useMapStore((state) => state.setCamera);

  const NAV_PILLS: Array<{
    id: NavPillId;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    onClick: () => void;
  }> = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="h-3.5 w-3.5" />,
      onClick: () => {
        setActiveNavPill('home');
        setViewMode('dashboard');
      },
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: <Search className="h-3.5 w-3.5" />,
      onClick: () => {
        setActiveNavPill('explore');
        setViewMode('map');
        setSidebarView('search');
      },
    },
    {
      id: 'directions',
      label: 'Directions',
      icon: <Navigation className="h-3.5 w-3.5" />,
      onClick: () => {
        setActiveNavPill('directions');
        setViewMode('map');
        setSidebarView('directions');
      },
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: <Bookmark className="h-3.5 w-3.5" />,
      badge: savedCount,
      onClick: () => {
        setActiveNavPill('saved');
        setViewMode('map');
        setSidebarView('saved');
      },
    },
    {
      id: 'layers',
      label: 'Layers',
      icon: <Layers className="h-3.5 w-3.5" />,
      badge: overlays.filter((l) => l.visible).length,
      onClick: () => {
        setActiveNavPill('layers');
        setViewMode('map');
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-3.5 w-3.5" />,
      onClick: () => {
        setActiveNavPill('settings');
      },
    },
  ];

  // Sync active nav pill with sidebar view when changed externally
  React.useEffect(() => {
    if (sidebarView === 'directions') {
      setActiveNavPill('directions');
    } else if (sidebarView === 'saved') {
      setActiveNavPill('saved');
    } else if (sidebarView === 'search' || sidebarView === 'place') {
      if (activeNavPill !== 'layers' && activeNavPill !== 'settings' && activeNavPill !== 'home') {
        setActiveNavPill('explore');
      }
    }
  }, [sidebarView, activeNavPill, setActiveNavPill]);

  return (
    <div className="flex flex-col gap-3.5 w-full min-w-0 max-w-full pb-4">
      {/* 6 Navigation Pills with Badges */}
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/40 dark:border-white/10 bg-white/50 dark:bg-zinc-800/40 p-1.5 backdrop-blur-xl shadow-sm">
        {NAV_PILLS.map((pill) => {
          const isActive = activeNavPill === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              suppressHydrationWarning
              onClick={pill.onClick}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold'
                  : 'text-muted-foreground hover:bg-white/60 dark:hover:bg-zinc-700/50 hover:text-foreground'
              }`}
            >
              <span className="shrink-0">{pill.icon}</span>
              <span className="truncate">{pill.label}</span>
              {pill.badge !== undefined && (
                <span
                  className={`flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-primary/15 text-primary'
                  }`}
                >
                  {pill.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Views */}
      {activeNavPill === 'explore' && sidebarView === 'search' && <SearchPanel />}
      {activeNavPill === 'explore' && sidebarView === 'place' && <PlaceDetailsView />}
      {activeNavPill === 'directions' && <DirectionsView />}
      {activeNavPill === 'saved' && <SavedPlacesView />}

      {/* Layers Management View */}
      {activeNavPill === 'layers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Map Overlays & Extrusions
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              {overlays.filter((l) => l.visible).length}/{overlays.length} active
            </span>
          </div>

          <div className="space-y-2">
            {overlays.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{layer.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Opacity: {Math.round(layer.opacity * 100)}%
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleOverlay(layer.id)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                    layer.visible
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground border-border'
                  }`}
                  aria-label={`Toggle ${layer.name}`}
                >
                  {layer.visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Base Style Switcher */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cartographic Base Styles
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'streets', name: 'Streets Pro' },
                { id: 'dark', name: 'Night Glass' },
                { id: 'light', name: 'Minimal Light' },
                { id: 'satellite', name: 'Satellite Imagery' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setActiveStyle(style.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    activeStyle === style.id
                      ? 'border-primary bg-primary/15 text-primary font-semibold ring-1 ring-primary/30'
                      : 'border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings & Customization View */}
      {activeNavPill === 'settings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Display & Preferences
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">Modern Maps v5.1</span>
          </div>

          <div className="space-y-2.5">
            {/* 3D Buildings Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                  <Box className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">3D Building Tilt</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Pitch: {Math.round(camera.pitch)}°
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCamera({ pitch: camera.pitch > 20 ? 0 : 60 })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  camera.pitch > 20
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-muted/60 text-muted-foreground'
                }`}
              >
                {camera.pitch > 20 ? 'Active (60°)' : 'Flat (0°)'}
              </button>
            </div>

            {/* Fusion UI Liquid Glass Mode */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Liquid Glass Blur</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Apple Glass + Google Material
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-semibold border border-emerald-500/30">
                Enabled
              </span>
            </div>

            {/* Default Coordinates */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Current Center</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {camera.center[1].toFixed(4)}, {camera.center[0].toFixed(4)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCamera({ center: [-122.4194, 37.7749], zoom: 12, pitch: 0 })}
                className="text-xs text-primary font-medium hover:underline"
              >
                Reset SF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback to search if home was selected in sidebar */}
      {activeNavPill === 'home' && (
        <div className="p-4 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Viewing Fusion Overview Dashboard. Click below to return to the interactive map.
          </p>
          <button
            type="button"
            onClick={() => {
              setViewMode('map');
              setActiveNavPill('explore');
            }}
            className="w-full rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Switch to Full Map Canvas
          </button>
        </div>
      )}
    </div>
  );
}
