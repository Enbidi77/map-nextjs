import { z } from 'zod';

/**
 * Validates longitude coordinate [-180, 180]
 */
export const longitudeSchema = z
  .number()
  .min(-180, { message: 'Longitude must be >= -180' })
  .max(180, { message: 'Longitude must be <= 180' });

/**
 * Validates latitude coordinate [-90, 90]
 */
export const latitudeSchema = z
  .number()
  .min(-90, { message: 'Latitude must be >= -90' })
  .max(90, { message: 'Latitude must be <= 90' });

/**
 * Validates standard 2D coordinate [lng, lat]
 */
export const coordinateSchema = z.tuple([longitudeSchema, latitudeSchema]);

/**
 * Validates 3D coordinate [lng, lat, altitude]
 */
export const coordinate3DSchema = z.tuple([
  longitudeSchema,
  latitudeSchema,
  z.number().describe('Altitude in meters'),
]);

/**
 * Validates LatLng object representation
 */
export const latLngSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
});

/**
 * Validates BoundingBox [minLng, minLat, maxLng, maxLat]
 */
export const boundingBoxSchema = z
  .tuple([longitudeSchema, latitudeSchema, longitudeSchema, latitudeSchema])
  .refine(([minLng, , maxLng]) => minLng <= maxLng, {
    message: 'minLng must be less than or equal to maxLng',
  })
  .refine(([, minLat, , maxLat]) => minLat <= maxLat, {
    message: 'minLat must be less than or equal to maxLat',
  });

/**
 * Validates BoundingBoxObject { west, south, east, north }
 */
export const boundingBoxObjectSchema = z
  .object({
    west: longitudeSchema,
    south: latitudeSchema,
    east: longitudeSchema,
    north: latitudeSchema,
  })
  .refine((box) => box.west <= box.east, {
    message: 'west must be less than or equal to east',
  })
  .refine((box) => box.south <= box.north, {
    message: 'south must be less than or equal to north',
  });

export type CoordinateSchema = z.infer<typeof coordinateSchema>;
export type LatLngSchema = z.infer<typeof latLngSchema>;
export type BoundingBoxSchema = z.infer<typeof boundingBoxSchema>;
export type BoundingBoxObjectSchema = z.infer<typeof boundingBoxObjectSchema>;
