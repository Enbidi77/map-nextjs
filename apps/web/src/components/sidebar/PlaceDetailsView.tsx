'use client';

import * as React from 'react';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  Globe,
  Navigation,
  Bookmark,
  Box,
  Compass,
  Copy,
  Check,
} from 'lucide-react';
import { Button, Badge } from '@modern-maps/ui';
import { useMapStore } from '../../stores/useMapStore';

export function PlaceDetailsView() {
  const selectedPlace = useMapStore((state) => state.selectedPlace);
  const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);
  const setSidebarView = useMapStore((state) => state.setSidebarView);
  const isPlaceSaved = useMapStore((state) => state.isPlaceSaved);
  const toggleSavePlace = useMapStore((state) => state.toggleSavePlace);
  const setDestination = useMapStore((state) => state.setDestination);
  const setCamera = useMapStore((state) => state.setCamera);

  const [copied, setCopied] = React.useState(false);

  if (!selectedPlace) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p className="text-sm">No place selected.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 text-xs"
          onClick={() => setSidebarView('search')}
        >
          Return to Search
        </Button>
      </div>
    );
  }

  const isSaved = isPlaceSaved(selectedPlace.id);
  const [lng, lat] = selectedPlace.coordinates;

  const handleDirections = () => {
    setDestination(selectedPlace.coordinates, selectedPlace.name);
    setSidebarView('directions');
  };

  const handle3DView = () => {
    setCamera({
      center: selectedPlace.coordinates,
      zoom: 16.5,
      pitch: 60,
      bearing: 35,
    });
  };

  const handleCopyCoord = async () => {
    try {
      await navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Back button header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedPlace(null);
            setSidebarView('search');
          }}
          className="gap-1.5 -ml-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Results</span>
        </Button>

        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
          {selectedPlace.category.replace('_', ' ')}
        </Badge>
      </div>

      {/* Place Banner Image */}
      {selectedPlace.photos?.[0] && (
        <div className="relative h-44 w-full overflow-hidden rounded-xl border border-border/60 bg-muted shadow-sm">
          <img
            src={selectedPlace.photos[0]}
            alt={selectedPlace.name}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-2.5 left-3 right-3 text-white">
            <span className="text-xs font-medium text-white/80">San Francisco, CA</span>
          </div>
        </div>
      )}

      {/* Main Info */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground leading-snug">
          {selectedPlace.name}
        </h2>

        {/* Ratings & Price */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {selectedPlace.rating && (
            <div className="flex items-center gap-1 font-semibold text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{selectedPlace.rating.toFixed(1)}</span>
            </div>
          )}
          {selectedPlace.reviewCount && (
            <span>({selectedPlace.reviewCount.toLocaleString()} reviews)</span>
          )}
          {selectedPlace.priceLevel && (
            <>
              <span>•</span>
              <span className="font-semibold text-foreground">
                {'$'.repeat(selectedPlace.priceLevel)}
              </span>
            </>
          )}
          {selectedPlace.openingHours?.openNow !== undefined && (
            <>
              <span>•</span>
              <span
                className={
                  selectedPlace.openingHours.openNow
                    ? 'font-medium text-emerald-600 dark:text-emerald-400'
                    : 'font-medium text-destructive'
                }
              >
                {selectedPlace.openingHours.openNow ? 'Open Now' : 'Closed'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleDirections}
          className="gap-1.5 text-xs font-semibold shadow-sm"
        >
          <Navigation className="h-3.5 w-3.5" />
          <span>Directions</span>
        </Button>

        <Button
          variant={isSaved ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => toggleSavePlace(selectedPlace)}
          className="gap-1.5 text-xs"
        >
          <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current text-primary' : ''}`} />
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handle3DView}
          className="gap-1.5 text-xs"
          title="Tilt camera into 3D view"
        >
          <Box className="h-3.5 w-3.5 text-primary" />
          <span>3D View</span>
        </Button>
      </div>

      {/* Description */}
      {selectedPlace.description && (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
          {selectedPlace.description}
        </div>
      )}

      {/* Metadata / Details List */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border/60 bg-card p-3.5 text-xs text-card-foreground shadow-sm">
        {/* Address */}
        <div className="flex items-start gap-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <div className="flex-1 leading-tight">
            <span className="font-medium text-foreground">{selectedPlace.address}</span>
          </div>
        </div>

        {/* Coordinates readout */}
        <div className="flex items-center justify-between border-t border-border/40 pt-2 font-mono text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-primary" />
            <span>
              {lat.toFixed(5)}° N, {Math.abs(lng).toFixed(5)}° W
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCoord}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Opening Hours */}
        {selectedPlace.openingHours?.weekdayDescriptions?.[0] && (
          <div className="flex items-start gap-2.5 border-t border-border/40 pt-2">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div className="flex-1 leading-tight">
              <span className="text-muted-foreground">
                {selectedPlace.openingHours.weekdayDescriptions[0]}
              </span>
            </div>
          </div>
        )}

        {/* Phone */}
        {selectedPlace.phone && (
          <div className="flex items-center gap-2.5 border-t border-border/40 pt-2">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <a
              href={`tel:${selectedPlace.phone}`}
              className="text-primary hover:underline"
            >
              {selectedPlace.phone}
            </a>
          </div>
        )}

        {/* Website */}
        {selectedPlace.website && (
          <div className="flex items-center gap-2.5 border-t border-border/40 pt-2">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <a
              href={selectedPlace.website}
              target="_blank"
              rel="noreferrer"
              className="truncate text-primary hover:underline"
            >
              {selectedPlace.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* Tags */}
      {selectedPlace.tags && selectedPlace.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedPlace.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] font-normal text-muted-foreground"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
