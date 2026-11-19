import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Coordinate, GeoJSONGeometry } from '@modern-maps/types';
import type { TypedSupabaseClient } from '../client/client.js';
import type { UserMapFeature } from '../types/domain.types.js';

export interface FeatureSyncCallbacks {
  onFeatureCreated?: (feature: UserMapFeature) => void;
  onFeatureUpdated?: (feature: UserMapFeature) => void;
  onFeatureDeleted?: (featureId: string) => void;
  onDraftGeometry?: (payload: { userId: string; geometry: GeoJSONGeometry }) => void;
  onPeerCursor?: (payload: { userId: string; cursor: Coordinate }) => void;
}

export class FeatureSyncManager {
  private channel: RealtimeChannel;
  private client: TypedSupabaseClient;
  private callbacks: FeatureSyncCallbacks;
  private userId: string;

  constructor(
    client: TypedSupabaseClient,
    sessionId: string,
    userId: string,
    callbacks: FeatureSyncCallbacks = {}
  ) {
    this.client = client;
    this.userId = userId;
    this.callbacks = callbacks;

    this.channel = this.client.channel(`features:session:${sessionId}`, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    this.setupListeners();
  }

  private setupListeners() {
    // 1. Database changes on user_map_features
    this.channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_map_features',
      },
      (payload: any) => {
        if (payload.eventType === 'INSERT' && this.callbacks.onFeatureCreated) {
          this.callbacks.onFeatureCreated({
            id: payload.new.id,
            userId: payload.new.user_id,
            name: payload.new.name,
            featureType: payload.new.feature_type,
            geojson: payload.new.geojson,
            properties: payload.new.properties || {},
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at,
          });
        } else if (payload.eventType === 'UPDATE' && this.callbacks.onFeatureUpdated) {
          this.callbacks.onFeatureUpdated({
            id: payload.new.id,
            userId: payload.new.user_id,
            name: payload.new.name,
            featureType: payload.new.feature_type,
            geojson: payload.new.geojson,
            properties: payload.new.properties || {},
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at,
          });
        } else if (payload.eventType === 'DELETE' && this.callbacks.onFeatureDeleted) {
          this.callbacks.onFeatureDeleted(payload.old.id);
        }
      }
    );

    // 2. Broadcast transient draft geometry (drawing in progress)
    this.channel.on(
      'broadcast',
      { event: 'draft_geometry' },
      ({ payload }: any) => {
        if (payload.userId !== this.userId && this.callbacks.onDraftGeometry) {
          this.callbacks.onDraftGeometry(payload);
        }
      }
    );

    // 3. Broadcast peer cursor movements
    this.channel.on(
      'broadcast',
      { event: 'peer_cursor' },
      ({ payload }: any) => {
        if (payload.userId !== this.userId && this.callbacks.onPeerCursor) {
          this.callbacks.onPeerCursor(payload);
        }
      }
    );
  }

  async subscribe(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(new Error(`Failed to subscribe to FeatureSync: ${status}`));
        }
      });
    });
  }

  /**
   * Broadcasts drawing-in-progress draft geometry to all peer collaborators.
   */
  async sendDraftGeometry(geometry: GeoJSONGeometry): Promise<void> {
    await this.channel.send({
      type: 'broadcast',
      event: 'draft_geometry',
      payload: {
        userId: this.userId,
        geometry,
      },
    });
  }

  /**
   * Broadcasts peer cursor coordinates.
   */
  async sendPeerCursor(cursor: Coordinate): Promise<void> {
    await this.channel.send({
      type: 'broadcast',
      event: 'peer_cursor',
      payload: {
        userId: this.userId,
        cursor,
      },
    });
  }

  async unsubscribe(): Promise<void> {
    await this.channel.unsubscribe();
  }

  /**
   * Helper utility for optimistic updates on a local array of features.
   */
  static applyOptimisticUpdate<T extends { id: string }>(
    currentList: T[],
    item: T,
    action: 'add' | 'update' | 'delete'
  ): T[] {
    switch (action) {
      case 'add':
        return [item, ...currentList.filter((x) => x.id !== item.id)];
      case 'update':
        return currentList.map((x) => (x.id === item.id ? item : x));
      case 'delete':
        return currentList.filter((x) => x.id !== item.id);
      default:
        return currentList;
    }
  }

  /**
   * Helper utility to rollback optimistic updates from a saved snapshot.
   */
  static rollbackOptimisticUpdate<T>(snapshot: T[]): T[] {
    return [...snapshot];
  }
}
