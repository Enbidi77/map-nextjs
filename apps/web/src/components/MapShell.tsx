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
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Top Navigation Bar */}
      <TopNavBar
        isLayerSelectorOpen={isLayerSelectorOpen}
        onToggleLayerSelector={() => setIsLayerSelectorOpen((prev) => !prev)}
      />

      {/* Main Workspace: Resizable Sidebar + Map Canvas */}
      <main className="relative flex flex-1 h-[calc(100vh-3.5rem)] mt-14 w-full overflow-hidden">
        {/* Desktop / Tablet Resizable Sidebar */}
        <ResizableSidebar />

        {/* MapLibre GL Interactive Canvas & Controls */}
        <DynamicInteractiveMap
          isLayerSelectorOpen={isLayerSelectorOpen}
          onToggleLayerSelector={() => setIsLayerSelectorOpen((prev) => !prev)}
        />

        {/* Mobile Viewport Responsive Bottom Sheet */}
        <MobileBottomSheet />
      </main>
    </div>
  );
}
