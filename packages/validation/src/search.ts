import { z } from 'zod';
import { boundingBoxSchema, coordinateSchema } from './coordinates.js';
import { placeCategorySchema } from './places.js';

export const searchQuerySchema = z.object({
  query: z.string().trim().min(1, 'Search query cannot be empty').max(250),
  proximity: coordinateSchema.optional(),
  bbox: boundingBoxSchema.optional(),
  categories: z.array(placeCategorySchema).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export type SearchQuerySchema = z.infer<typeof searchQuerySchema>;
