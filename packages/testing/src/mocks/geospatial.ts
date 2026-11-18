import type {
  Coordinate,
  BoundingBox,
  PlaceModel,
  Route,
  GeoJSONFeatureCollection,
} from '@modern-maps/types';

/**
 * Key global city center coordinates
 */
export const MOCK_CITY_COORDINATES = {
  sanFrancisco: [-122.4194, 37.7749] as Coordinate,
  tokyo: [139.6917, 35.6895] as Coordinate,
  paris: [2.3522, 48.8566] as Coordinate,
  newYork: [-74.006, 40.7128] as Coordinate,
  london: [-0.1278, 51.5074] as Coordinate,
};

/**
 * City Bounding Boxes [minLng, minLat, maxLng, maxLat]
 */
export const MOCK_CITY_BOUNDS: Record<string, BoundingBox> = {
  sanFrancisco: [-122.527, 37.703, -122.356, 37.834],
  tokyo: [139.55, 35.53, 139.91, 35.82],
  paris: [2.224, 48.815, 2.469, 48.902],
  newYork: [-74.259, 40.477, -73.700, 40.917],
};

/**
 * Mock places in San Francisco
 */
export const MOCK_SF_PLACES: PlaceModel[] = [
  {
    id: 'sf-1',
    name: 'Ferry Building',
    description: 'Historic ferry terminal and vibrant artisan food marketplace on the Embarcadero.',
    category: 'food_drink',
    coordinates: [-122.3937, 37.7955],
    address: '1 Ferry Building, San Francisco, CA 94111',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    postalCode: '94111',
    rating: 4.7,
    reviewCount: 14250,
    priceLevel: 2,
    tags: ['historic', 'marketplace', 'food', 'waterfront'],
  },
  {
    id: 'sf-2',
    name: 'Golden Gate Bridge',
    description: 'Iconic 1937 suspension bridge spanning the Golden Gate strait.',
    category: 'attraction',
    coordinates: [-122.4783, 37.8199],
    address: 'Golden Gate Bridge, San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    rating: 4.9,
    reviewCount: 65400,
    tags: ['landmark', 'bridge', 'viewpoint', 'iconic'],
  },
  {
    id: 'sf-3',
    name: 'Coit Tower',
    description: 'Art Deco tower in Telegraph Hill offering panoramic 360-degree city views.',
    category: 'attraction',
    coordinates: [-122.4058, 37.8024],
    address: '1 Telegraph Hill Blvd, San Francisco, CA 94133',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    postalCode: '94133',
    rating: 4.6,
    reviewCount: 8900,
    priceLevel: 1,
    tags: ['viewpoint', 'history', 'art'],
  },
  {
    id: 'sf-4',
    name: 'Palace of Fine Arts',
    description: 'Monumental structure built for the 1915 Panama-Pacific International Exposition.',
    category: 'attraction',
    coordinates: [-122.4488, 37.8029],
    address: '3301 Lyon St, San Francisco, CA 94123',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    postalCode: '94123',
    rating: 4.8,
    reviewCount: 21300,
    tags: ['architecture', 'park', 'photography'],
  },
  {
    id: 'sf-5',
    name: 'Tartine Bakery',
    description: 'World-renowned artisan bakery famous for country loaves and morning buns.',
    category: 'food_drink',
    coordinates: [-122.4241, 37.7614],
    address: '600 Guerrero St, San Francisco, CA 94110',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    postalCode: '94110',
    rating: 4.6,
    reviewCount: 7800,
    priceLevel: 2,
    tags: ['bakery', 'coffee', 'mission'],
  },
];

/**
 * Mock GeoJSON FeatureCollection of places
 */
export const MOCK_SF_PLACES_FEATURE_COLLECTION: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: MOCK_SF_PLACES.map((place) => ({
    type: 'Feature',
    id: place.id,
    geometry: {
      type: 'Point',
      coordinates: place.coordinates,
    },
    properties: {
      id: place.id,
      name: place.name,
      category: place.category,
      rating: place.rating,
      address: place.address,
    },
  })),
};

/**
 * Mock Route from Ferry Building to Golden Gate Bridge
 */
export const MOCK_SF_ROUTE: Route = {
  id: 'route-sf-1',
  name: 'Embarcadero to Golden Gate Bridge',
  mode: 'driving',
  distanceMeters: 8920,
  durationSeconds: 1320, // 22 minutes
  bbox: [-122.4783, 37.7955, -122.3937, 37.8199],
  geometry: {
    type: 'LineString',
    coordinates: [
      [-122.3937, 37.7955],
      [-122.4002, 37.8052],
      [-122.4145, 37.8078],
      [-122.4332, 37.8050],
      [-122.4488, 37.8029],
      [-122.4705, 37.8080],
      [-122.4783, 37.8199],
    ],
  },
  legs: [
    {
      distanceMeters: 8920,
      durationSeconds: 1320,
      summary: 'via The Embarcadero and US-101 N',
      startLocation: [-122.3937, 37.7955],
      endLocation: [-122.4783, 37.8199],
      startAddress: '1 Ferry Building, San Francisco, CA',
      endAddress: 'Golden Gate Bridge, San Francisco, CA',
      steps: [
        {
          name: 'The Embarcadero',
          distanceMeters: 1200,
          durationSeconds: 180,
          geometry: {
            type: 'LineString',
            coordinates: [
              [-122.3937, 37.7955],
              [-122.4002, 37.8052],
            ],
          },
          maneuver: {
            instruction: 'Head northwest on The Embarcadero toward Bay St',
            type: 'depart',
            location: [-122.3937, 37.7955],
            distanceMeters: 1200,
            durationSeconds: 180,
          },
        },
        {
          name: 'Bay St / Marina Blvd',
          distanceMeters: 4500,
          durationSeconds: 660,
          geometry: {
            type: 'LineString',
            coordinates: [
              [-122.4002, 37.8052],
              [-122.4488, 37.8029],
            ],
          },
          maneuver: {
            instruction: 'Continue onto Marina Blvd',
            type: 'continue',
            modifier: 'straight',
            location: [-122.4002, 37.8052],
            distanceMeters: 4500,
            durationSeconds: 660,
          },
        },
        {
          name: 'US-101 N',
          distanceMeters: 3220,
          durationSeconds: 480,
          geometry: {
            type: 'LineString',
            coordinates: [
              [-122.4488, 37.8029],
              [-122.4783, 37.8199],
            ],
          },
          maneuver: {
            instruction: 'Merge onto US-101 N toward Golden Gate Bridge',
            type: 'merge',
            location: [-122.4488, 37.8029],
            distanceMeters: 3220,
            durationSeconds: 480,
          },
        },
      ],
    },
  ],
};
