interface CacheOptions {
    maxEntries?: number;
    maxFileSizeBytes?: number;
}
export declare class CacheError extends Error {
    readonly cause?: Error;
    constructor(message: string, cause?: Error);
}
export declare class FileCacheManager {
    private cachePath;
    private lastFileSync;
    private lockPath;
    private readonly maxEntries;
    private readonly maxFileSizeBytes;
    private memoryCache;
    private pendingRequests;
    constructor(filename?: string, options?: CacheOptions);
    /**
     * Clears all cache entries
     */
    clear(): Promise<void>;
    /**
     * Deletes a specific key from cache
     */
    delete(key: string): Promise<void>;
    /**
     * Gets a value from cache, returns undefined if not found or expired
     */
    get<T>(key: string): Promise<T | undefined>;
    /**
     * Gets or fetches data with request deduplication
     */
    getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlMs?: number): Promise<T>;
    /**
     * Gets cache statistics using memory cache for immediate response
     */
    getStats(): {
        cacheSize: number;
        pendingRequests: number;
    };
    /**
     * Sets a value in cache with TTL
     */
    set<T>(key: string, value: T, ttlMs: number): Promise<void>;
    /**
     * Acquires a simple file lock with timeout
     */
    private acquireLock;
    /**
     * Performs atomic cache update with locking
     */
    private atomicUpdate;
    /**
     * Cleans expired entries from cache
     */
    private cleanExpiredEntries;
    /**
     * Enforces maximum entry limits using LRU policy
     */
    private enforceMaxEntries;
    /**
     * Loads cache from file with error handling and syncs to memory
     */
    private loadCache;
    /**
     * Releases the file lock
     */
    private releaseLock;
    /**
     * Saves cache to file atomically with error handling and syncs to memory
     */
    private saveCache;
    /**
     * Syncs from file if memory cache is stale
     */
    private syncFromFile;
    /**
     * Syncs file cache data to memory cache for immediate access
     */
    private syncToMemoryCache;
}
export {};
