import type { DirectionsRequest, DirectionsResponse } from '@modern-maps/types';
import type { DirectionsProvider } from './types.js';

export interface SupabaseDirectionsConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  functionName?: string;
}

export class SupabaseDirectionsAdapter implements DirectionsProvider {
  readonly name = 'supabase';
  private functionUrl: string;
  private apiKey: string;

  constructor(config: SupabaseDirectionsConfig) {
    const fn = config.functionName || 'directions';
    this.functionUrl = `${config.supabaseUrl.replace(/\/+$/, '')}/functions/v1/${fn}`;
    this.apiKey = config.supabaseAnonKey;
  }

  async getRoute(request: DirectionsRequest): Promise<DirectionsResponse> {
    try {
      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          apikey: this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        return {
          routes: [],
          status: 'ERROR',
          errorMessage: `Supabase directions error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      return data as DirectionsResponse;
    } catch (err) {
      return {
        routes: [],
        status: 'ERROR',
        errorMessage: err instanceof Error ? err.message : 'Unknown routing error',
      };
    }
  }
}
