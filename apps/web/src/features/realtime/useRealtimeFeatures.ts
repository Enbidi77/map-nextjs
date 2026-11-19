'use client';

import * as React from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../auth/useAuth';

export interface MapFeaturePayload {
  id: string;
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: {
    name?: string;
    description?: string;
    color?: string;
    category?: string;
    createdBy?: string;
    updatedAt?: string;
    [key: string]: any;
  };
}

export type RealtimeFeatureAction = 'created' | 'updated' | 'deleted';

export interface UseRealtimeFeaturesOptions {
  sessionId?: string;
  enabled?: boolean;
  onFeatureAdded?: (feature: MapFeaturePayload) => void;
  onFeatureUpdated?: (feature: MapFeaturePayload) => void;
  onFeatureDeleted?: (featureId: string) => void;
}

export function useRealtimeFeatures({
  sessionId = 'global-map-session',
  enabled = true,
  onFeatureAdded,
  onFeatureUpdated,
  onFeatureDeleted,
}: UseRealtimeFeaturesOptions = {}) {
  const { user, profile } = useAuth();
  const [supabase] = React.useState(() => createClient());
  const [features, setFeatures] = React.useState<MapFeaturePayload[]>([]);
  const [status, setStatus] = React.useState<'disconnected' | 'connecting' | 'connected' | 'error'>(
    'disconnected'
  );
  const channelRef = React.useRef<RealtimeChannel | null>(null);

  // Callbacks ref to avoid recreating channels on callback updates
  const callbacksRef = React.useRef({
    onFeatureAdded,
    onFeatureUpdated,
    onFeatureDeleted,
  });

  React.useEffect(() => {
    callbacksRef.current = {
      onFeatureAdded,
      onFeatureUpdated,
      onFeatureDeleted,
    };
  }, [onFeatureAdded, onFeatureUpdated, onFeatureDeleted]);

  React.useEffect(() => {
    if (!enabled) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');
    const channelName = `realtime:features:${sessionId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true },
      },
    });

    channelRef.current = channel;

    // Listen to broadcast events from peers
    channel
      .on(
        'broadcast',
        { event: 'feature:created' },
        ({ payload }: { payload: { feature: MapFeaturePayload; senderId: string } }) => {
          if (payload.senderId === user?.id) return;
          setFeatures((prev) => {
            const exists = prev.some((f) => f.id === payload.feature.id);
            if (exists) return prev;
            return [...prev, payload.feature];
          });
          callbacksRef.current.onFeatureAdded?.(payload.feature);
        }
      )
      .on(
        'broadcast',
        { event: 'feature:updated' },
        ({ payload }: { payload: { feature: MapFeaturePayload; senderId: string } }) => {
          if (payload.senderId === user?.id) return;
          setFeatures((prev) =>
            prev.map((f) => (f.id === payload.feature.id ? payload.feature : f))
          );
          callbacksRef.current.onFeatureUpdated?.(payload.feature);
        }
      )
      .on(
        'broadcast',
        { event: 'feature:deleted' },
        ({ payload }: { payload: { featureId: string; senderId: string } }) => {
          if (payload.senderId === user?.id) return;
          setFeatures((prev) => prev.filter((f) => f.id !== payload.featureId));
          callbacksRef.current.onFeatureDeleted?.(payload.featureId);
        }
      );

    // Also listen to database postgres_changes for user_map_features if available
    try {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_map_features',
        },
        (change) => {
          if (change.eventType === 'INSERT' && change.new) {
            const newRecord = change.new as any;
            const converted: MapFeaturePayload = {
              id: newRecord.id,
              type: 'Feature',
              geometry: newRecord.geometry || { type: 'Point', coordinates: [0, 0] },
              properties: {
                name: newRecord.name,
                description: newRecord.description,
                color: newRecord.color,
                category: newRecord.category,
                createdBy: newRecord.user_id,
                updatedAt: newRecord.updated_at,
                ...newRecord.properties,
              },
            };
            setFeatures((prev) => {
              if (prev.some((f) => f.id === converted.id)) return prev;
              return [...prev, converted];
            });
            callbacksRef.current.onFeatureAdded?.(converted);
          } else if (change.eventType === 'UPDATE' && change.new) {
            const updatedRecord = change.new as any;
            const converted: MapFeaturePayload = {
              id: updatedRecord.id,
              type: 'Feature',
              geometry: updatedRecord.geometry || { type: 'Point', coordinates: [0, 0] },
              properties: {
                name: updatedRecord.name,
                description: updatedRecord.description,
                color: updatedRecord.color,
                category: updatedRecord.category,
                createdBy: updatedRecord.user_id,
                updatedAt: updatedRecord.updated_at,
                ...updatedRecord.properties,
              },
            };
            setFeatures((prev) =>
              prev.map((f) => (f.id === converted.id ? converted : f))
            );
            callbacksRef.current.onFeatureUpdated?.(converted);
          } else if (change.eventType === 'DELETE' && change.old) {
            const deletedId = (change.old as any).id;
            setFeatures((prev) => prev.filter((f) => f.id !== deletedId));
            callbacksRef.current.onFeatureDeleted?.(deletedId);
          }
        }
      );
    } catch {
      // postgres_changes might not be enabled or table not present in mock mode
    }

    channel.subscribe((statusResult) => {
      if (statusResult === 'SUBSCRIBED') {
        setStatus('connected');
      } else if (statusResult === 'CHANNEL_ERROR') {
        setStatus('error');
      } else if (statusResult === 'CLOSED' || statusResult === 'TIMED_OUT') {
        setStatus('disconnected');
      }
    });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setStatus('disconnected');
    };
  }, [sessionId, enabled, supabase, user?.id]);

  /**
   * Broadcasts a created, updated, or deleted feature to collaborators.
   */
  const broadcastFeature = React.useCallback(
    async (action: RealtimeFeatureAction, feature: MapFeaturePayload) => {
      if (!channelRef.current || status !== 'connected') {
        return;
      }

      const senderId = user?.id || 'anonymous';
      const eventName =
        action === 'created'
          ? 'feature:created'
          : action === 'updated'
            ? 'feature:updated'
            : 'feature:deleted';

      const payload =
        action === 'deleted'
          ? { featureId: feature.id, senderId }
          : {
              feature: {
                ...feature,
                properties: {
                  ...feature.properties,
                  createdBy: profile?.full_name || user?.email || 'Anonymous',
                  updatedAt: new Date().toISOString(),
                },
              },
              senderId,
            };

      // Optimistically update local state
      if (action === 'created') {
        setFeatures((prev) => {
          if (prev.some((f) => f.id === feature.id)) return prev;
          return [...prev, feature];
        });
      } else if (action === 'updated') {
        setFeatures((prev) => prev.map((f) => (f.id === feature.id ? feature : f)));
      } else if (action === 'deleted') {
        setFeatures((prev) => prev.filter((f) => f.id !== feature.id));
      }

      await channelRef.current.send({
        type: 'broadcast',
        event: eventName,
        payload,
      });
    },
    [status, user?.id, profile?.full_name, user?.email]
  );

  return {
    features,
    status,
    isConnected: status === 'connected',
    broadcastFeature,
    clearFeatures: () => setFeatures([]),
  };
}
