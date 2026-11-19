'use client';

import * as React from 'react';
import { useMapStore } from '../../stores/useMapStore';
import { useAuth } from '../../features/auth/useAuth';
import { HeroWelcomeCard } from './HeroWelcomeCard';
import { ActivityStatsGrid } from './ActivityStatsGrid';
import { CuratedLandmarksRow } from './CuratedLandmarksRow';
import { NotificationsPanel } from './NotificationsPanel';
import { QuickActionsRow } from './QuickActionsRow';
import { FeatureRibbonDock } from './FeatureRibbonDock';
import type { PlaceModel } from '@modern-maps/types';

export interface FusionDashboardProps {
  className?: string;
}

export function FusionDashboard({ className = '' }: FusionDashboardProps) {
  const { user, profile } = useAuth();
  const setViewMode = useMapStore((state) => state.setViewMode);
  const setSidebarView = useMapStore((state) => state.setSidebarView);
  const setSidebarOpen = useMapStore((state) => state.setSidebarOpen);
  const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);
  const setSearchQuery = useMapStore((state) => state.setSearchQuery);
  const camera = useMapStore((state) => state.camera);
  const setCamera = useMapStore((state) => state.setCamera);
  const savedPlacesCount = useMapStore((state) => state.savedPlaces.length);

  // User display name from auth or fallback
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Nguyen Bao Duy';

  const handleExploreMap = () => {
    setViewMode('map');
  };

  const handleQuickSearch = () => {
    setViewMode('map');
    setSidebarView('search');
    setSidebarOpen(true);
  };

  const handleSelectLandmark = (place: PlaceModel) => {
    setSelectedPlace(place);
    setViewMode('map');
  };

  const handleDirectionsClick = () => {
    setViewMode('map');
    setSidebarView('directions');
    setSidebarOpen(true);
  };

  const handleAddPlaceClick = () => {
    setViewMode('map');
    setSidebarView('saved');
    setSidebarOpen(true);
  };

  const handleSearchClick = () => {
    setViewMode('map');
    setSidebarView('search');
    setSidebarOpen(true);
  };

  const handleToggle3D = () => {
    const isCurrently3D = camera.pitch > 20;
    setCamera({ pitch: isCurrently3D ? 0 : 60 });
    setViewMode('map');
  };

  const handleSearchSubmit = (q: string) => {
    setSearchQuery(q);
    setViewMode('map');
    setSidebarView('search');
    setSidebarOpen(true);
  };

  const handlePitchChange = (pitch: number) => {
    setCamera({ pitch });
  };

  return (
    <div
      className={`relative h-full w-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 scrollbar-thin ${className}`}
    >
      {/* 1. Hero Welcome Card */}
      <HeroWelcomeCard
        userName={userName}
        onExploreMap={handleExploreMap}
        onQuickSearch={handleQuickSearch}
      />

      {/* 2. 'Your Activity' Stats Grid */}
      <ActivityStatsGrid
        savedCount={Math.max(248, savedPlacesCount)}
        routesCount={56}
        likesCount="1.2K"
        collaboratorsCount={120}
        onOpenSaved={() => {
          setViewMode('map');
          setSidebarView('saved');
          setSidebarOpen(true);
        }}
        onOpenRoutes={handleDirectionsClick}
      />

      {/* 3. Middle Section: Curated Landmarks + Notifications & Quick Actions Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Curated Landmarks Showcase (2 Columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <CuratedLandmarksRow onSelectLandmark={handleSelectLandmark} />

          {/* Quick Actions Row */}
          <QuickActionsRow
            onDirectionsClick={handleDirectionsClick}
            onAddPlaceClick={handleAddPlaceClick}
            onSearchClick={handleSearchClick}
            onToggle3DClick={handleToggle3D}
            is3DActive={camera.pitch > 20}
          />
        </div>

        {/* Notifications Panel (1 Column on large screens) */}
        <div className="lg:col-span-1">
          <NotificationsPanel
            onNotificationClick={(notif) => {
              if (notif.type === 'saved') {
                setViewMode('map');
                setSidebarView('saved');
                setSidebarOpen(true);
              } else {
                handleQuickSearch();
              }
            }}
          />
        </div>
      </div>

      {/* 4. Bottom Liquid Glass Feature Ribbon Dock */}
      <FeatureRibbonDock
        onSearchSubmit={handleSearchSubmit}
        onPitchChange={handlePitchChange}
      />
    </div>
  );
}
