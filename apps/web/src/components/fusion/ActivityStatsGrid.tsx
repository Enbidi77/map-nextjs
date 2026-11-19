'use client';

import * as React from 'react';
import { Bookmark, Navigation, Heart, Users } from 'lucide-react';
import { ActivityStatCard } from '@modern-maps/ui';

export interface ActivityStatsGridProps {
  savedCount?: number;
  routesCount?: number;
  likesCount?: string | number;
  collaboratorsCount?: number;
  onOpenSaved?: () => void;
  onOpenRoutes?: () => void;
  onOpenCollaborators?: () => void;
  className?: string;
}

export function ActivityStatsGrid({
  savedCount = 248,
  routesCount = 56,
  likesCount = '1.2K',
  collaboratorsCount = 120,
  onOpenSaved,
  onOpenRoutes,
  onOpenCollaborators,
  className = '',
}: ActivityStatsGridProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      {/* 1. Saved Places */}
      <ActivityStatCard
        label="Saved Places"
        value={savedCount}
        color="emerald"
        icon={<Bookmark className="h-5 w-5" />}
        trend={{ value: '14%', isPositive: true, label: 'mo' }}
        subtitle="San Francisco & Bay Area"
        interactive={Boolean(onOpenSaved)}
        onClick={onOpenSaved}
      />

      {/* 2. Routes */}
      <ActivityStatCard
        label="Routes"
        value={routesCount}
        color="blue"
        icon={<Navigation className="h-5 w-5" />}
        trend={{ value: '8 active', isPositive: true }}
        subtitle="184 km charted this week"
        interactive={Boolean(onOpenRoutes)}
        onClick={onOpenRoutes}
      />

      {/* 3. Likes */}
      <ActivityStatCard
        label="Likes & Upvotes"
        value={likesCount}
        color="pink"
        icon={<Heart className="h-5 w-5" />}
        trend={{ value: '+84', isPositive: true, label: 'wk' }}
        subtitle="Top landmark contributions"
        interactive
      />

      {/* 4. Collaborators */}
      <ActivityStatCard
        label="Collaborators"
        value={collaboratorsCount}
        color="cyan"
        icon={<Users className="h-5 w-5" />}
        trend={{ value: '+12 new', isPositive: true }}
        subtitle="Active team workspaces"
        interactive={Boolean(onOpenCollaborators)}
        onClick={onOpenCollaborators}
      />
    </div>
  );
}
