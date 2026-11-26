# Monorepo Packages Reference

The `packages/` directory contains 12 internal workspace packages under the `@modern-maps/*` scope.

| Package | Path | Description |
|---|---|---|
| `@modern-maps/config` | `packages/config` | Shared TypeScript configurations (`tsconfig.base.json`, `tsconfig.next.json`, `tsconfig.node.json`, `tsconfig.react.json`). |
| `@modern-maps/types` | `packages/types` | Universal domain types for coordinates, camera, map state, GeoJSON, places, and routes. |
| `@modern-maps/validation` | `packages/validation` | Zod runtime validation schemas for coordinates, places, search queries, and directions. |
| `@modern-maps/geospatial` | `packages/geospatial` | Geospatial algorithms built on Turf.js: distance, bearing, bounding boxes, polygon containment (`isPointInPolygon`), and formatting. |
| `@modern-maps/map-data` | `packages/map-data` | Basemap style definitions (OSM, CARTO, ESRI, OpenTopoMap), geocoding, directions, and places adapters. |
| `@modern-maps/map-engine` | `packages/map-engine` | MapLibre GL v5 wrapper (`MapLibreRenderer`), `LayerManager`, `MapContainer`, React hooks (`useMapInstance`, `useCamera`, `useLayer`), and measurement/drawing tools. |
| `@modern-maps/place-search` | `packages/place-search` | `PlaceSearchService` with `NominatimProvider`, `PhotonProvider`, category filtering, and TTL-based `SearchCache`. |
| `@modern-maps/routing` | `packages/routing` | `RoutingService` with `OsrmRoutingProvider`, `MockRoutingProvider` fallback, and 15-minute response caching. |
| `@modern-maps/database` | `packages/database` | Drizzle ORM schema, spatial/CRUD query modules, and multi-adapter client (`PostgresDatabaseAdapter`, `SupabaseDatabaseAdapter`, `InMemoryDatabaseAdapter`). |
| `@modern-maps/supabase` | `packages/supabase` | Typed Supabase client, error handling, query/mutation helpers, realtime sync (`featureSync`, `presence`, `realtimeManager`), and `storageManager`. |
| `@modern-maps/ui` | `packages/ui` | Radix UI + Tailwind CSS primitives and map-specific widgets (`SearchBar`, `LayerSelector`, `FloatingMapControls`, `NorthCompass`, `CoordinateBadge`, `PlaceCard`, `CollectionCard`, `MeasurementDrawingToolbar`, `ManeuverInstructionCard`, `CollapsibleSidebar`, `ThemeToggle`). |
| `@modern-maps/testing` | `packages/testing` | Shared Vitest base configuration (`vitest.base.config.ts`), MapLibre GL mocks, and geospatial test fixtures. |

---

## Common Workspace Commands

Run from the repository root (`d:\data\Doc\.content\map-nextjs` or project root):

```bash
# Install all workspace dependencies
pnpm install

# Build all packages and apps (via Turborepo)
pnpm turbo:build

# Run all unit/integration tests across packages
pnpm test

# Type-check all workspaces
pnpm typecheck

# Lint all workspaces
pnpm lint

# Format all TypeScript, JavaScript, JSON, and Markdown files
pnpm format
```
