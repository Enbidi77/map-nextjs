import type { RouteRequest, RouteResponse, RoutingProvider } from './types.js';
import { OsrmRoutingProvider } from './providers/osrm.js';
import { MockRoutingProvider } from './providers/mock.js';

export interface RoutingServiceOptions {
  primaryProvider?: RoutingProvider;
  fallbackProvider?: RoutingProvider;
  enableCache?: boolean;
}

export class RoutingService {
  private _primaryProvider: RoutingProvider;
  private _fallbackProvider: RoutingProvider;
  private _cache = new Map<string, { response: RouteResponse; timestamp: number }>();
  private _cacheTtlMs = 1000 * 60 * 15; // 15 mins

  constructor(options: RoutingServiceOptions = {}) {
    this._primaryProvider = options.primaryProvider ?? new OsrmRoutingProvider();
    this._fallbackProvider = options.fallbackProvider ?? new MockRoutingProvider();
  }

  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    const key = this._getCacheKey(request);
    const cached = this._cache.get(key);
    if (cached && Date.now() - cached.timestamp < this._cacheTtlMs) {
      return cached.response;
    }

    try {
      const response = await this._primaryProvider.route(request);
      if (response.status === 'OK' && response.routes.length > 0) {
        this._cache.set(key, { response, timestamp: Date.now() });
        return response;
      }
      throw new Error(response.message || 'Primary routing failed');
    } catch {
      const fallbackResponse = await this._fallbackProvider.route(request);
      this._cache.set(key, { response: fallbackResponse, timestamp: Date.now() });
      return fallbackResponse;
    }
  }

  private _getCacheKey(req: RouteRequest): string {
    const coords = [req.origin, ...(req.waypoints || []), req.destination];
    const coordStr = coords.map(([lng, lat]) => `${lng.toFixed(5)},${lat.toFixed(5)}`).join(';');
    return `${req.mode || 'driving'}:${coordStr}:${req.alternatives ? 1 : 0}`;
  }

  clearCache(): void {
    this._cache.clear();
  }
}
