# Modern Maps & Location Intelligence Platform

A high-performance, modular geospatial analytics and interactive mapping platform built with Next.js 15, React 19, MapLibre GL 5, Supabase, PostGIS, Drizzle ORM, and Turf.js.

## 📚 Documentation

- [System Architecture](docs/ARCHITECTURE.md) — Monorepo design, frontend state/layout, map engine, and database adapter resolution
- [API Reference](docs/API_REFERENCE.md) — Next.js App Router API endpoints (`/api/search`, `/api/geocode`, `/api/directions`, `/api/places/*`, `/api/saved-places`, `/api/collections`, `/api/map-features/*`)
- [Packages Reference](docs/PACKAGES.md) — All 12 `@modern-maps/*` workspace packages and shared commands
- [Setup & Operating Guide](docs/SETUP_GUIDE.md) — Remote Supabase linking, migrations, storage buckets, and local runbook
- [Swarm Agents Guide](AGENTS.md) — Multi-agent architecture and workspace conventions

---

## 🗺️ Monorepo Architecture

The platform is architected as a pnpm workspace orchestrated with Turborepo:

```
├── apps/
│   └── web/                   # Next.js 15 interactive mapping web app (App Router, SSR, Realtime, i18n)
├── docs/                      # Architecture, API reference, package docs, and setup guide
├── packages/
│   ├── config/                # Shared TypeScript configurations
│   ├── types/                 # Universal geospatial domain types & interfaces
│   ├── validation/            # Zod validation schemas for locations, queries & routes
│   ├── geospatial/            # Turf.js mathematical & geospatial algorithms wrapper
│   ├── map-data/              # Map tile providers, geocoding & directions adapters
│   ├── map-engine/            # MapLibre GL wrapper, viewport manager, camera, layer & drawing engine
│   ├── place-search/          # Place search & geocoding service (Nominatim, Photon, TTL cache)
│   ├── routing/               # Turn-by-turn routing service (OSRM + mock fallback + cache)
│   ├── database/              # Drizzle schema & multi-adapter client (Postgres, Supabase, In-Memory)
│   ├── supabase/              # Typed Supabase client, queries, mutations, realtime & storage
│   ├── ui/                    # Accessible UI component library & map widgets (Radix + Tailwind)
│   └── testing/               # Vitest test configurations, shared mocks & fixture datasets
├── supabase/
│   ├── config.toml            # Supabase local development configuration
│   ├── migrations/            # PostGIS database migrations, RLS policies, spatial RPCs
│   ├── seed.sql               # Reproducible seed datasets for development & testing
│   ├── types/                 # Auto-generated & hand-curated Database TypeScript types
│   └── functions/             # Supabase Edge Functions (Deno runtime)
│       ├── geocode/           # Geocoding proxy & normalization
│       ├── directions/        # Routing & turn-by-turn navigation proxy
│       ├── nearby-places/     # Nearby POI discovery service
│       └── import-geojson/    # GeoJSON validation & spatial ingestion
├── docker-compose.yml         # Local PostGIS 16 and Redis 7 services
└── turbo.json                 # Build pipeline orchestration
```

---

## ⚡ Supabase-First Backend Architecture

The platform uses **Supabase** as its core backend engine, unifying relational data, spatial indexing, identity, object storage, and realtime messaging.

```
                           ┌────────────────────────────┐
                           │      Next.js 14 (Web)      │
                           │  App Router + SSR + React  │
                           └──────────────┬─────────────┘
                                          │
                   ┌──────────────────────┼──────────────────────┐
                   │                      │                      │
                   ▼                      ▼                      ▼
        ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
        │   Supabase Auth    │ │   PostgREST API    │ │ Supabase Realtime  │
        │ Cookie SSR Refresh │ │ PostGIS 16 Spatial │ │ Presence/Broadcast │
        │ Row-Level Security │ │  Custom Spatial RPC│ │  Live Map Collab   │
        └────────────────────┘ └────────────────────┘ └────────────────────┘
                   │                      │                      │
                   ▼                      ▼                      ▼
        ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
        │  Supabase Storage  │ │   Edge Functions   │ │    Redis Cache     │
        │  Photos / GeoJSON  │ │ Geocode / Routing  │ │ Ephemeral PubSub   │
        └────────────────────┘ └────────────────────┘ └────────────────────┘
```

---

### 1. PostGIS Database Schema & Spatial RPCs

All spatial coordinates and vectors are stored in PostgreSQL using native **PostGIS 3.4** extensions.

