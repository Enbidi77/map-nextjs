import { z } from 'zod';
import { coordinateSchema } from './coordinates.js';

export const travelModeSchema = z.enum(['driving', 'walking', 'cycling', 'transit']);

export const directionsRequestSchema = z.object({
  origin: coordinateSchema,
  destination: coordinateSchema,
  waypoints: z.array(coordinateSchema).max(25, 'Maximum of 25 waypoints allowed').optional(),
  mode: travelModeSchema.default('driving'),
  alternatives: z.boolean().default(false),
  avoidTolls: z.boolean().default(false),
  avoidHighways: z.boolean().default(false),
  avoidFerries: z.boolean().default(false),
});

export type TravelModeSchema = z.infer<typeof travelModeSchema>;
export type DirectionsRequestSchema = z.infer<typeof directionsRequestSchema>;
