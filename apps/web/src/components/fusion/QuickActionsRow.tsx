'use client';

import * as React from 'react';
import { Navigation, Plus, Search, Box, Share2 } from 'lucide-react';
import { QuickActionButton } from '@modern-maps/ui';

export interface QuickActionsRowProps {
  onDirectionsClick?: () => void;
  onAddPlaceClick?: () => void;
  onSearchClick?: () => void;
  onToggle3DClick?: () => void;
  onShareClick?: () => void;
  is3DActive?: boolean;
  className?: string;
}

export function QuickActionsRow({
  onDirectionsClick,
  onAddPlaceClick,
  onSearchClick,
  onToggle3DClick,
  onShareClick,
  is3DActive = false,
  className = '',
}: QuickActionsRowProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </h3>
        <span className="text-[11px] text-muted-foreground font-mono">Fast Shortcuts</span>
      </div>

      <div className="flex items-center justify-around sm:justify-start sm:gap-6 py-2 overflow-x-auto scrollbar-none">
        {/* Directions */}
        <QuickActionButton
          icon={<Navigation className="h-5 w-5" />}
          label="Directions"
          color="blue"
          onClick={onDirectionsClick}
        />

        {/* Add / Save Place */}
        <QuickActionButton
          icon={<Plus className="h-5 w-5" />}
          label="Add Place"
          color="emerald"
          onClick={onAddPlaceClick}
        />

        {/* Search */}
        <QuickActionButton
          icon={<Search className="h-5 w-5" />}
          label="Search"
          color="cyan"
          onClick={onSearchClick}
        />

        {/* 3D View */}
        <QuickActionButton
          icon={<Box className="h-5 w-5" />}
          label="3D View"
          color="pink"
          active={is3DActive}
          onClick={onToggle3DClick}
        />

        {/* Share */}
        {onShareClick && (
          <QuickActionButton
            icon={<Share2 className="h-5 w-5" />}
            label="Share Map"
            color="amber"
            onClick={onShareClick}
          />
        )}
      </div>
    </div>
  );
}
