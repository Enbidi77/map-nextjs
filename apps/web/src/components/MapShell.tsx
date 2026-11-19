'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { TopNavBar } from './layout/TopNavBar';
import { ResizableSidebar } from './layout/ResizableSidebar';
import { MobileBottomSheet } from './mobile/MobileBottomSheet';
import { FusionDashboard } from './fusion/FusionDashboard';
import { useUrlSync } from '../hooks/useUrlSync';
import { useMapStore } from '../stores/useMapStore';

// Dynamically load InteractiveMap on client-side only to ensure WebGL & MapLibre GL work smoothly
const DynamicInteractiveMap = dynamic(
  () => import('./map/InteractiveMap').then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
        <span className="mt-3 font-mono text-xs text-muted-foreground">
          Initializing Geospatial Map Engine...
        </span>
      </div>
    ),
  }
);

export function MapShell() {
  // Activate two-way URL synchronization (?lat=...&lng=...&z=...&pitch=...&bearing=...)
  useUrlSync();

  const [isLayerSelectorOpen, setIsLayerSelectorOpen] = React.useState(false);
  const viewMode = useMapStore((state) => state.viewMode);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Top Floating Glass Capsule Navigation Bar */}
      <TopNavBar
        isLayerSelectorOpen={isLayerSelectorOpen}
        onToggleLayerSelector={() => setIsLayerSelectorOpen((prev) => !prev)}
      />

      {/* Main Workspace: Fusion Dashboard Overview or Full Map Navigation */}
      <main className="relative flex flex-1 h-screen w-full pt-18 sm:pt-20 overflow-hidden">
        {/* View Mode: Fusion Dashboard Overview */}
        {viewMode === 'dashboard' && (
          <div className="relative z-10 flex-1 h-full w-full overflow-hidden animate-in fade-in-50 duration-300">
            {/* Ambient Background Gradient Lighting Spheres */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl"
            />

            <FusionDashboard className="h-full" />
          </div>
        )}

        {/* View Mode: Interactive Map Canvas + Resizable Sidebar */}
        <div
          className={`relative flex flex-1 h-full w-full overflow-hidden transition-opacity duration-300 ${
            viewMode === 'map'
              ? 'opacity-100 z-10'
              : 'opacity-0 pointer-events-none absolute inset-0 z-0'
          }`}
        >
          {/* Desktop / Tablet Resizable Sidebar */}
          <ResizableSidebar />

          {/* MapLibre GL Interactive Canvas & Controls */}
          <DynamicInteractiveMap
            isLayerSelectorOpen={isLayerSelectorOpen}
            onToggleLayerSelector={() => setIsLayerSelectorOpen((prev) => !prev)}
          />

          {/* Mobile Viewport Responsive Bottom Sheet */}
          <MobileBottomSheet />
        </div>
      </main>
    </div>
  );
}
