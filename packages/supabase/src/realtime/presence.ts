import type { RealtimeChannel } from '@supabase/supabase-js';
import type { TypedSupabaseClient } from '../client/client.js';
import type { UserPresenceState } from '../types/domain.types.js';

export interface PresenceCallbacks {
  onSync?: (users: UserPresenceState[]) => void;
  onJoin?: (key: string, user: UserPresenceState) => void;
  onLeave?: (key: string, user: UserPresenceState) => void;
}

/**
 * Handles multiplayer presence tracking on a map session channel.
 */
export class PresenceManager {
  private channel: RealtimeChannel;
  private currentUserState: UserPresenceState | null = null;
  private callbacks: PresenceCallbacks;

  constructor(
    client: TypedSupabaseClient,
    roomId: string,
    callbacks: PresenceCallbacks = {}
  ) {
    this.callbacks = callbacks;
    this.channel = client.channel(`presence:map:${roomId}`, {
      config: {
        presence: {
          key: '',
        },
      },
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel.presenceState<UserPresenceState>();
      const users: UserPresenceState[] = [];
      for (const key of Object.keys(state)) {
        const presences = state[key];
        if (presences && presences.length > 0) {
          users.push(presences[0] as UserPresenceState);
        }
      }
      if (this.callbacks.onSync) {
        this.callbacks.onSync(users);
      }
    });

    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: any[] }) => {
      if (this.callbacks.onJoin && newPresences && newPresences.length > 0) {
        this.callbacks.onJoin(key, newPresences[0] as UserPresenceState);
      }
    });

    this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: any[] }) => {
      if (this.callbacks.onLeave && leftPresences && leftPresences.length > 0) {
        this.callbacks.onLeave(key, leftPresences[0] as UserPresenceState);
      }
    });
  }

  /**
   * Subscribes to the channel and tracks current user's initial presence.
   */
  async join(initialState: UserPresenceState): Promise<void> {
    this.currentUserState = {
      ...initialState,
      lastSeen: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      this.channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          if (this.currentUserState) {
            await this.channel.track(this.currentUserState);
          }
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(new Error(`Failed to join presence channel: status=${status}`));
        }
      });
    });
  }

  /**
   * Updates current user's presence state (e.g. mouse cursor, viewport center, tool).
   */
  async updatePresence(partial: Partial<UserPresenceState>): Promise<void> {
    if (!this.currentUserState) return;

    this.currentUserState = {
      ...this.currentUserState,
      ...partial,
      lastSeen: new Date().toISOString(),
    };

    await this.channel.track(this.currentUserState);
  }

  /**
   * Leaves presence tracking and unsubscribes from the channel.
   */
  async leave(): Promise<void> {
    await this.channel.untrack();
    await this.channel.unsubscribe();
    this.currentUserState = null;
  }

  /**
   * Returns current active users in the presence state.
   */
  getPresentUsers(): UserPresenceState[] {
    const state = this.channel.presenceState<UserPresenceState>();
    const users: UserPresenceState[] = [];
    for (const key of Object.keys(state)) {
      const presences = state[key];
      if (presences && presences.length > 0) {
        users.push(presences[0] as UserPresenceState);
      }
    }
    return users;
  }
}