#### Core Tables
- **`user_profiles`**: User identity profile extending `auth.users` (username, avatar, bio).
- **`user_preferences`**: User mapping settings (default style, center coordinates, zoom level, unit system).
- **`saved_places`**: Point-of-interest bookmarks with `location GEOGRAPHY(Point, 4326)` for precise geodesic queries, category, ratings, and metadata.
- **`place_collections`**: User-curated groups of places (e.g., "Favorite Cafes", "Field Inspection 2026") with public/private visibility.
- **`collection_items`**: Many-to-many junction linking places to collections with custom notes and ordering.
- **`search_history`**: Audit log of geocoding queries with `GEOGRAPHY(Point, 4326)` for spatial analytics.
- **`user_map_features`**: User-authored vector geometries with `geom GEOMETRY(Geometry, 4326)` supporting Points, LineStrings, and Polygons.
- **`shared_collections`**: Granular access control delegation (read/edit) for collaboration.
- **`map_layer_preferences`**: Custom layer visibility, opacity, and styling state.
- **`location_shares`**: Ephemeral, tokenized live location sharing with TTL expiration.

#### Spatial Indexing
Each spatial column is indexed using **GiST (Generalized Search Tree)** indexes:
```sql
CREATE INDEX idx_saved_places_location ON saved_places USING GIST (location);
CREATE INDEX idx_user_map_features_geom ON user_map_features USING GIST (geom);
CREATE INDEX idx_search_history_location ON search_history USING GIST (location);
CREATE INDEX idx_location_shares_current_location ON location_shares USING GIST (current_location);
```

#### Spatial RPC Functions
Stored procedures exposed directly via PostgREST RPC for sub-millisecond execution:
- **`nearby_saved_places(center_lng, center_lat, radius_meters, max_results)`**: Geodesic search using `ST_DWithin` on `GEOGRAPHY` types.
- **`features_in_viewport(min_lng, min_lat, max_lng, max_lat, max_features)`**: Bounding box intersection query using `ST_MakeEnvelope` and `ST_Intersects` on `GEOMETRY` types.
- **`features_intersecting_geometry(target_geom)`**: Finds all user features overlapping a drawn polygon or corridor.
- **`spatial_distance(p1_lng, p1_lat, p2_lng, p2_lat)`**: Computes accurate ellipsoidal distance in meters via `ST_Distance`.
- **`paginated_places(cursor_id, page_size, category_filter)`**: Keyset-paginated spatial listing.

---

### 2. Row Level Security (RLS) Model

The database operates under strict **Least Privilege**. Row Level Security is enabled on **every** table.

- **Identity Resolution**: Policies utilize `auth.uid()` directly.
- **Owner Isolation**: Users can only insert, update, or delete records where `user_id = auth.uid()`.
- **Collaborative Sharing**:
  - Public collections (`is_public = true`) permit read access to all authenticated users.
  - Shared collections check membership via `shared_collections`:
    ```sql
    CREATE POLICY "Users can view shared collections" ON place_collections
      FOR SELECT USING (
        auth.uid() = user_id OR
        is_public = true OR
        EXISTS (
          SELECT 1 FROM shared_collections sc
          WHERE sc.collection_id = place_collections.id
          AND sc.shared_with_user_id = auth.uid()
        )
      );
    ```
- **Performance Optimization**: Foreign keys (`user_id`, `collection_id`, `place_id`) and predicate columns are explicitly indexed to guarantee zero table scans during policy evaluation.

---

### 3. Supabase Auth & SSR Architecture

Authentication is tightly integrated with Next.js App Router using `@supabase/ssr`:

- **Browser Client (`packages/supabase/src/client/client.ts` & `apps/web/src/lib/supabase/client.ts`)**:
  Instantiated using `createBrowserClient` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Server Client (`apps/web/src/lib/supabase/server.ts`)**:
  Instantiated per-request via `createServerClient` reading from and writing to Next.js `cookies()`.
- **Session Refresh Middleware (`apps/web/src/middleware.ts`)**:
  Refreshes expiring auth tokens on every request and writes refreshed cookies back to both Request and Response headers.
- **Security Guarantee**:
  `SUPABASE_SERVICE_ROLE_KEY` is strictly reserved for administrative tasks and server environments. It is **never** prefixed with `NEXT_PUBLIC_` and never included in client bundles.

---

### 4. Supabase Storage Buckets & Policies

Object storage organizes binary geospatial assets into dedicated buckets:

| Bucket Name | Access Level | Description | Allowed MIME Types |
|---|---|---|---|
| `place-photos` | Public Read / Auth Write | Photos uploaded for saved places | `image/jpeg`, `image/png`, `image/webp` |
| `collection-covers` | Public Read / Auth Write | Header covers for place collections | `image/jpeg`, `image/png`, `image/webp` |
| `geojson-imports` | Private (Auth Only) | Raw user GeoJSON files for ingestion | `application/geo+json`, `application/json` |
| `map-attachments` | Private (Auth Only) | PDF reports, survey files & telemetry logs | `application/pdf`, `text/csv`, `application/zip` |

