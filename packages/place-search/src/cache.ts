export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SearchCache<T> {
  private _store = new Map<string, CacheEntry<T>>();
  private _maxSize: number;
  private _ttlMs: number;

  constructor(options: { maxSize?: number; ttlMs?: number } = {}) {
    this._maxSize = options.maxSize ?? 500;
    this._ttlMs = options.ttlMs ?? 1000 * 60 * 10; // 10 minutes default
  }

  get(key: string): T | undefined {
    const entry = this._store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return undefined;
    }

    // Refresh LRU order
    this._store.delete(key);
    this._store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this._store.size >= this._maxSize) {
      const oldestKey = this._store.keys().next().value;
      if (oldestKey) this._store.delete(oldestKey);
    }

    this._store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this._ttlMs),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this._store.clear();
  }

  get size(): number {
    return this._store.size;
  }
}
