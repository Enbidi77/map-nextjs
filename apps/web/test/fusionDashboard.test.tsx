import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { HeroWelcomeCard } from '../src/components/fusion/HeroWelcomeCard';
import { ActivityStatsGrid } from '../src/components/fusion/ActivityStatsGrid';
import { CuratedLandmarksRow } from '../src/components/fusion/CuratedLandmarksRow';
import { NotificationsPanel } from '../src/components/fusion/NotificationsPanel';
import { QuickActionsRow } from '../src/components/fusion/QuickActionsRow';
import { FeatureRibbonDock } from '../src/components/fusion/FeatureRibbonDock';
import { FusionDashboard } from '../src/components/fusion/FusionDashboard';
import { useMapStore } from '../src/stores/useMapStore';

describe('Fusion UI - Dashboard Components', () => {
  describe('HeroWelcomeCard', () => {
    it('renders greeting with custom user name', () => {
      const html = renderToString(
        <HeroWelcomeCard
          userName="Nguyen Bao Duy"
          onExploreMap={vi.fn()}
        />
      );
      expect(html).toContain('Welcome back');
      expect(html).toContain('Nguyen Bao Duy');
      expect(html).toContain('Explore Map');
      expect(html).toContain('Live Engine v5.1');
    });

    it('renders secondary quick search CTA when provided', () => {
      const html = renderToString(
        <HeroWelcomeCard
          userName="Alex Rivera"
          onExploreMap={vi.fn()}
          onQuickSearch={vi.fn()}
        />
      );
      expect(html).toContain('Alex Rivera');
      expect(html).toContain('Search Places');
    });
  });

  describe('ActivityStatsGrid', () => {
    it('renders 4 activity stat cards with required metrics', () => {
      const html = renderToString(
        <ActivityStatsGrid
          savedCount={248}
          routesCount={56}
          likesCount="1.2K"
          collaboratorsCount={120}
        />
      );
      expect(html).toContain('Saved Places');
      expect(html).toContain('248');
      expect(html).toContain('Routes');
      expect(html).toContain('56');
      expect(html).toContain('Likes &amp; Upvotes');
      expect(html).toContain('1.2K');
      expect(html).toContain('Collaborators');
      expect(html).toContain('120');
    });
  });

  describe('CuratedLandmarksRow', () => {
    it('renders curated landmark previews and details', () => {
      const html = renderToString(
        <CuratedLandmarksRow onSelectLandmark={vi.fn()} />
      );
      expect(html).toContain('Curated Landmarks');
      expect(html).toContain('Golden Gate Bridge');
      expect(html).toContain('Palace of Fine Arts');
      expect(html).toContain('Twin Peaks');
      expect(html).toContain('Ferry Building Marketplace');
      expect(html).toContain('Lombard Street');
    });
  });

  describe('NotificationsPanel', () => {
    it('renders updates with timestamps and unread counters', () => {
      const html = renderToString(<NotificationsPanel />);
      expect(html).toContain('Notifications');
      expect(html).toContain('Embarcadero Route');
      expect(html).toContain('New collaborative waypoint');
      expect(html).toContain('Traffic &amp; Transit Advisory');
      expect(html).toContain('5m ago');
    });
  });

  describe('QuickActionsRow', () => {
    it('renders quick action buttons with labels', () => {
      const html = renderToString(
        <QuickActionsRow
          onDirectionsClick={vi.fn()}
          onAddPlaceClick={vi.fn()}
          onSearchClick={vi.fn()}
          onToggle3DClick={vi.fn()}
          is3DActive={false}
        />
      );
      expect(html).toContain('Directions');
      expect(html).toContain('Add Place');
      expect(html).toContain('Search');
      expect(html).toContain('3D View');
    });
  });

  describe('FeatureRibbonDock', () => {
    it('renders 5 liquid glass feature cards', () => {
      const html = renderToString(<FeatureRibbonDock />);
      expect(html).toContain('Liquid Glass');
      expect(html).toContain('Smart &amp; Helpful');
      expect(html).toContain('Fluid Motion');
      expect(html).toContain('Adaptive');
      expect(html).toContain('Expressive');
    });
  });

  describe('useMapStore viewMode & nav pills integration', () => {
    it('initializes with dashboard viewMode', () => {
      expect(useMapStore.getState().viewMode).toBe('dashboard');
    });

    it('toggles viewMode between dashboard and map', () => {
      useMapStore.getState().setViewMode('map');
      expect(useMapStore.getState().viewMode).toBe('map');

      useMapStore.getState().toggleViewMode();
      expect(useMapStore.getState().viewMode).toBe('dashboard');

      useMapStore.getState().toggleViewMode();
      expect(useMapStore.getState().viewMode).toBe('map');
    });

    it('updates active navigation pill', () => {
      useMapStore.getState().setActiveNavPill('directions');
      expect(useMapStore.getState().activeNavPill).toBe('directions');

      useMapStore.getState().setActiveNavPill('saved');
      expect(useMapStore.getState().activeNavPill).toBe('saved');
    });
  });

  describe('FusionDashboard full view', () => {
    it('renders without errors', () => {
      const html = renderToString(<FusionDashboard />);
      expect(html).toContain('Welcome back');
      expect(html).toContain('Saved Places');
      expect(html).toContain('Curated Landmarks');
      expect(html).toContain('Quick Actions');
      expect(html).toContain('Notifications');
      expect(html).toContain('Fusion Design System');
    });
  });
});