Storage security is enforced at the database level on `storage.objects` using RLS:
```sql
-- Enforce user directory isolation (e.g., place-photos/{user_id}/{filename})
CREATE POLICY "Users upload to their own directory" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'place-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

### 5. Supabase Realtime Architecture

Realtime features enable live collaborative mapping:

1. **Postgres Changes (`postgres_changes`)**:
   - Subscribes to table-level mutations (`INSERT`, `UPDATE`, `DELETE`) on `user_map_features` and `saved_places`.
   - UI updates optimistically, syncing instantly across all browser tabs and collaborating peers.
2. **Presence Channels (`presence`)**:
   - Tracks online collaborators in active map sessions (`map:session:<id>`).
   - Synchronizes user state: viewport bounds, mouse cursor coordinates, active layer selection, and online badges.
3. **Broadcast Channels (`broadcast`)**:
   - Ephemeral low-latency messaging for real-time cursor hover, drawing previews, and viewport pans without database writes.
4. **Live Location Sharing**:
   - Ephemeral location broadcast with token validation and expiration timers.

---

### 6. Supabase Edge Functions

Serverless Deno functions deployed to the Supabase Edge Runtime:

- **`geocode`**: Proxies and normalizes forward and reverse geocoding requests across providers with caching and fallback.
- **`directions`**: Turn-by-turn routing proxy that computes driving, cycling, and walking routes, returning GeoJSON LineStrings and step instructions.
- **`nearby-places`**: Discovers points of interest within a given bounding box or radius.
- **`import-geojson`**: Validates, sanitizes, and transactions-batches imported GeoJSON features into `user_map_features`.

---

## 🚀 Local Development Workflow

### Prerequisites
- **Node.js**: v20+ (recommended v22+)
- **pnpm**: v9+
- **Docker & Docker Compose**: v24+
- **Supabase CLI** (optional, recommended): `npm install -g supabase`

### 1. Environment Configuration
Copy the template environment file:
```bash
cp .env.example .env.local
```

### 2. Start the Local Backend

#### Option A: Using Supabase CLI (Recommended)
```bash
# Initialize and start Supabase local stack (PostGIS, Auth, Storage, Realtime, Studio)
supabase start

# Apply all migrations and seed data
supabase db reset

# Serve Edge Functions locally
supabase functions serve
```
Supabase Local Endpoints:
- **API Gateway (Kong)**: `http://127.0.0.1:54321`
- **Supabase Studio (UI)**: `http://127.0.0.1:54323`
- **Database (PostgreSQL/PostGIS)**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Inbucket (Email Dev)**: `http://127.0.0.1:54324`

#### Option B: Using Standalone Docker Compose
```bash
# Start PostGIS 16 and Redis 7
docker compose up -d
```

### 3. Build & Run Application
```bash
# Install all dependencies across the monorepo
pnpm install

# Build all packages
pnpm turbo:build

# Start development servers
pnpm dev

# Run all test suites
pnpm test

# Type checking across all workspaces
pnpm typecheck

# Linting
pnpm lint
```

---

## 📦 Monorepo Packages

| Package | Purpose |
|---|---|
| **`@modern-maps/config`** | Shared TypeScript configurations (`tsconfig.base.json`, `tsconfig.next.json`, `tsconfig.node.json`, `tsconfig.react.json`). |
| **`@modern-maps/database`** | Drizzle ORM schema, spatial/CRUD queries, and multi-adapter client (Postgres, Supabase, In-Memory). |
| **`@modern-maps/place-search`** | Place search & geocoding service (`PlaceSearchService`) with Nominatim, Photon, and TTL caching. |
| **`@modern-maps/routing`** | Turn-by-turn routing service (`RoutingService`) with OSRM, mock fallback, and 15-minute caching. |
| **`@modern-maps/supabase`** | Supabase client setup, typed query builders, mutations, realtime channels & storage manager. |
| **`@modern-maps/map-data`** | Tile provider adapters (Carto, OSM, ESRI, OpenTopoMap), geocoding & directions routing clients. |
| **`@modern-maps/types`** | Universal geospatial domain types, GeoJSON interfaces, camera & viewport models. |
| **`@modern-maps/validation`** | Runtime Zod validation schemas for locations, queries & inputs. |
| **`@modern-maps/geospatial`** | Mathematical geospatial algorithms (Turf.js wrapper, Haversine, bearing, bounding boxes, polygon containment). |
| **`@modern-maps/map-engine`** | MapLibre GL wrapper, viewport manager, camera transitions, drawing & measurement tools. |
| **`@modern-maps/ui`** | Radix UI + Tailwind CSS component library with specialized map control overlays. |
| **`@modern-maps/testing`** | Vitest configurations, MapLibre mocks & GeoJSON fixtures. |

---

## 🔒 Security Best Practices

1. **Client Bundles**: Never prefix private API keys (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`) with `NEXT_PUBLIC_`.
2. **PostGIS Queries**: Always parameterize inputs or execute spatial operations through RPC functions to prevent SQL injection.
3. **File Uploads**: Restrict storage bucket upload sizes and validate MIME types both client-side and via storage RLS policies.
4. **Realtime Channels**: Authenticate presence and broadcast channels using Supabase JWT tokens.

---

## 📄 License
MIT
