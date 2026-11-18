import { relations } from 'drizzle-orm';
import { users, userPreferences } from './users.js';
import { savedPlaces } from './saved-places.js';
import { placeCollections, collectionItems } from './collections.js';
import { searchHistory } from './search-history.js';
import { userMapFeatures } from './map-features.js';

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  savedPlaces: many(savedPlaces),
  collections: many(placeCollections),
  searchHistory: many(searchHistory),
  mapFeatures: many(userMapFeatures),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const savedPlacesRelations = relations(savedPlaces, ({ one, many }) => ({
  user: one(users, {
    fields: [savedPlaces.userId],
    references: [users.id],
  }),
  collectionItems: many(collectionItems),
}));

export const placeCollectionsRelations = relations(placeCollections, ({ one, many }) => ({
  user: one(users, {
    fields: [placeCollections.userId],
    references: [users.id],
  }),
  items: many(collectionItems),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(placeCollections, {
    fields: [collectionItems.collectionId],
    references: [placeCollections.id],
  }),
  savedPlace: one(savedPlaces, {
    fields: [collectionItems.savedPlaceId],
    references: [savedPlaces.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));

export const userMapFeaturesRelations = relations(userMapFeatures, ({ one }) => ({
  user: one(users, {
    fields: [userMapFeatures.userId],
    references: [users.id],
  }),
}));
