import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './users.js';
import { savedPlaces } from './saved-places.js';

export const placeCollections = pgTable('place_collections', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  icon: text('icon'),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PlaceCollection = InferSelectModel<typeof placeCollections>;
export type NewPlaceCollection = InferInsertModel<typeof placeCollections>;

export const collectionItems = pgTable('collection_items', {
  id: text('id').primaryKey(),
  collectionId: text('collection_id')
    .references(() => placeCollections.id, { onDelete: 'cascade' })
    .notNull(),
  savedPlaceId: text('saved_place_id')
    .references(() => savedPlaces.id, { onDelete: 'cascade' })
    .notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CollectionItem = InferSelectModel<typeof collectionItems>;
export type NewCollectionItem = InferInsertModel<typeof collectionItems>;
