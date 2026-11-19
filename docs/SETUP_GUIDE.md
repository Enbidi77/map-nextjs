# Modern Maps Platform — Setup & Operating Guide

A comprehensive technical summary of configurations, architecture components, database migrations, and operational workflows completed for the **Modern Maps & Location Intelligence Platform**.

---

## 1. System Architecture Overview

```mermaid
flowchart TD
    subgraph Client["Frontend Application (apps/web)"]
        UI["Map UI & Layout (@modern-maps/ui)"]
        MapComp["InteractiveMap / MapContainer"]
        AuthComp["AuthProvider (@supabase/ssr)"]
        RTComp["Realtime Hooks (Live Collab / Location)"]
    end

    subgraph Engine["Map Engine (@modern-maps/map-engine)"]
        MLRenderer["MapLibreRenderer (MapLibre GL v5.1)"]
        StyleProv["MapStyleProvider"]
        Layers["Layer & Marker Managers"]
    end

    subgraph Basemaps["Basemap Providers (Zero-Key)"]
        OSM["OpenStreetMap (Streets)"]
        CARTO["CARTO (Light, Dark, Voyager)"]
        ESRI["ESRI World Imagery (Satellite)"]
        Topo["OpenTopoMap (Terrain / Outdoors)"]
    end

    subgraph Backend["Remote Supabase Cloud (mrlxiodeuuallclssqai)"]
        SupaAuth["Supabase Auth (SSR Cookie Sessions)"]
        Postgres["PostgreSQL 17 + PostGIS 3.4"]
        Storage["Storage Buckets (Photos, GeoJSON, etc.)"]
        Realtime["Supabase Realtime (Publication Engine)"]
    end

    MapComp --> MLRenderer
    MLRenderer --> StyleProv --> Basemaps
    AuthComp --> SupaAuth
    RTComp --> Realtime
    Client --> Postgres
    Client --> Storage
```

---

## 2. Map Rendering Engine

