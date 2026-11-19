'use client';

import * as React from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../auth/useAuth';

export interface LocationPayload {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  expiresAt: number;
}

export interface UseLiveLocationOptions {
  shareId?: string;
  defaultDurationMinutes?: number;
}

export function useLiveLocation({
  shareId = 'default-share-group',
  defaultDurationMinutes = 15,
}: UseLiveLocationOptions = {}) {
  const { user, profile } = useAuth();
  const [supabase] = React.useState(() => createClient());

  const [isSharing, setIsSharing] = React.useState(false);
  const [hasExpired, setHasExpired] = React.useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = React.useState(0);
  const [expiresAtTimestamp, setExpiresAtTimestamp] = React.useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = React.useState<LocationPayload | null>(null);
  const [peerLocations, setPeerLocations] = React.useState<LocationPayload[]>([]);
  const [permissionStatus, setPermissionStatus] = React.useState<
    'prompt' | 'granted' | 'denied' | 'unsupported'
  >('prompt');
  const [error, setError] = React.useState<string | null>(null);

  const watchIdRef = React.useRef<number | null>(null);
  const channelRef = React.useRef<RealtimeChannel | null>(null);

  // Check initial permission status if available
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setPermissionStatus('unsupported');
      return;
    }

    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionStatus(result.state);
          result.onchange = () => {
            setPermissionStatus(result.state);
          };
        })
        .catch(() => {
          // Permissions API might not support geolocation in some browsers
        });
    }
  }, []);

  // Supabase Realtime channel setup for receiving peer locations
  React.useEffect(() => {
    const channelName = `realtime:location:${shareId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false },
      },
    });

    channelRef.current = channel;

    channel
      .on(
        'broadcast',
        { event: 'location:update' },
        ({ payload }: { payload: LocationPayload }) => {
          if (payload.userId === user?.id) return;
          // Check if peer location is still valid and not expired
          if (payload.expiresAt && Date.now() > payload.expiresAt) return;

          setPeerLocations((prev) => {
            const next = prev.filter((p) => p.userId !== payload.userId);
            return [...next, payload];
          });
        }
      )
      .on(
        'broadcast',
        { event: 'location:stopped' },
        ({ payload }: { payload: { userId: string } }) => {
          setPeerLocations((prev) => prev.filter((p) => p.userId !== payload.userId));
        }
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [shareId, supabase, user?.id]);

  // Countdown timer for expiration
  React.useEffect(() => {
    if (!isSharing || !expiresAtTimestamp) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAtTimestamp - Date.now()) / 1000));
      setTimeRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Expiration reached: stop sharing automatically
        stopSharingInternal(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSharing, expiresAtTimestamp]);

  const stopSharingInternal = React.useCallback(
    (expired = false) => {
      if (watchIdRef.current !== null && typeof window !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (channelRef.current && user?.id) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'location:stopped',
          payload: { userId: user.id },
        });
      }

      setIsSharing(false);
      setHasExpired(expired);
      setExpiresAtTimestamp(null);
      setTimeRemainingSeconds(0);
      setCurrentLocation(null);
    },
    [user?.id]
  );

  const stopSharing = React.useCallback(() => {
    stopSharingInternal(false);
  }, [stopSharingInternal]);

  /**
   * Starts location sharing with explicit duration (defaults to defaultDurationMinutes).
   */
  const startSharing = React.useCallback(
    async (durationMinutes = defaultDurationMinutes) => {
      setError(null);
      setHasExpired(false);

      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        setError('Geolocation is not supported by your browser.');
        setPermissionStatus('unsupported');
        return;
      }

      const expiresAt = Date.now() + durationMinutes * 60 * 1000;
      setExpiresAtTimestamp(expiresAt);
      setTimeRemainingSeconds(durationMinutes * 60);

      const userId = user?.id || 'anon-' + Math.random().toString(36).substring(2, 9);
      const userName = profile?.full_name || user?.email?.split('@')[0] || 'Anonymous';

      const handleSuccess = (position: GeolocationPosition) => {
        setPermissionStatus('granted');
        setIsSharing(true);

        const payload: LocationPayload = {
          userId,
          userName,
          avatarUrl: profile?.avatar_url,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          expiresAt,
        };

        setCurrentLocation(payload);

        // Broadcast to realtime channel
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'location:update',
            payload,
          });
        }
      };

      const handleError = (geoError: GeolocationPositionError) => {
        setIsSharing(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setPermissionStatus('denied');
          setError('Location permission was denied. Please allow access in browser settings.');
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          setError('Location information is currently unavailable.');
        } else if (geoError.code === geoError.TIMEOUT) {
          setError('Location request timed out. Please try again.');
        } else {
          setError(geoError.message || 'Failed to acquire location.');
        }
      };

      try {
        const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        });
        watchIdRef.current = id;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to start geolocation watcher.');
      }
    },
    [defaultDurationMinutes, user?.id, profile?.full_name, profile?.avatar_url, user?.email]
  );

  /**
   * Extends the active location sharing period by additional minutes.
   */
  const extendSharing = React.useCallback(
    (additionalMinutes = 15) => {
      if (!isSharing || !expiresAtTimestamp) return;
      const newExpiresAt = expiresAtTimestamp + additionalMinutes * 60 * 1000;
      setExpiresAtTimestamp(newExpiresAt);
      setTimeRemainingSeconds(Math.max(0, Math.floor((newExpiresAt - Date.now()) / 1000)));
    },
    [isSharing, expiresAtTimestamp]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return {
    isSharing,
    hasExpired,
    timeRemainingSeconds,
    expiresAtTimestamp,
    currentLocation,
    peerLocations,
    permissionStatus,
    error,
    startSharing,
    stopSharing,
    extendSharing,
  };
}
