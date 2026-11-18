'use client';

import { useEffect, useRef } from 'react';
import { useMapStore } from '../stores/useMapStore';

/**
 * Two-way URL synchronization hook for map camera state:
 * ?lat=...&lng=...&z=...&pitch=...&bearing=...
 */
export function useUrlSync() {
  const camera = useMapStore((state) => state.camera);
  const setCamera = useMapStore((state) => state.setCamera);
  const isInitialMount = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial read from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const latStr = searchParams.get('lat');
      const lngStr = searchParams.get('lng');
      const zStr = searchParams.get('z');
      const pitchStr = searchParams.get('pitch');
      const bearingStr = searchParams.get('bearing');

      if (latStr && lngStr) {
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        const zoom = zStr ? parseFloat(zStr) : 12;
        const pitch = pitchStr ? parseFloat(pitchStr) : 0;
        const bearing = bearingStr ? parseFloat(bearingStr) : 0;

        if (
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        ) {
          setCamera({
            center: [lng, lat],
            zoom: !isNaN(zoom) ? zoom : 12,
            pitch: !isNaN(pitch) ? pitch : 0,
            bearing: !isNaN(bearing) ? bearing : 0,
          });
        }
      }
    } catch {
      // Ignore URL parsing errors
    }

    // Handle browser back/forward buttons
    const handlePopState = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const latStr = searchParams.get('lat');
        const lngStr = searchParams.get('lng');
        const zStr = searchParams.get('z');
        const pitchStr = searchParams.get('pitch');
        const bearingStr = searchParams.get('bearing');

        if (latStr && lngStr) {
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          const zoom = zStr ? parseFloat(zStr) : 12;
          const pitch = pitchStr ? parseFloat(pitchStr) : 0;
          const bearing = bearingStr ? parseFloat(bearingStr) : 0;

          if (!isNaN(lat) && !isNaN(lng)) {
            setCamera({
              center: [lng, lat],
              zoom: !isNaN(zoom) ? zoom : 12,
              pitch: !isNaN(pitch) ? pitch : 0,
              bearing: !isNaN(bearing) ? bearing : 0,
            });
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setCamera]);

  // 2. Write camera state to URL with debouncing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const [lng, lat] = camera.center;
      const url = new URL(window.location.href);

      url.searchParams.set('lat', lat.toFixed(5));
      url.searchParams.set('lng', lng.toFixed(5));
      url.searchParams.set('z', camera.zoom.toFixed(2));

      if (camera.pitch > 0) {
        url.searchParams.set('pitch', Math.round(camera.pitch).toString());
      } else {
        url.searchParams.delete('pitch');
      }

      if (camera.bearing !== 0) {
        url.searchParams.set('bearing', Math.round(camera.bearing).toString());
      } else {
        url.searchParams.delete('bearing');
      }

      window.history.replaceState(null, '', url.toString());
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [camera]);
}
