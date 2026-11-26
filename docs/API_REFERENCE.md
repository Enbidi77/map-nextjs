# API Reference

All backend API routes are implemented as Next.js App Router Route Handlers under `apps/web/src/app/api/`.

---

## Search & Geocoding

### `GET /api/search`
Searches for places using `@modern-maps/place-search` (`PlaceSearchService` backed by Nominatim/OSM) with automatic fallback to curated `MOCK_PLACES` when live search returns no results or fails.

**Query Parameters**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` or `query` | `string` | Yes | Search text. Empty string returns `{ results: [] }`. |
| `limit` | `number` | No | Max results (default: `10`). |
| `categories` or `category` | `string` | No | Comma-separated `PlaceCategory` values. |
| `lat`, `lng` | `number` | No | Proximity bias coordinates (`[lng, lat]`). |

**Response (`200 OK`)**
```json
{
  "results": [
    {
      "place": { "id": "...", "name": "...", "address": "...", "category": "...", "coordinates": [lng, lat] },
      "relevanceScore": 1
    }
  ]
}
```

---

### `GET /api/geocode`
Forward geocodes an address or place query using `PlaceSearchService` (limit `5`), falling back to `MOCK_PLACES` on error.

**Query Parameters**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` or `address` | `string` | Yes | Address or place query. Missing/empty returns `400`. |

**Response (`200 OK`)**
Returns `{ results: PlaceSearchResult[] }`.

---

### `GET /api/reverse-geocode`
Reverse geocodes coordinates to the nearest place using `PlaceSearchService.reverse()`, falling back to the nearest entry in `MOCK_PLACES`.

**Query Parameters**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `lat` | `number` | Yes | Latitude. |
| `lng` | `number` | Yes | Longitude. |

**Response (`200 OK`)**
Returns `{ place: PlaceModel | null }`. Missing or non-numeric coordinates return `400`.

---

## Routing & Directions

### `GET /api/directions`
Calculates a route between origin and destination via `@modern-maps/routing` (`RoutingService`).

**Query Parameters**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `origin` | `string` | Yes | `lng,lat` coordinate pair. |
| `destination` | `string` | Yes | `lng,lat` coordinate pair. |
| `mode` | `TravelMode` | No | `driving` (default), `walking`, `cycling`, or `transit`. |
| `alternatives` | `boolean` | No | `"true"` to request alternative routes. |

### `POST /api/directions`
Calculates a route with optional intermediate waypoints.

**Request Body**
```json
{
  "origin": [lng, lat],
  "destination": [lng, lat],
  "mode": "driving",
  "waypoints": [[lng, lat]],
  "alternatives": false
}
```

**Response (`200 OK`)**
Returns `RouteResponse` (`status`, `routes`, optional `message`). Missing/invalid coordinates return `400`.

---

## Places & Spatial Queries

### `GET /api/places/[id]`
Fetches a single place by ID from `MOCK_PLACES` or `getDatabase().getSavedPlaceById(id)`.

**Response**
- `200 OK`: `{ place }`
- `404 Not Found`: `{ error: "Place not found" }`

---

### `GET /api/places/nearby`
Finds saved places within a radius of a coordinate using `getDatabase().findNearbyPlaces()`, falling back to Haversine filtering over `MOCK_PLACES`.

**Query Parameters**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `lat` | `number` | Yes | Center latitude. |
| `lng` | `number` | Yes | Center longitude. |
| `radius` or `radiusMeters` | `number` | No | Search radius in meters (default: `5000`). |
| `category` | `string` | No | Filter results by place category. |

**Response (`200 OK`)**
Returns `{ places }`.

---

### `POST /api/places/within-polygon`
Finds places inside a GeoJSON-style polygon using `PlaceSearchService` (bounded by the polygon's bounding box) and `@modern-maps/geospatial` (`isPointInPolygon`), falling back to `MOCK_PLACES` if no external candidates are found.

**Request Body**
```json
{
  "polygon": [[[lng, lat], [lng, lat], [lng, lat], [lng, lat]]],
  "category": "optional-category"
}
```
- `polygon`: Array of closed linear rings (`Coordinate[][]`), each with at least 4 `[lng, lat]` points where first === last.

**Response**
- `200 OK`: `{ results: PlaceSearchResult[] }`
- `400 Bad Request`: Malformed JSON or invalid polygon.

---

## Saved Places, Collections & Map Features

### `GET /api/saved-places` | `POST /api/saved-places` | `DELETE /api/saved-places`
Manages user saved places via `@modern-maps/database` (`default-user` when `userId` is omitted).
- **`GET`**: Query `?userId=...`. Falls back to initial mock places if database returns empty.
- **`POST`**: Body `{ id?, userId?, name, formattedAddress?, category?, latitude, longitude, notes?, customColor?, customIcon? }`. Returns `201` with `{ place }`.
- **`DELETE`**: Query `?id=...`. Returns `{ success: true, id }`.

### `GET /api/collections` | `POST /api/collections` | `DELETE /api/collections`
Manages user place collections via `@modern-maps/database` (`default-user` when `userId` is omitted).
- **`GET`**: Query `?userId=...`. Returns `{ collections }`.
- **`POST`**: Body `{ userId?, name, description?, color?, icon?, isPublic? }`. Returns `201` with `{ collection }`.
- **`DELETE`**: Query `?id=...`. Returns `{ success: true, id }`.

### `GET /api/map-features` | `POST /api/map-features` | `DELETE /api/map-features`
Manages user-authored vector map features via `@modern-maps/database` (`default-user` when `userId` is omitted).
- **`GET`**: Query `?userId=...`. Returns `{ features }`.
- **`POST`**: Body `{ userId?, name, featureType, geojson, properties? }`. Returns `201` with `{ feature }`.
- **`DELETE`**: Query `?id=...`. Returns `{ success: true, id }`.

### `POST /api/map-features/import`
Validates and batch-imports GeoJSON (`FeatureCollection`, `Feature`, or `Geometry`) up to `500` features per request.
- Validates geometry types (`Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`) and coordinate bounds (`[-180, 180]` / `[-90, 90]`).
- When `NEXT_PUBLIC_SUPABASE_URL` and an `Authorization` header are present, forwards to the `import-geojson` Supabase Edge Function; otherwise persists directly via `getDatabase().createMapFeature()`.
- **Response (`201 Created`)**: `{ features, importedCount }`.