* **Core Library:** [MapLibre GL JS](https://maplibre.org/) (`v5.1.0`).
* **Package:** `@modern-maps/map-engine` (in [MapLibreRenderer.ts](file:///d:/data/Doc/.content/map-nextjs/packages/map-engine/src/renderer/MapLibreRenderer.ts#L1-L50)).
* **React Integration:** Managed through [MapContainer.tsx](file:///d:/data/Doc/.content/map-nextjs/packages/map-engine/src/react/MapContainer.tsx#L43-L70) and mounted into the web application via [InteractiveMap.tsx](file:///d:/data/Doc/.content/map-nextjs/apps/web/src/components/map/InteractiveMap.tsx#L4-L26).
* **Styles Available (No API keys required):**
  * `streets` *(default)*: OpenStreetMap raster tiles
  * `light`: CARTO Positron
  * `dark`: CARTO Dark Matter
  * `satellite`: ESRI World Imagery
  * `terrain` / `outdoors`: OpenTopoMap elevation contours
  * `navigation`: CARTO Voyager

---

## 3. Supabase Integration & Credentials

The repository is linked directly to your remote Supabase instance:
* **Project Reference:** `mrlxiodeuuallclssqai` (*"enbid coding"*)
* **API URL:** `https://mrlxiodeuuallclssqai.supabase.co`
* **Local CLI Link:** Successfully connected via `supabase link --project-ref mrlxiodeuuallclssqai`.

### Environment Files
Both root [.env.local](file:///d:/data/Doc/.content/map-nextjs/.env.local) and [apps/web/.env.local](file:///d:/data/Doc/.content/map-nextjs/apps/web/.env.local) are configured with:

| Environment Variable | Description | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mrlxiodeuuallclssqai.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side & SSR JWT token | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Mirror of anon key | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Administrative secret key | Server-side only |
| `SUPABASE_PROJECT_ID` | `mrlxiodeuuallclssqai` | CLI & Backend |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.mrlxiodeuuallclssqai.supabase.co:5432/postgres` | Server-side only |

---

## 4. Applied Migrations & Database State

All 5 core migrations are pushed and active on the remote database:

| Migration File | Description | Status |
|---|---|---|
| [20261119000000_enable_postgis.sql](file:///d:/data/Doc/.content/map-nextjs/supabase/migrations/20261119000000_enable_postgis.sql) | Enables `postgis`, `pgcrypto`, `uuid-ossp` extensions | ✅ Applied |
| [20261119000001_initial_schema.sql](file:///d:/data/Doc/.content/map-nextjs/supabase/migrations/20261119000001_initial_schema.sql) | Core entities: `places`, `collections`, `user_profiles`, `user_map_features`, `location_shares` | ✅ Applied |
| [20261119000002_postgis_indexes_and_functions.sql](file:///d:/data/Doc/.content/map-nextjs/supabase/migrations/20261119000002_postgis_indexes_and_functions.sql) | GIST spatial indexes and RPCs (`nearby_saved_places`, `features_in_viewport`) | ✅ Applied |
| [20261119000003_row_level_security.sql](file:///d:/data/Doc/.content/map-nextjs/supabase/migrations/20261119000003_row_level_security.sql) | Multi-tenant Row-Level Security policies | ✅ Applied |
| [20261119000004_storage_and_realtime.sql](file:///d:/data/Doc/.content/map-nextjs/supabase/migrations/20261119000004_storage_and_realtime.sql) | Provisions 4 Storage buckets, object RLS, and Realtime publications | ✅ Applied |

### Key Compatibility Fixes Implemented:
1. **[config.toml](file:///d:/data/Doc/.content/map-nextjs/supabase/config.toml):** Synchronized PostgreSQL major version to `17` and removed CLI-incompatible port keys.
2. **[20261119000001_initial_schema.sql](file:///d:/data/Doc/.content/map-nextjs/supabase/migrations/20261119000001_initial_schema.sql#L253):** Qualified `extensions.gen_random_bytes(16)` so location tokens generate reliably regardless of session search path.
3. **[20261119000004_storage_and_realtime.sql](file:///d:/data/Doc/.content/map-nextjs/supabase/migrations/20261119000004_storage_and_realtime.sql#L50-L75):** Omitted redundant `ALTER TABLE storage.objects ENABLE RLS`, respecting Supabase's pre-configured role permissions.

---

## 5. Storage Buckets Configuration

The following buckets are provisioned with Row-Level Security policies on your remote Supabase project:

| Bucket Name | Public Access | Max File Size | Allowed Types |
|---|---|---|---|
| `place-photos` | **Yes** | 10 MiB | `image/jpeg`, `image/png`, `image/webp` |
| `collection-covers` | **Yes** | 10 MiB | `image/jpeg`, `image/png`, `image/webp` |
| `geojson-imports` | **No** (Owner-only) | 50 MiB | `application/geo+json`, `application/json` |
| `map-attachments` | **No** (Owner-only) | 50 MiB | `application/pdf`, `text/csv`, `application/zip` |

---

## 6. Local Development Runbook

### Starting the Development Server
From the root directory:
```bash
# 1. Install all monorepo dependencies
pnpm install

# 2. Run the Next.js development server
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Verifying Migrations & Schema
```bash
# Check remote vs local migration status
supabase migration list

# Re-generate TypeScript database types from remote schema
supabase gen types typescript --linked > packages/supabase/src/types/database.types.ts
```

---

## 7. Recommended Dashboard Configuration

To complete the authentication setup in your [Supabase Dashboard](https://supabase.com/dashboard/project/mrlxiodeuuallclssqai):

1. **URL Configuration:**
   * Go to **Authentication** → **URL Configuration**.
   * Set **Site URL** to `http://localhost:3000`.
   * Add to **Redirect URLs**:
     * `http://localhost:3000/**`
     * `http://localhost:3000/auth/callback`
2. **Email Verification:**
   * Under **Authentication** → **Providers** → **Email**, disable **"Confirm email"** during active development so new user registrations can test features immediately.
3. **Optional Demo Data:**
   * If you'd like sample points of interest, collections, and demo profiles in your database, execute [supabase/seed.sql](file:///d:/data/Doc/.content/map-nextjs/supabase/seed.sql) in the dashboard **SQL Editor**.
