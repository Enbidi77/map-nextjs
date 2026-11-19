'use client';

import * as React from 'react';
import { ArrowRight, Compass, Sparkles, MapPin, Zap } from 'lucide-react';
import { GlassButton } from '@modern-maps/ui';

export interface HeroWelcomeCardProps {
  userName?: string;
  onExploreMap: () => void;
  onQuickSearch?: () => void;
  className?: string;
}

export function HeroWelcomeCard({
  userName = 'Nguyen Bao Duy',
  onExploreMap,
  onQuickSearch,
  className = '',
}: HeroWelcomeCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/30 dark:border-white/10 bg-gradient-to-br from-white/75 via-white/50 to-white/20 dark:from-zinc-900/80 dark:via-zinc-900/50 dark:to-zinc-950/30 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_16px_48px_0_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] ${className}`}
    >
      {/* Ambient Scenic Backlighting Spheres */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-12 h-60 w-60 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-400/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-1/4 h-48 w-48 rounded-full bg-gradient-to-tr from-pink-500/15 to-purple-500/10 blur-2xl"
      />

      {/* Decorative Specular Border Reflection */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/30 via-transparent to-transparent opacity-60 dark:from-white/10" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Engine v5.1
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              San Francisco, CA
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 px-3 py-1 text-xs font-mono text-muted-foreground backdrop-blur-md">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              WebGL 2.0 Active
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
                {userName}
              </span>
              !
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Explore dynamic vector maps, search curated landmarks across the globe, and
              orchestrate collaborative geospatial journeys in fluid real-time.
            </p>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={onExploreMap}
            className="group gap-2 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 font-semibold"
          >
            <Compass className="h-5 w-5 transition-transform duration-500 group-hover:rotate-45" />
            <span>Explore Map</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </GlassButton>

          {onQuickSearch && (
            <GlassButton
              variant="default"
              size="lg"
              onClick={onQuickSearch}
              className="gap-2 font-medium"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Search Places</span>
            </GlassButton>
          )}
        </div>
      </div>
    </div>
  );
}
