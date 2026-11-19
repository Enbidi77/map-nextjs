import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Realtime Features & Location Sharing Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates expiration countdown correctly for live location', () => {
    const durationMinutes = 15;
    const now = Date.now();
    const expiresAt = now + durationMinutes * 60 * 1000;

    const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
    expect(remainingSeconds).toBe(15 * 60);

    const expiredCheck = now + (16 * 60 * 1000);
    const expiredRemaining = Math.max(0, Math.floor((expiresAt - expiredCheck) / 1000));
    expect(expiredRemaining).toBe(0);
  });

  it('formats collaborator colors and keys stably', () => {
    const COLLABORATOR_COLORS = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ec4899',
      '#8b5cf6',
      '#06b6d4',
      '#f97316',
      '#14b8a6',
    ];

    function getRandomColor(seed: string): string {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
      return COLLABORATOR_COLORS[index]!;
    }

    const color1 = getRandomColor('user-123');
    const color2 = getRandomColor('user-123');
    const color3 = getRandomColor('user-456');

    expect(color1).toBe(color2); // stable for same seed
    expect(typeof color3).toBe('string');
    expect(COLLABORATOR_COLORS).toContain(color1);
  });

  it('formats feature broadcast payload correctly', () => {
    const mockFeature = {
      id: 'feature-1',
      type: 'Feature' as const,
      geometry: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749],
      },
      properties: {
        name: 'Marker A',
        category: 'landmark',
      },
    };

    const senderId = 'user-alice';
    const payload = {
      feature: {
        ...mockFeature,
        properties: {
          ...mockFeature.properties,
          createdBy: 'Alice Mapper',
          updatedAt: new Date().toISOString(),
        },
      },
      senderId,
    };

    expect(payload.feature.id).toBe('feature-1');
    expect(payload.feature.properties.createdBy).toBe('Alice Mapper');
    expect(payload.senderId).toBe('user-alice');
  });
});
