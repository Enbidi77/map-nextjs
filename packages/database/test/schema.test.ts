import { describe, it, expect } from 'vitest';
import {
  users,
  userPreferences,
  savedPlaces,
  placeCollections,
  collectionItems,
  searchHistory,
  userMapFeatures,
  geometryPoint,
} from '../src/schema/index.js';

describe('Drizzle ORM Schema Definitions', () => {
  it('defines all required tables', () => {
    expect(users).toBeDefined();
    expect(userPreferences).toBeDefined();
    expect(savedPlaces).toBeDefined();
    expect(placeCollections).toBeDefined();
    expect(collectionItems).toBeDefined();
    expect(searchHistory).toBeDefined();
    expect(userMapFeatures).toBeDefined();
  });

  it('verifies users table columns', () => {
    expect(users.id).toBeDefined();
    expect(users.email).toBeDefined();
    expect(users.name).toBeDefined();
    expect(users.avatarUrl).toBeDefined();
    expect(users.createdAt).toBeDefined();
    expect(users.updatedAt).toBeDefined();
  });

  it('verifies savedPlaces table columns including PostGIS geom', () => {
    expect(savedPlaces.id).toBeDefined();
    expect(savedPlaces.userId).toBeDefined();
    expect(savedPlaces.providerId).toBeDefined();
    expect(savedPlaces.name).toBeDefined();
    expect(savedPlaces.formattedAddress).toBeDefined();
    expect(savedPlaces.category).toBeDefined();
    expect(savedPlaces.latitude).toBeDefined();
    expect(savedPlaces.longitude).toBeDefined();
    expect(savedPlaces.geom).toBeDefined();
    expect(savedPlaces.notes).toBeDefined();
    expect(savedPlaces.customColor).toBeDefined();
    expect(savedPlaces.customIcon).toBeDefined();
  });

  it('verifies userMapFeatures table columns', () => {
    expect(userMapFeatures.id).toBeDefined();
    expect(userMapFeatures.name).toBeDefined();
    expect(userMapFeatures.featureType).toBeDefined();
    expect(userMapFeatures.geojson).toBeDefined();
    expect(userMapFeatures.properties).toBeDefined();
  });

  it('verifies PostGIS geometryPoint custom type serialization', () => {
    expect(geometryPoint).toBeDefined();
    expect(savedPlaces.geom.getSQLType()).toBe('geometry(Point, 4326)');
  });
});
