# Swarm Agents Architecture & Workflow Guide

This document describes the multi-agent swarm collaboration protocol, agent responsibilities, and workspace ownership rules for the **Modern Maps Platform**.

## 🤖 Swarm Roles & Responsibilities

| Agent | Ownership | Responsibilities |
|---|---|---|
| **`@coordinator`** | Swarm Orchestration | Decomposes goals, manages roster, dispatches tasks, monitors progress, and handles integration verification. |
| **`@scaffold`** | Root & Foundational Packages | Initializes pnpm monorepo root, `turbo.json`, `tsconfig.base.json`, `eslint.config.mjs`, Docker config, `@modern-maps/config`, `@modern-maps/types`, `@modern-maps/validation`, `@modern-maps/geospatial`, and `@modern-maps/testing`. |
| **`@engine`** | `packages/map-engine` | Implements MapLibre GL wrapper, MapRenderer, CameraState, MapStyleProvider, LayerManager, React hooks (`useMapInstance`, `useCamera`, `useLayer`), and 2D/3D controls. |
| **`@ui`** | `packages/ui` | Implements Tailwind + Radix UI components, theme switching, floating map controls, search inputs, responsive sidebars, layer pickers, and coordinate badges. |
| **`@app`** | `apps/web` | Integrates `map-engine` and `ui` into a full-featured, responsive geospatial Next.js application with routing, search, layers, and telemetry. |
| **`@monitor`** | Swarm Health | Monitors message board for stalls or deadlocks and unblocks workers when needed. |

## 📐 Conventions & Rules

1. **Monorepo Boundaries**:
   - Each package must declare its dependencies explicitly in its own `package.json`.
   - Internal packages use `workspace:*` references.
   - Root `turbo.json` coordinates task execution order across packages.
2. **TypeScript**:
   - Strict mode enabled everywhere (`"strict": true`, `"noImplicitAny": true`).
   - Shared config extends `@modern-maps/config/tsconfig.base.json`.
3. **Testing**:
   - Every package exposes a `test` script running Vitest.
   - Core geospatial algorithms must maintain 100% test coverage.
4. **Communication Protocol**:
   - Asynchronous message board using `post_message` and `swarm_wait`.
   - Mention target agents explicitly (`@agent`) to wake them.
   - Post concrete results and interfaces upon milestone completion.
