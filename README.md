# Modern Maps & Location Intelligence Platform

A high-performance, modular geospatial analytics and interactive mapping platform built on modern web standards, MapLibre GL, Next.js, PostGIS, and Turf.js.

## 🗺️ Monorepo Architecture

The platform is architected as a pnpm workspace orchestrated with Turborepo:

```
├── apps/
│   └── web/                   # Next.js 14+ interactive mapping web application
├── packages/
│   ├── config/                # Shared TypeScript, ESLint, and PostCSS configurations
│   ├── types/                 # Universal geospatial domain types & interfaces
│   ├── validation/            # Zod validation schemas for locations, queries & routes
│   ├── geospatial/            # Turf.js mathematical & geospatial algorithms wrapper
│   ├── map-engine/            # MapLibre GL wrapper, viewport manager, camera, layer engine
│   ├── ui/                    # Accessible UI component library & map widgets
│   └── testing/               # Vitest test configurations, shared mocks & fixture datasets
├── docker-compose.yml         # Local PostGIS 16 and Redis 7 services
└── turbo.json                 # Build pipeline orchestration
```

## 🚀 Quickstart

### Prerequisites
- **Node.js**: v20+ (recommended v22+)
- **pnpm**: v9+
- **Docker & Docker Compose**: for PostGIS and Redis

### 1. Installation
```bash
pnpm install
```

### 2. Infrastructure
Launch PostGIS 16-3.4 and Redis 7:
```bash
docker compose up -d
```

### 3. Build & Development
```bash
# Build all packages
pnpm build

# Start development servers
pnpm dev

# Run all test suites
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## 📦 Packages Overview

- **`@modern-maps/types`**: Type definitions for coordinates, bounding boxes, camera states, styles, places, and routing.
- **`@modern-maps/validation`**: Runtime validation using Zod for API endpoints, search inputs, and coordinates.
- **`@modern-maps/geospatial`**: Distance calculations (Haversine/Turf), bearings, point-in-polygon tests, bounding boxes, and coordinate formatters.
- **`@modern-maps/testing`**: Vitest utilities, MapLibre mock implementations, and real-world GeoJSON fixtures (San Francisco, Tokyo, Paris, New York).
- **`@modern-maps/ui`**: Radix UI + Tailwind CSS component library with specialized map control overlays.
- **`@modern-maps/map-engine`**: High-performance MapLibre GL layer management, camera transitions, and clustering.

## 📄 License
MIT
