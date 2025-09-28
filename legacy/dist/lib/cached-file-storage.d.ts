export declare class CachedFileStorage {
    private cachePath;
    private pendingRequests;
    constructor(filename?: string);
    /**
     * Clears all cache entries
     */
    clear(): Promise<void>;
    /**
     * Gets a value from cache, returns undefined if not found or expired
     */
    get<T>(key: string): Promise<T | undefined>;
    /**
     * Gets or fetches data with request deduplication
     */
    getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number): Promise<T>;
    /**
     * Sets a value in cache with TTL
     */
    set<T>(key: string, value: T, ttlMs: number): Promise<void>;
    /**
     * Loads cache from file
     */
    private loadCache;
    /**
     * Saves cache to file
     */
    private saveCache;
}
