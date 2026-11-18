import { pgTable, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './users.js';

export const searchHistory = pgTable('search_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  selectedPlaceId: text('selected_place_id'),
  selectedPlaceName: text('selected_place_name'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SearchHistoryItem = InferSelectModel<typeof searchHistory>;
export type NewSearchHistoryItem = InferInsertModel<typeof searchHistory>;
