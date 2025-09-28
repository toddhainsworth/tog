export interface CacheEntry<T> {
  data: T
  expiry: number
}

export interface CacheOptions {
  defaultTtl?: number
}

export class ClientCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultTtl: number
  private pendingRequests = new Map<string, Promise<unknown>>()

  constructor(options: CacheOptions = {}) {
    this.defaultTtl = options.defaultTtl ?? 300_000 // 5 minutes default
  }

  /**
   * Clears all cache entries.
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  /**
   * Deletes a specific cache entry.
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Deletes all cache entries matching a pattern.
   */
  deletePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Gets cached data if it exists and hasn't expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) {
      return undefined
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return undefined
    }

    return entry.data as T
  }

  /**
   * Gets data from cache or executes the request function with deduplication.
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending as Promise<T>
    }

    // Execute the request and cache the result
    const promise = fetchFn()
      .then(data => {
        this.set(key, data, ttl)
        this.pendingRequests.delete(key)
        return data
      })
      .catch(error => {
        this.pendingRequests.delete(key)
        throw error
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * Gets cache statistics for debugging.
   */
  getStats(): {
    cacheSize: number
    pendingRequests: number
  } {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size
    }
  }

  /**
   * Sets data in the cache with optional TTL.
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl ?? this.defaultTtl)
    this.cache.set(key, { data, expiry })
  }
}