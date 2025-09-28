import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export class CachedFileStorage {
    cachePath;
    pendingRequests = new Map();
    constructor(filename = '.togcache') {
        this.cachePath = path.join(os.homedir(), filename);
    }
    /**
     * Clears all cache entries
     */
    async clear() {
        try {
            await fs.promises.unlink(this.cachePath);
        }
        catch {
            // Ignore if file doesn't exist
        }
        // Clear in-memory pending requests
        this.pendingRequests.clear();
    }
    /**
     * Gets a value from cache, returns undefined if not found or expired
     */
    async get(key) {
        try {
            const cache = await this.loadCache();
            const entry = cache[key];
            if (!entry || entry.expiresAt <= Date.now()) {
                return undefined;
            }
            return entry.data;
        }
        catch {
            return undefined;
        }
    }
    /**
     * Gets or fetches data with request deduplication
     */
    async getOrFetch(key, fetchFn, ttlMs) {
        // Check cache first
        const cached = await this.get(key);
        if (cached !== undefined) {
            return cached;
        }
        // Check for pending request
        const pending = this.pendingRequests.get(key);
        if (pending) {
            return pending;
        }
        // Start new request
        const promise = fetchFn().then(async (data) => {
            await this.set(key, data, ttlMs);
            this.pendingRequests.delete(key);
            return data;
        }).catch(error => {
            this.pendingRequests.delete(key);
            throw error;
        });
        this.pendingRequests.set(key, promise);
        return promise;
    }
    /**
     * Sets a value in cache with TTL
     */
    async set(key, value, ttlMs) {
        try {
            const cache = await this.loadCache();
            cache[key] = {
                data: value,
                expiresAt: Date.now() + ttlMs
            };
            await this.saveCache(cache);
        }
        catch {
            // Silently fail cache writes
        }
    }
    /**
     * Loads cache from file
     */
    async loadCache() {
        try {
            const content = await fs.promises.readFile(this.cachePath, 'utf8');
            return JSON.parse(content);
        }
        catch {
            return {};
        }
    }
    /**
     * Saves cache to file
     */
    async saveCache(cache) {
        await fs.promises.writeFile(this.cachePath, JSON.stringify(cache, null, 2));
    }
}
