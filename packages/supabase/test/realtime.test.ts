import { describe, it, expect, vi } from 'vitest';
import { RealtimeManager } from '../src/realtime/realtimeManager.js';
import { FeatureSyncManager } from '../src/realtime/featureSync.js';

describe('Realtime Managers', () => {
  it('manages channel creation and cleanup in RealtimeManager', async () => {
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb) => {
        if (cb) cb('SUBSCRIBED');
        return mockChannel;
      }),
    };

    const mockClient = {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn().mockResolvedValue('ok'),
    } as any;

    const manager = new RealtimeManager(mockClient);
    expect(manager.getActiveChannelCount()).toBe(0);

    const channel = manager.getOrCreateChannel('map-sync');
    expect(channel).toBeDefined();
    expect(manager.getActiveChannelCount()).toBe(1);

    await manager.unsubscribeChannel('map-sync');
    expect(manager.getActiveChannelCount()).toBe(0);
    expect(mockClient.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('optimistic update utilities in FeatureSyncManager work properly', () => {
    const initialList = [
      { id: '1', name: 'Feature 1' },
      { id: '2', name: 'Feature 2' },
    ];

    // Add
    const afterAdd = FeatureSyncManager.applyOptimisticUpdate(
      initialList,
      { id: '3', name: 'Feature 3' },
      'add'
    );
    expect(afterAdd).toHaveLength(3);
    expect(afterAdd[0]!.id).toBe('3');

    // Update
    const afterUpdate = FeatureSyncManager.applyOptimisticUpdate(
      initialList,
      { id: '2', name: 'Feature 2 Updated' },
      'update'
    );
    expect(afterUpdate.find((x) => x.id === '2')!.name).toBe('Feature 2 Updated');

    // Delete
    const afterDelete = FeatureSyncManager.applyOptimisticUpdate(
      initialList,
      { id: '1', name: '' },
      'delete'
    );
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0]!.id).toBe('2');

    // Rollback
    const rolledBack = FeatureSyncManager.rollbackOptimisticUpdate(initialList);
    expect(rolledBack).toEqual(initialList);
  });
});
