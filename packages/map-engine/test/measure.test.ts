import { describe, it, expect, vi } from 'vitest';
import { MeasurementTool } from '../src/measure/MeasurementTool.js';
import { formatArea } from '../src/measure/formatArea.js';
import { MapLibreRenderer } from '../src/renderer/MapLibreRenderer.js';
import { MockMapLibreMap } from '@modern-maps/testing';

describe('formatArea', () => {
  it('formats small areas in square meters', () => {
    expect(formatArea(500)).toBe('500 m²');
    expect(formatArea(8500)).toBe('8,500 m²');
  });

  it('formats large areas in hectares and square kilometers', () => {
    expect(formatArea(25000)).toBe('2.50 ha');
    expect(formatArea(2500000)).toBe('2.50 km²');
  });

  it('formats imperial units in sq ft, acres, and sq mi', () => {
    expect(formatArea(100, 'imperial')).toContain('sq ft');
    expect(formatArea(40468, 'imperial')).toContain('acres');
    expect(formatArea(5000000, 'imperial')).toContain('sq mi');
  });
});

describe('MeasurementTool', () => {
  it('measures distance accurately along clicked path', () => {
    const mockMap = new MockMapLibreMap();
    const renderer = new MapLibreRenderer(mockMap);
    const tool = new MeasurementTool(renderer);

    const listener = vi.fn();
    tool.onMeasurementChange(listener);

    tool.setMode('distance');
    expect(tool.getMode()).toBe('distance');

    // SF to Oakland (~12 km)
    tool.addPoint([-122.4194, 37.7749]);
    tool.addPoint([-122.2711, 37.8044]);

    const result = tool.getMeasurement();
    expect(result.distanceMeters).toBeGreaterThan(10000);
    expect(result.distanceMeters).toBeLessThan(16000);
    expect(result.formattedDistance).toMatch(/\d+(\.\d+)?\s*km/);
    expect(listener).toHaveBeenCalled();

    tool.undo();
    expect(tool.getPoints().length).toBe(1);

    tool.clear();
    expect(tool.getPoints().length).toBe(0);
    expect(tool.getMeasurement().distanceMeters).toBe(0);
  });

  it('measures area accurately for a closed polygon', () => {
    const mockMap = new MockMapLibreMap();
    const renderer = new MapLibreRenderer(mockMap);
    const tool = new MeasurementTool(renderer);

    tool.setMode('area');

    // 1km x 1km approximate box (~1,000,000 m²)
    tool.addPoint([0, 0]);
    tool.addPoint([0.01, 0]);
    tool.addPoint([0.01, 0.01]);
    tool.addPoint([0, 0.01]);

    const result = tool.getMeasurement();
    expect(result.areaSqMeters).toBeGreaterThan(500000);
    expect(result.formattedArea).toBeDefined();

    tool.finish();
    expect(tool.getMeasurement().isComplete).toBe(true);
  });
});
