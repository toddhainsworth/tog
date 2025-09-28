export interface CacheEntry<T> {
    data: T;
    expiry: number;
}
export interface CacheOptions {
    defaultTtl?: number;
}
export declare class ClientCache {
    private cache;
    private defaultTtl;
    private pendingRequests;
    constructor(options?: CacheOptions);
    /**
     * Clears all cache entries.
     */
    clear(): void;
    /**
     * Deletes a specific cache entry.
     */
    delete(key: string): void;
    /**
     * Deletes all cache entries matching a pattern.
     */
    deletePattern(pattern: string): void;
    /**
     * Gets cached data if it exists and hasn't expired.
     */
    get<T>(key: string): T | undefined;
    /**
     * Gets data from cache or executes the request function with deduplication.
     */
    getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T>;
    /**
     * Gets cache statistics for debugging.
     */
    getStats(): {
        cacheSize: number;
        pendingRequests: number;
    };
    /**
     * Sets data in the cache with optional TTL.
     */
    set<T>(key: string, data: T, ttl?: number): void;
}
