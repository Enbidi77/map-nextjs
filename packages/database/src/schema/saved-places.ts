import { pgTable, text, timestamp, doublePrecision, customType } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { PlaceCategory } from '@modern-maps/types';
import { users } from './users.js';

/**
 * Custom PostGIS Geometry Point column definition for Drizzle ORM
 * SRID 4326 (WGS 84 standard GPS coordinates)
 */
export const geometryPoint = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'geometry(Point, 4326)';
  },
  toDriver(val: string): string {
    return val;
  },
  fromDriver(val: string): string {
    return val;
  },
});

export const savedPlaces = pgTable('saved_places', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  providerId: text('provider_id'),
  name: text('name').notNull(),
  formattedAddress: text('formatted_address').notNull(),
  category: text('category').$type<PlaceCategory | string>().notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  geom: geometryPoint('geom'),
  notes: text('notes'),
  customColor: text('custom_color'),
  customIcon: text('custom_icon'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SavedPlace = InferSelectModel<typeof savedPlaces>;
export type NewSavedPlace = InferInsertModel<typeof savedPlaces>;
