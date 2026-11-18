import { pgTable, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  defaultStyle: text('default_style').default('streets').notNull(),
  defaultZoom: doublePrecision('default_zoom').default(12).notNull(),
  defaultCenterLng: doublePrecision('default_center_lng').default(-122.4194).notNull(),
  defaultCenterLat: doublePrecision('default_center_lat').default(37.7749).notNull(),
  theme: text('theme').default('system').notNull(), // 'light' | 'dark' | 'system'
  distanceUnit: text('distance_unit').default('metric').notNull(), // 'metric' | 'imperial'
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserPreferences = InferSelectModel<typeof userPreferences>;
export type NewUserPreferences = InferInsertModel<typeof userPreferences>;
