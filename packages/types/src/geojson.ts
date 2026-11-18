import type { BoundingBox, Coordinate } from './coordinates.js';

export type GeoJSONPosition = Coordinate | [number, number, number];

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: GeoJSONPosition;
}

export interface GeoJSONMultiPoint {
  type: 'MultiPoint';
  coordinates: GeoJSONPosition[];
}

export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: GeoJSONPosition[];
}

export interface GeoJSONMultiLineString {
  type: 'MultiLineString';
  coordinates: GeoJSONPosition[][];
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: GeoJSONPosition[][];
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: GeoJSONPosition[][][];
}

export interface GeoJSONGeometryCollection {
  type: 'GeometryCollection';
  geometries: GeoJSONGeometry[];
}

export type GeoJSONGeometry =
  | GeoJSONPoint
  | GeoJSONMultiPoint
  | GeoJSONLineString
  | GeoJSONMultiLineString
  | GeoJSONPolygon
  | GeoJSONMultiPolygon
  | GeoJSONGeometryCollection;

export interface GeoJSONFeature<
  G extends GeoJSONGeometry = GeoJSONGeometry,
  P = Record<string, unknown>
> {
  type: 'Feature';
  id?: string | number;
  geometry: G;
  properties: P;
  bbox?: BoundingBox;
}

export interface GeoJSONFeatureCollection<
  G extends GeoJSONGeometry = GeoJSONGeometry,
  P = Record<string, unknown>
> {
  type: 'FeatureCollection';
  features: Array<GeoJSONFeature<G, P>>;
  bbox?: BoundingBox;
}
