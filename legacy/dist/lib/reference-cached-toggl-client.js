import { CachedFileStorage } from './cached-file-storage.js';
import { TogglClient } from './toggl-client.js';
// Cache TTL constants
const REFERENCE_DATA_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
/**
 * A cached Toggl client that only caches stable reference data.
 * Current time entries and other frequently changing data are never cached.
 */
export class ReferenceCachedTogglClient extends TogglClient {
    cache;
    constructor(apiToken, logger, cacheFilename) {
        super(apiToken, logger);
        this.cache = new CachedFileStorage(cacheFilename);
    }
    /**
     * Clears all cached data.
     */
    async clearCache() {
        await this.cache.clear();
    }
    /**
     * Fetches all clients with long-term caching (1 week).
     */
    async getClients() {
        return this.cache.getOrFetch('clients', () => super.getClients(), REFERENCE_DATA_TTL_MS);
    }
    /**
     * Fetches all favorites with long-term caching (1 week).
     */
    async getFavorites() {
        return this.cache.getOrFetch('favorites', () => super.getFavorites(), REFERENCE_DATA_TTL_MS);
    }
    /**
     * Fetches all projects with long-term caching (1 week).
     */
    async getProjects() {
        return this.cache.getOrFetch('projects', () => super.getProjects(), REFERENCE_DATA_TTL_MS);
    }
    /**
     * Fetches all tasks with long-term caching (1 week).
     */
    async getTasks() {
        return this.cache.getOrFetch('tasks', () => super.getTasks(), REFERENCE_DATA_TTL_MS);
    }
    /**
     * Fetches all workspaces with long-term caching (1 week).
     */
    async getWorkspaces() {
        return this.cache.getOrFetch('workspaces', () => super.getWorkspaces(), REFERENCE_DATA_TTL_MS);
    }
}
