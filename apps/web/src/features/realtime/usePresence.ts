'use client';

import * as React from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../auth/useAuth';

export interface PresenceUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  color: string;
  cursor?: [number, number] | null;
  viewport?: {
    center: [number, number];
    zoom: number;
  } | null;
  lastActive: string;
}

const COLLABORATOR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
];

function getRandomColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index]!;
}

export interface UsePresenceOptions {
  sessionId?: string;
  enabled?: boolean;
}

export function usePresence({
  sessionId = 'global-map-session',
  enabled = true,
}: UsePresenceOptions = {}) {
  const { user, profile } = useAuth();
  const [supabase] = React.useState(() => createClient());
  const [peers, setPeers] = React.useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const channelRef = React.useRef<RealtimeChannel | null>(null);

  // Generate stable client color
  const userColor = React.useMemo(() => {
    const seed = user?.id || 'anon-' + Math.random().toString(36).substring(2, 9);
    return getRandomColor(seed);
  }, [user?.id]);

  const currentUserId = React.useMemo(() => {
    return user?.id || 'anon-' + Math.random().toString(36).substring(2, 9);
  }, [user?.id]);

  const userName = React.useMemo(() => {
    return profile?.full_name || user?.email?.split('@')[0] || 'Guest User';
  }, [profile?.full_name, user?.email]);

  const initialPresence: PresenceUser = React.useMemo(
    () => ({
      id: currentUserId,
      name: userName,
      avatarUrl: profile?.avatar_url,
      color: userColor,
      cursor: null,
      viewport: null,
      lastActive: new Date().toISOString(),
    }),
    [currentUserId, userName, profile?.avatar_url, userColor]
  );

  const presenceStateRef = React.useRef<PresenceUser>(initialPresence);

  React.useEffect(() => {
    presenceStateRef.current = {
      ...presenceStateRef.current,
      id: currentUserId,
      name: userName,
      avatarUrl: profile?.avatar_url,
    };
  }, [currentUserId, userName, profile?.avatar_url]);

  React.useEffect(() => {
    if (!enabled) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
      setPeers([]);
      return;
    }

    const channelName = `realtime:presence:${sessionId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channelRef.current = channel;

    const parsePresences = () => {
      const state = channel.presenceState();
      const peerList: PresenceUser[] = [];

      for (const [key, presences] of Object.entries(state)) {
        if (key === currentUserId) continue;
        if (Array.isArray(presences) && presences.length > 0) {
          const latest = presences[presences.length - 1] as unknown as PresenceUser;
          if (latest) {
            peerList.push(latest);
          }
        }
      }

      setPeers(peerList);
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        parsePresences();
      })
      .on('presence', { event: 'join' }, () => {
        parsePresences();
      })
      .on('presence', { event: 'leave' }, () => {
        parsePresences();
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        await channel.track(presenceStateRef.current);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setIsConnected(false);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
      setPeers([]);
    };
  }, [sessionId, enabled, supabase, currentUserId]);

  const updateCursor = React.useCallback(
    async (cursor: [number, number]) => {
      presenceStateRef.current = {
        ...presenceStateRef.current,
        cursor,
        lastActive: new Date().toISOString(),
      };
      if (channelRef.current && isConnected) {
        await channelRef.current.track(presenceStateRef.current);
      }
    },
    [isConnected]
  );

  const updateViewport = React.useCallback(
    async (center: [number, number], zoom: number) => {
      presenceStateRef.current = {
        ...presenceStateRef.current,
        viewport: { center, zoom },
        lastActive: new Date().toISOString(),
      };
      if (channelRef.current && isConnected) {
        await channelRef.current.track(presenceStateRef.current);
      }
    },
    [isConnected]
  );

  return {
    peers,
    peerCount: peers.length,
    isConnected,
    myPresence: presenceStateRef.current,
    updateCursor,
    updateViewport,
  };
}
