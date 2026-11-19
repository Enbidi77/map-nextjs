import type { RealtimeChannel } from '@supabase/supabase-js';
import type { TypedSupabaseClient } from '../client/client.js';

export type RealtimeStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

export interface PostgresTableSubscriptionOptions<T = any> {
  table: string;
  schema?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (record: T) => void;
  onUpdate?: (newRecord: T, oldRecord: Partial<T>) => void;
  onDelete?: (oldRecord: Partial<T>) => void;
  onChange?: (payload: { eventType: string; new: T; old: Partial<T> }) => void;
}

/**
 * Manages Supabase Realtime channels, subscriptions, and teardown.
 */
export class RealtimeManager {
  private client: TypedSupabaseClient;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(client: TypedSupabaseClient) {
    this.client = client;
  }

  /**
   * Gets or creates a named RealtimeChannel.
   */
  getOrCreateChannel(channelName: string, channelConfig?: any): RealtimeChannel {
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.client.channel(channelName, channelConfig);
      this.channels.set(channelName, channel);
    }
    return channel;
  }

  /**
   * Subscribes to Postgres database changes on a specific table.
   */
  subscribeToTable<T = any>(
    channelName: string,
    options: PostgresTableSubscriptionOptions<T>,
    onStatusChange?: (status: RealtimeStatus) => void
  ): RealtimeChannel {
    const channel = this.getOrCreateChannel(channelName);

    const filterConfig: any = {
      event: options.event || '*',
      schema: options.schema || 'public',
      table: options.table,
    };
    if (options.filter) {
      filterConfig.filter = options.filter;
    }

    channel.on(
      'postgres_changes',
      filterConfig,
      (payload: any) => {
        if (options.onChange) {
          options.onChange({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
        if (payload.eventType === 'INSERT' && options.onInsert) {
          options.onInsert(payload.new);
        } else if (payload.eventType === 'UPDATE' && options.onUpdate) {
          options.onUpdate(payload.new, payload.old);
        } else if (payload.eventType === 'DELETE' && options.onDelete) {
          options.onDelete(payload.old);
        }
      }
    );

    channel.subscribe((status: string) => {
      if (onStatusChange) {
        onStatusChange(status as RealtimeStatus);
      }
    });

    return channel;
  }

  /**
   * Unsubscribes from and removes a specific channel.
   */
  async unsubscribeChannel(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await this.client.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribes and cleans up all managed channels.
   */
  async unsubscribeAll(): Promise<void> {
    const promises: Promise<any>[] = [];
    for (const channel of this.channels.values()) {
      promises.push(this.client.removeChannel(channel));
    }
    await Promise.all(promises);
    this.channels.clear();
  }

  /**
   * Returns active channel count.
   */
  getActiveChannelCount(): number {
    return this.channels.size;
  }
}
