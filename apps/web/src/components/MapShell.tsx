'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { TopNavBar } from './layout/TopNavBar';
import { ResizableSidebar } from './layout/ResizableSidebar';
import { MobileBottomSheet } from './mobile/MobileBottomSheet';
import { useUrlSync } from '../hooks/useUrlSync';

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

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Full-bleed 100vw × 100vh MapLibre GL Interactive Canvas */}
      <div className="absolute inset-0 h-full w-full">
        <DynamicInteractiveMap
          isLayerSelectorOpen={isLayerSelectorOpen}
          onToggleLayerSelector={() => setIsLayerSelectorOpen((prev) => !prev)}
        />
      </div>

      {/* Floating Translucent Top Navigation Islands (Top-Left Search & Top-Right Controls) */}
      <TopNavBar
        isLayerSelectorOpen={isLayerSelectorOpen}
        onToggleLayerSelector={() => setIsLayerSelectorOpen((prev) => !prev)}
      />

      {/* Desktop / Tablet Resizable Sidebar */}
      <ResizableSidebar />

      {/* Mobile Viewport Responsive Bottom Sheet */}
      <MobileBottomSheet />
    </div>
  );
}
