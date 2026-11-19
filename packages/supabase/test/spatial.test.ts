import { describe, it, expect } from 'vitest';
import {
  coordinateToWktPoint,
  parseWktPoint,
  bboxToWktPolygon,
} from '../src/queries/spatial.js';
import { ValidationError } from '../src/client/errors.js';

describe('Spatial PostGIS helpers', () => {
  it('converts coordinate to WKT Point', () => {
    const wkt = coordinateToWktPoint([-122.4194, 37.7749]);
    expect(wkt).toBe('POINT(-122.4194 37.7749)');
  });

  it('throws on invalid coordinate for WKT Point', () => {
    expect(() => coordinateToWktPoint([NaN, 37.7749])).toThrow(ValidationError);
  });

  it('parses WKT Point to coordinate', () => {
    const coord = parseWktPoint('POINT(-122.4194 37.7749)');
    expect(coord).toEqual([-122.4194, 37.7749]);
  });

  it('converts bounding box to WKT Polygon', () => {
    const wkt = bboxToWktPolygon([-122.5, 37.7, -122.3, 37.8]);
    expect(wkt).toBe('POLYGON((-122.5 37.7, -122.3 37.7, -122.3 37.8, -122.5 37.8, -122.5 37.7))');
  });
});
