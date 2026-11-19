'use client';

import * as React from 'react';
import {
  Car,
  Footprints,
  Bike,
  Bus,
  ArrowUpDown,
  Navigation,
  MapPin,
  Milestone,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button, Input, ManeuverInstructionCard } from '@modern-maps/ui';
import { useMapStore, type TransitMode } from '../../stores/useMapStore';
import { useTranslation } from '../../features/i18n';
import { MOCK_PLACES } from '../../data/mockPlaces';
import type { PlaceSearchResult, Coordinate } from '@modern-maps/types';

export function DirectionsView() {
  const { t } = useTranslation();
  const directions = useMapStore((state) => state.directions);
  const setOrigin = useMapStore((state) => state.setOrigin);
  const setDestination = useMapStore((state) => state.setDestination);
  const setTransitMode = useMapStore((state) => state.setTransitMode);
  const calculateRoute = useMapStore((state) => state.calculateRoute);
  const swapOriginDestination = useMapStore((state) => state.swapOriginDestination);
  const clearDirections = useMapStore((state) => state.clearDirections);
  const userLocation = useMapStore((state) => state.userLocation);

  const [originInput, setOriginInput] = React.useState(directions.originName || '');
  const [destInput, setDestInput] = React.useState(directions.destinationName || '');

  // Autocomplete state
  const [originSuggestions, setOriginSuggestions] = React.useState<PlaceSearchResult[]>([]);
  const [destSuggestions, setDestSuggestions] = React.useState<PlaceSearchResult[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = React.useState(false);
  const [isSearchingDest, setIsSearchingDest] = React.useState(false);
  const [activeInput, setActiveInput] = React.useState<'origin' | 'dest' | null>(null);
  const [directionError, setDirectionError] = React.useState<string | null>(null);

  // Sync with store
  React.useEffect(() => {
    setOriginInput(directions.originName || '');
  }, [directions.originName]);

  React.useEffect(() => {
    setDestInput(directions.destinationName || '');
  }, [directions.destinationName]);

  // Autocomplete debounced effect for Origin
  React.useEffect(() => {
    if (activeInput !== 'origin' || !originInput.trim() || originInput.length < 2) {
      setOriginSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOrigin(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(originInput.trim())}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setOriginSuggestions(data.results || []);
        }
      } catch {
        setOriginSuggestions([]);
      } finally {
        setIsSearchingOrigin(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [originInput, activeInput]);

  // Autocomplete debounced effect for Destination
  React.useEffect(() => {
    if (activeInput !== 'dest' || !destInput.trim() || destInput.length < 2) {
      setDestSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDest(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(destInput.trim())}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setDestSuggestions(data.results || []);
        }
      } catch {
        setDestSuggestions([]);
      } finally {
        setIsSearchingDest(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [destInput, activeInput]);

  // Resolves a textual query to coordinates via /api/geocode or local matches
  const resolveLocation = async (
    queryText: string
  ): Promise<{ coord: Coordinate; name: string } | null> => {
    const q = queryText.trim();
    if (!q) return null;

    // Check direct coordinates: "lat, lng" or "lng, lat"
    const parts = q.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]!) && !isNaN(parts[1]!)) {
      if (Math.abs(parts[0]!) <= 90 && Math.abs(parts[1]!) <= 180) {
        return { coord: [parts[1]!, parts[0]!], name: q };
      }
      return { coord: [parts[0]!, parts[1]!], name: q };
    }

    // Try live geocode
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const top = data.results[0]!.place;
          return { coord: top.coordinates, name: top.name };
        }
      }
    } catch {
      // ignore
    }

    // Check local fallback places
    const lower = q.toLowerCase();
    const matched = MOCK_PLACES.find(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.address.toLowerCase().includes(lower) ||
        (p.country?.toLowerCase().includes(lower) ?? false) ||
        (p.tags?.some((t) => t.toLowerCase().includes(lower)) ?? false)
    );
    if (matched) {
      return { coord: matched.coordinates, name: matched.name };
    }

    return null;
  };

  const handleUseCurrentLocation = () => {
    const locLabel = t('directions.yourLocation');
    if (userLocation) {
      setOrigin(userLocation, locLabel);
      setOriginInput(locLabel);
    } else {
      const downtownSF: [number, number] = [-122.401, 37.789];
      setOrigin(downtownSF, 'Market St & Powell St');
      setOriginInput('Market St & Powell St');
    }
    setActiveInput(null);
  };

  const handleSelectOriginPlace = (place: { coordinates: Coordinate; name: string }) => {
    setOrigin(place.coordinates, place.name);
    setOriginInput(place.name);
    setOriginSuggestions([]);
    setActiveInput(null);
    setDirectionError(null);
  };

  const handleSelectDestPlace = (place: { coordinates: Coordinate; name: string }) => {
    setDestination(place.coordinates, place.name);
    setDestInput(place.name);
    setDestSuggestions([]);
    setActiveInput(null);
    setDirectionError(null);
  };

  const handleGetDirections = async () => {
    setDirectionError(null);
    let curOrigin = directions.origin;
    let curDest = directions.destination;

    // Resolve Origin if not yet mapped to coordinates
    if (!curOrigin && originInput.trim()) {
      const resolved = await resolveLocation(originInput);
      if (resolved) {
        curOrigin = resolved.coord;
        setOrigin(resolved.coord, resolved.name);
        setOriginInput(resolved.name);
      } else {
        setDirectionError(t('directions.couldNotFind', { location: originInput }));
        return;
      }
    }

    // Resolve Destination if not yet mapped to coordinates
    if (!curDest && destInput.trim()) {
      const resolved = await resolveLocation(destInput);
      if (resolved) {
        curDest = resolved.coord;
        setDestination(resolved.coord, resolved.name);
        setDestInput(resolved.name);
      } else {
        setDirectionError(t('directions.couldNotFindDest', { location: destInput }));
        return;
      }
    }

    if (curOrigin && curDest) {
      setActiveInput(null);
      await calculateRoute();
    }
  };

  const MODES: Array<{ mode: TransitMode; label: string; icon: React.ReactNode }> = [
    { mode: 'driving', label: t('directions.driving'), icon: <Car className="h-4 w-4" /> },
    { mode: 'transit', label: t('directions.transit'), icon: <Bus className="h-4 w-4" /> },
    { mode: 'walking', label: t('directions.walking'), icon: <Footprints className="h-4 w-4" /> },
    { mode: 'cycling', label: t('directions.cycling'), icon: <Bike className="h-4 w-4" /> },
  ];

  const canCalculate =
    (directions.origin || originInput.trim().length > 0) &&
    (directions.destination || destInput.trim().length > 0);

  return (
    <div className="flex flex-col gap-4 py-1 w-full min-w-0 max-w-full">
      {/* Route Inputs Card */}
      <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 text-card-foreground shadow-sm w-full min-w-0">
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 border-b border-border/50 pb-2.5 w-full min-w-0">
          {MODES.map((item) => (
            <button
              key={item.mode}
              type="button"
              onClick={() => {
                setTransitMode(item.mode);
                if (directions.origin && directions.destination) {
                  calculateRoute();
                }
              }}
              className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                directions.mode === item.mode
                  ? 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Origin & Destination Inputs with Swap Button */}
        <div className="relative flex flex-col gap-2.5 pt-1 w-full min-w-0">
          {/* Origin Input with Autocomplete */}
          <div className="relative">
            <div className="flex items-center gap-2 w-full min-w-0">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div className="relative flex-1 min-w-0">
                <Input
                  value={originInput}
                  onFocus={() => setActiveInput('origin')}
                  onChange={(e) => {
                    setOriginInput(e.target.value);
                    setActiveInput('origin');
                    setDirectionError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (originSuggestions.length > 0) {
                        handleSelectOriginPlace(originSuggestions[0]!.place);
                      } else {
                        handleGetDirections();
                      }
                    } else if (e.key === 'Escape') {
                      setActiveInput(null);
                    }
                  }}
                  placeholder={t('directions.originPlaceholder')}
                  className="h-8 pr-7 text-xs font-medium w-full min-w-0"
                />
                {isSearchingOrigin && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Origin Autocomplete Dropdown */}
            {activeInput === 'origin' && originSuggestions.length > 0 && (
              <div className="absolute left-8 right-8 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 shadow-lg backdrop-blur-md">
                {originSuggestions.map(({ place }) => (
                  <button
                    key={place.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectOriginPlace(place)}
                    className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <div className="flex flex-col truncate">
                      <span className="font-semibold text-foreground truncate">{place.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{place.address}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination Input with Autocomplete */}
          <div className="relative">
            <div className="flex items-center gap-2 w-full min-w-0">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <div className="relative flex-1 min-w-0">
                <Input
                  value={destInput}
                  onFocus={() => setActiveInput('dest')}
                  onChange={(e) => {
                    setDestInput(e.target.value);
                    setActiveInput('dest');
                    setDirectionError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (destSuggestions.length > 0) {
                        handleSelectDestPlace(destSuggestions[0]!.place);
                      } else {
                        handleGetDirections();
                      }
                    } else if (e.key === 'Escape') {
                      setActiveInput(null);
                    }
                  }}
                  placeholder={t('directions.destPlaceholder')}
                  className="h-8 pr-7 text-xs font-medium w-full min-w-0"
                />
                {isSearchingDest && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Destination Autocomplete Dropdown */}
            {activeInput === 'dest' && destSuggestions.length > 0 && (
              <div className="absolute left-8 right-8 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 shadow-lg backdrop-blur-md">
                {destSuggestions.map(({ place }) => (
                  <button
                    key={place.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectDestPlace(place)}
                    className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    <div className="flex flex-col truncate">
                      <span className="font-semibold text-foreground truncate">{place.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{place.address}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button on side */}
          <button
            type="button"
            onClick={() => {
              swapOriginDestination();
              const tmp = originInput;
              setOriginInput(destInput);
              setDestInput(tmp);
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground active:scale-95 transition-all"
            title={t('directions.swap')}
            aria-label={t('directions.swap')}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Error notification if place could not be resolved */}
        {directionError && (
          <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{directionError}</span>
          </div>
        )}

        {/* Quick Origin Suggestions */}
        {!directions.origin && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Navigation className="h-3 w-3 text-primary" />
              <span>{t('directions.useCurrentLocation')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectOriginPlace(MOCK_PLACES[0]!)}
              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span>Việt Nam</span>
            </button>
          </div>
        )}

        {/* Quick Destination Suggestions */}
        {!directions.destination && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-muted-foreground self-center">{t('directions.popular')}</span>
            {MOCK_PLACES.slice(0, 3).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectDestPlace(p)}
                className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Calculate / Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50 w-full min-w-0">
          <Button
            variant="default"
            size="sm"
            onClick={handleGetDirections}
            disabled={!canCalculate || directions.isLoading}
            className="flex-1 min-w-0 gap-1.5 text-xs font-semibold px-2.5 truncate"
          >
            {directions.isLoading ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <Navigation className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{directions.isLoading ? t('directions.calculating') : t('directions.getDirections')}</span>
          </Button>

          {directions.isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearDirections}
              className="shrink-0 gap-1 text-xs text-muted-foreground hover:text-destructive px-2.5"
              aria-label={t('directions.clear')}
            >
              <X className="h-3.5 w-3.5" />
              <span>{t('directions.clear')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Calculated Route Details */}
      {Boolean(
        directions.isActive &&
          typeof directions.distanceMeters === 'number' &&
          !isNaN(directions.distanceMeters) &&
          typeof directions.durationSeconds === 'number' &&
          !isNaN(directions.durationSeconds)
      ) && (
        <div className="flex flex-col gap-3 w-full min-w-0">
          {/* Summary Card */}
          <div className="flex items-center justify-between gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-3.5 w-full min-w-0">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-lg sm:text-xl font-bold text-primary truncate">
                {Math.floor((directions.durationSeconds ?? 0) / 3600) > 0
                  ? t('directions.hoursMinutes', {
                      hours: Math.floor((directions.durationSeconds ?? 0) / 3600),
                      minutes: Math.round(((directions.durationSeconds ?? 0) % 3600) / 60),
                    })
                  : t('directions.minutes', {
                      minutes: Math.max(1, Math.round((directions.durationSeconds ?? 0) / 60)),
                    })}
              </span>
              <span
                className="text-xs text-muted-foreground truncate"
                title={t('directions.fastestRoute', {
                  distance: `${(((directions.distanceMeters ?? 0) / 1000)).toFixed(1)} km`,
                })}
              >
                {t('directions.fastestRoute', {
                  distance: `${(((directions.distanceMeters ?? 0) / 1000)).toFixed(1)} km`,
                })}
              </span>
            </div>
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              {MODES.find((m) => m.mode === directions.mode)?.icon}
            </div>
          </div>

          {/* Turn by turn steps with ManeuverInstructionCard */}
          <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-sm w-full min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pb-1 border-b border-border/50 w-full min-w-0">
              <Milestone className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{t('directions.turnByTurn')}</span>
            </div>

            <div className="flex flex-col gap-2 pt-1 w-full min-w-0">
              {directions.steps.map((step, idx) => (
                <ManeuverInstructionCard
                  key={idx}
                  compact={true}
                  instruction={step.instruction}
                  distance={step.distanceMeters}
                  duration={step.durationSeconds}
                  stepNumber={idx + 1}
                  totalSteps={directions.steps.length}
                  isCurrent={idx === 0}
                  type={step.type}
                  modifier={step.modifier}
                  streetName={step.streetName}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
