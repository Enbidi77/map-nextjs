'use client';

import * as React from 'react';
import { ChevronUp } from 'lucide-react';
import { useMapStore } from '../../stores/useMapStore';
import { SidebarContent } from '../sidebar/SidebarContent';
import { useResponsive } from '../../hooks/useMediaQuery';

export function MobileBottomSheet() {
  const { isMobile } = useResponsive();
  const sidebarView = useMapStore((state) => state.sidebarView);
  const selectedPlace = useMapStore((state) => state.selectedPlace);

  const [expanded, setExpanded] = React.useState(false);

  // If a place is selected, auto-expand bottom sheet
  React.useEffect(() => {
    if (selectedPlace) {
      setExpanded(true);
    }
  }, [selectedPlace]);

  if (!isMobile) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-2xl border-t border-border/80 bg-background/95 backdrop-blur-lg shadow-2xl transition-all duration-300 ease-in-out ${
        expanded ? 'h-[68vh]' : 'h-24'
      }`}
    >
      {/* Drag & Header Bar */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex h-7 w-full items-center justify-center cursor-pointer select-none"
        aria-label={expanded ? 'Minimize panel' : 'Expand panel'}
      >
        <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30 transition-colors hover:bg-muted-foreground/50" />
      </button>

      {/* Header Info when collapsed */}
      {!expanded && (
        <div
          onClick={() => setExpanded(true)}
          className="flex flex-1 cursor-pointer items-center justify-between px-4 pb-2 text-xs"
        >
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {sidebarView === 'place' && selectedPlace
                ? selectedPlace.name
                : sidebarView === 'directions'
                ? 'Directions Planner'
                : 'Explore Nearby Places'}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {sidebarView === 'place' && selectedPlace
                ? selectedPlace.address
                : 'Swipe up or tap to view details'}
            </span>
          </div>
          <ChevronUp className="h-4 w-4 text-muted-foreground animate-bounce" />
        </div>
      )}

      {/* Scrollable Content when expanded */}
      {expanded && (
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-1">
          <SidebarContent />
        </div>
      )}
    </div>
  );
}
