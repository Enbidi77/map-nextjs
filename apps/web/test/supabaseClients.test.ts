import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  createClient,
  getBrowserSupabaseClient,
} from '../src/lib/supabase/client';

if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class MockWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;
    readyState = 1;
    binaryType = 'blob';
    bufferedAmount = 0;
    extensions = '';
    protocol = '';
    url = '';
    onopen = null;
    onclose = null;
    onerror = null;
    onmessage = null;
    constructor(url: string, _protocols?: string | string[]) {
      this.url = url;
    }
    close() {}
    send() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
  };
}

describe('Supabase Client Factories', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('provides default URL and anon key when env vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(getSupabaseUrl()).toBe('http://localhost:54321');
    expect(getSupabaseAnonKey()).toContain('placeholder-anon-key');
  });

  it('uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY when provided', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'custom-publishable-key';

    expect(getSupabaseUrl()).toBe('https://custom-project.supabase.co');
    expect(getSupabaseAnonKey()).toBe('custom-publishable-key');
  });

  it('creates browser Supabase client with expected methods', () => {
    const client = createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.from).toBeDefined();
    expect(client.channel).toBeDefined();
  });

  it('returns singleton browser client', () => {
    const client1 = getBrowserSupabaseClient();
    const client2 = getBrowserSupabaseClient();
    expect(client1).toBe(client2);
  });
});
