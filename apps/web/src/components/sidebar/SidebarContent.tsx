'use client';

import * as React from 'react';
import { Search, Navigation, Bookmark } from 'lucide-react';
import { useMapStore, type SidebarView } from '../../stores/useMapStore';
import { useTranslation } from '../../features/i18n';
import { SearchPanel } from './SearchPanel';
import { PlaceDetailsView } from './PlaceDetailsView';
import { DirectionsView } from './DirectionsView';
import { SavedPlacesView } from './SavedPlacesView';

export interface SidebarContentProps {
  hideTabs?: boolean;
}

export function SidebarContent({ hideTabs = false }: SidebarContentProps) {
  const { t } = useTranslation();
  const sidebarView = useMapStore((state) => state.sidebarView);
  const setSidebarView = useMapStore((state) => state.setSidebarView);
  const savedCount = useMapStore((state) => state.savedPlaces.length);

  const TABS: Array<{ id: SidebarView; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'search', label: t('sidebar.explore'), icon: <Search className="h-3.5 w-3.5" /> },
    { id: 'directions', label: t('sidebar.directions'), icon: <Navigation className="h-3.5 w-3.5" /> },
    { id: 'saved', label: t('sidebar.saved'), icon: <Bookmark className="h-3.5 w-3.5" />, badge: savedCount },
  ];

  return (
    <div className="flex flex-col gap-3 w-full min-w-0 max-w-full">
      {/* Top Tab Switcher (omitted when hosted in floating panel sticky header) */}
      {!hideTabs && (
        <div className="flex rounded-lg border border-border/60 bg-muted/40 p-1 w-full min-w-0">
          {TABS.map((tab) => {
            const isActive =
              sidebarView === tab.id || (tab.id === 'search' && sidebarView === 'place');
            return (
              <button
                key={tab.id}
                type="button"
                suppressHydrationWarning
                onClick={() => setSidebarView(tab.id)}
                className={`flex flex-1 min-w-0 items-center justify-center gap-1 sm:gap-1.5 rounded-md py-1.5 px-1 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="shrink-0">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="flex h-3.5 min-w-3.5 shrink-0 items-center justify-center rounded-full bg-primary/20 px-1 font-mono text-[9px] font-bold text-primary">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Dynamic Content Views */}
      {sidebarView === 'search' && <SearchPanel />}
      {sidebarView === 'place' && <PlaceDetailsView />}
      {sidebarView === 'directions' && <DirectionsView />}
      {sidebarView === 'saved' && <SavedPlacesView />}
    </div>
  );
}
