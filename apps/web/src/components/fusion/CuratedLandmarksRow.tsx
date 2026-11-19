'use client';

import * as React from 'react';
import { Star, MapPin, ExternalLink, ChevronRight } from 'lucide-react';
import { GlassCard } from '@modern-maps/ui';
import type { PlaceModel } from '@modern-maps/types';
import { MOCK_PLACES } from '../../data/mockPlaces';

export interface CuratedLandmarksRowProps {
  landmarks?: PlaceModel[];
  onSelectLandmark: (place: PlaceModel) => void;
  className?: string;
}

export function CuratedLandmarksRow({
  landmarks,
  onSelectLandmark,
  className = '',
}: CuratedLandmarksRowProps) {
  // Curate top 5 iconic San Francisco scenic landmarks
  const displayLandmarks =
    landmarks ||
    MOCK_PLACES.filter((p) =>
      ['place-1', 'place-4', 'place-5', 'place-6', 'place-7'].includes(p.id)
    );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Curated Landmarks</span>
            <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-mono font-medium">
              Top Picks
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Hand-picked architectural marvels and scenic viewpoints in the Bay Area
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectLandmark(displayLandmarks[0]!)}
          className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Horizontal Scrollable Row */}
      <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory">
        {displayLandmarks.map((place) => (
          <GlassCard
            key={place.id}
            variant="interactive"
            radius="2xl"
            onClick={() => onSelectLandmark(place)}
            className="group relative flex-shrink-0 w-64 sm:w-72 overflow-hidden snap-start transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            {/* Visual Thumbnail */}
            <div className="relative h-36 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
              {place.photos?.[0] ? (
                <img
                  src={place.photos[0]}
                  alt={place.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
                  <MapPin className="h-8 w-8 opacity-80" />
                </div>
              )}

              {/* Gradient Overlay for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Rating Pill */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md border border-white/20">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{place.rating || 4.8}</span>
              </div>

              {/* Category Badge */}
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-white/80 dark:bg-zinc-900/80 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-md border border-white/30 dark:border-white/10 uppercase tracking-wider">
                {place.category}
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-1.5">
              <div className="flex items-start justify-between gap-1">
                <h3 className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                  {place.name}
                </h3>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {place.description}
              </p>

              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 text-primary shrink-0" />
                <span className="truncate">{place.city || 'San Francisco, CA'}</span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
