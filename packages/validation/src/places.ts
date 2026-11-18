import { z } from 'zod';
import { boundingBoxSchema, coordinateSchema } from './coordinates.js';

export const placeCategorySchema = z.enum([
  'food_drink',
  'lodging',
  'shopping',
  'transit',
  'attraction',
  'services',
  'nature',
  'medical',
  'entertainment',
  'other',
]);

export const placeFilterSchema = z.object({
  query: z.string().trim().max(200).optional(),
  categories: z.array(placeCategorySchema).optional(),
  boundingBox: boundingBoxSchema.optional(),
  center: coordinateSchema.optional(),
  radiusMeters: z.number().positive().max(100000).optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxPriceLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  openNow: z.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const placeCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().trim().max(2000).optional(),
  category: placeCategorySchema,
  coordinates: coordinateSchema,
  address: z.string().trim().min(1, 'Address is required').max(500),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(30).optional(),
  website: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')),
  rating: z.number().min(0).max(5).optional(),
  priceLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  tags: z.array(z.string().trim()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const placeUpdateSchema = placeCreateSchema.partial();

export type PlaceCategorySchema = z.infer<typeof placeCategorySchema>;
export type PlaceFilterSchema = z.infer<typeof placeFilterSchema>;
export type PlaceCreateSchema = z.infer<typeof placeCreateSchema>;
export type PlaceUpdateSchema = z.infer<typeof placeUpdateSchema>;
