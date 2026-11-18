import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDatabaseAdapter } from '../src/adapters/in-memory.js';
import {
  createSavedPlace,
  getSavedPlaceById,
  listSavedPlaces,
  updateSavedPlace,
  deleteSavedPlace,
} from '../src/queries/saved-places.js';
import {
  createCollection,
  getCollectionById,
  listCollections,
  updateCollection,
  deleteCollection,
  addPlaceToCollection,
  removePlaceFromCollection,
  getCollectionItems,
} from '../src/queries/collections.js';
import type { PlaceCollectionWithPlaces } from '../src/adapters/types.js';
import {
  createMapFeature,
  getMapFeatureById,
  listMapFeatures,
  updateMapFeature,
  deleteMapFeature,
} from '../src/queries/map-features.js';
import {
  addSearchHistory,
  getSearchHistory,
  clearSearchHistory,
} from '../src/queries/search-history.js';
import {
  createUser,
  getUserById,
  getUserByEmail,
  getUserPreferences,
  updateUserPreferences,
} from '../src/queries/users.js';

describe('Database CRUD Operations', () => {
  let db: InMemoryDatabaseAdapter;

  beforeEach(() => {
    db = new InMemoryDatabaseAdapter();
  });

  describe('Saved Places CRUD', () => {
    it('creates, retrieves, updates, and deletes a saved place', async () => {
      const created = await createSavedPlace(db, {
        name: 'Exploratorium',
        formattedAddress: 'Pier 15, The Embarcadero, San Francisco, CA 94111',
        category: 'attraction',
        latitude: 37.8014,
        longitude: -122.3976,
        notes: 'Interactive science museum.',
        customColor: '#10b981',
        customIcon: 'sparkles',
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Exploratorium');

      const fetched = await getSavedPlaceById(db, created.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.formattedAddress).toContain('Pier 15');

      const updated = await updateSavedPlace(db, created.id, {
        notes: 'Updated note: buy tickets in advance!',
      });
      expect(updated?.notes).toBe('Updated note: buy tickets in advance!');

      const deleted = await deleteSavedPlace(db, created.id);
      expect(deleted).toBe(true);

      const afterDelete = await getSavedPlaceById(db, created.id);
      expect(afterDelete).toBeNull();
    });

    it('filters saved places by category and search query', async () => {
      const foodPlaces = await listSavedPlaces(db, null, { category: 'food_drink' });
      expect(foodPlaces.length).toBeGreaterThan(0);
      expect(foodPlaces.every((p) => p.category === 'food_drink')).toBe(true);

      const searchResults = await listSavedPlaces(db, null, { searchQuery: 'Ferry' });
      expect(searchResults.length).toBe(1);
      expect(searchResults[0]!.name).toContain('Ferry Building');
    });
  });

  describe('Collections CRUD', () => {
    it('creates, manages items, and retrieves collection with places', async () => {
      const col = await createCollection(db, {
        name: 'My Weekend Trip',
        description: 'Favorites for Saturday walk',
        color: '#8b5cf6',
      });

      expect(col.id).toBeDefined();
      expect(col.name).toBe('My Weekend Trip');

      // Add places
      await addPlaceToCollection(db, col.id, 'place-ferry-building', 1);
      await addPlaceToCollection(db, col.id, 'place-coit-tower', 2);

      const items = await getCollectionItems(db, col.id);
      expect(items.length).toBe(2);
      expect(items[0]!.savedPlace.name).toBe('Ferry Building Marketplace');

      const colWithPlaces = await getCollectionById(db, col.id, true);
      expect(colWithPlaces).not.toBeNull();
      expect((colWithPlaces as PlaceCollectionWithPlaces).places).toHaveLength(2);

      // Update collection
      const updatedCol = await updateCollection(db, col.id, {
        description: 'Updated weekend itinerary',
      });
      expect(updatedCol?.description).toBe('Updated weekend itinerary');

      // List collections
      const allCols = await listCollections(db);
      expect(allCols.length).toBeGreaterThan(0);

      // Remove an item
      const removed = await removePlaceFromCollection(db, col.id, 'place-ferry-building');
      expect(removed).toBe(true);

      const updatedItems = await getCollectionItems(db, col.id);
      expect(updatedItems.length).toBe(1);

      // Delete collection
      await deleteCollection(db, col.id);
      const afterDelete = await getCollectionById(db, col.id);
      expect(afterDelete).toBeNull();
    });
  });

  describe('User Map Features CRUD', () => {
    it('creates, lists, and updates user map features (point, linestring, polygon)', async () => {
      const pointFeature = await createMapFeature(db, {
        name: 'Custom Pin',
        featureType: 'point',
        geojson: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        properties: { color: '#ff0000' },
      });

      const lineFeature = await createMapFeature(db, {
        name: 'Morning Jog Route',
        featureType: 'linestring',
        geojson: {
          type: 'LineString',
          coordinates: [
            [-122.4194, 37.7749],
            [-122.42, 37.78],
          ],
        },
        properties: { strokeWidth: 3 },
      });

      expect(pointFeature.id).toBeDefined();
      expect(lineFeature.featureType).toBe('linestring');

      const points = await listMapFeatures(db, null, 'point');
      expect(points.some((p) => p.id === pointFeature.id)).toBe(true);
      expect(points.some((p) => p.id === lineFeature.id)).toBe(false);

      const updated = await updateMapFeature(db, pointFeature.id, {
        name: 'Updated Pin Name',
      });
      expect(updated?.name).toBe('Updated Pin Name');

      await deleteMapFeature(db, pointFeature.id);
      const fetched = await getMapFeatureById(db, pointFeature.id);
      expect(fetched).toBeNull();
    });
  });

  describe('Search History CRUD', () => {
    it('adds, lists, and clears search history items', async () => {
      const userId = 'user-test-789';
      await addSearchHistory(db, {
        userId,
        query: 'Coffee near Financial District',
        latitude: 37.79,
        longitude: -122.4,
      });

      await addSearchHistory(db, {
        userId,
        query: 'Golden Gate Park',
        latitude: 37.769,
        longitude: -122.486,
      });

      const history = await getSearchHistory(db, userId, 10);
      expect(history.length).toBe(2);
      expect(history[0]!.query).toBe('Golden Gate Park'); // Most recent first

      await clearSearchHistory(db, userId);
      const afterClear = await getSearchHistory(db, userId);
      expect(afterClear.length).toBe(0);
    });
  });

  describe('Users & Preferences CRUD', () => {
    it('creates a user with auto-generated preferences', async () => {
      const user = await createUser(db, {
        email: 'analyst@modernmaps.io',
        name: 'Modern Maps Analyst',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('analyst@modernmaps.io');

      const fetchedById = await getUserById(db, user.id);
      expect(fetchedById?.id).toBe(user.id);

      const fetchedByEmail = await getUserByEmail(db, 'ANALYST@modernmaps.io');
      expect(fetchedByEmail?.id).toBe(user.id);

      const prefs = await getUserPreferences(db, user.id);
      expect(prefs).not.toBeNull();
      expect(prefs?.defaultStyle).toBe('streets');
      expect(prefs?.distanceUnit).toBe('metric');

      const updatedPrefs = await updateUserPreferences(db, user.id, {
        defaultStyle: 'satellite',
        distanceUnit: 'imperial',
      });
      expect(updatedPrefs.defaultStyle).toBe('satellite');
      expect(updatedPrefs.distanceUnit).toBe('imperial');
    });
  });
});
