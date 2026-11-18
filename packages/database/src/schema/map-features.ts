import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './users.js';

export type MapFeatureType = 'point' | 'linestring' | 'polygon';

export const userMapFeatures = pgTable('user_map_features', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  featureType: text('feature_type').$type<MapFeatureType>().notNull(),
  geojson: jsonb('geojson').$type<Record<string, unknown>>().notNull(),
  properties: jsonb('properties').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserMapFeature = InferSelectModel<typeof userMapFeatures>;
export type NewUserMapFeature = InferInsertModel<typeof userMapFeatures>;
