import { FileCacheManager } from './file-cache.js';
import { TogglClient } from './toggl-client.js';
export class CachedTogglClient extends TogglClient {
    cache;
    constructor(apiToken, logger) {
        super(apiToken, logger);
        this.cache = new FileCacheManager();
    }
    /**
     * Clears all cached data.
     */
    async clearCache() {
        try {
            await this.cache.clear();
        }
        catch {
            // Silently ignore cache clear failures
        }
    }
    /**
     * Creates a new time entry and invalidates related cache entries.
     */
    async createTimeEntry(workspaceId, timeEntry) {
        const result = await super.createTimeEntry(workspaceId, timeEntry);
        // Invalidate current time entry cache since we just created a new one
        await this.cache.delete('current_time_entry');
        return result;
    }
    /**
     * Gets cache statistics for debugging.
     */
    getCacheStats() {
        return this.cache.getStats();
    }
    /**
     * Fetches all clients for the authenticated user with caching.
     */
    async getClients() {
        return this.cache.getOrFetch('clients', () => super.getClients(), 300_000 // 5 minutes
        );
    }
    /**
     * Fetches the current running time entry with short-term caching.
     */
    async getCurrentTimeEntry() {
        return this.cache.getOrFetch('current_time_entry', () => super.getCurrentTimeEntry(), 30_000 // 30 seconds
        );
    }
    /**
     * Fetches all favorites for the authenticated user with caching.
     */
    async getFavorites() {
        return this.cache.getOrFetch('favorites', () => super.getFavorites(), 300_000 // 5 minutes
        );
    }
    /**
     * Fetches all projects for the authenticated user with caching.
     */
    async getProjects() {
        return this.cache.getOrFetch('projects', () => super.getProjects(), 300_000 // 5 minutes
        );
    }
    /**
     * Fetches all tasks for the authenticated user with caching.
     */
    async getTasks() {
        return this.cache.getOrFetch('tasks', () => super.getTasks(), 300_000 // 5 minutes
        );
    }
    /**
     * Fetches all workspaces for the authenticated user with caching.
     */
    async getWorkspaces() {
        return this.cache.getOrFetch('workspaces', () => super.getWorkspaces(), 300_000 // 5 minutes
        );
    }
    /**
     * Stops a running time entry and invalidates related cache entries.
     */
    async stopTimeEntry(workspaceId, timeEntryId) {
        const result = await super.stopTimeEntry(workspaceId, timeEntryId);
        if (result) {
            // Invalidate current time entry cache since we just stopped the current entry
            await this.cache.delete('current_time_entry');
        }
        return result;
    }
    /**
     * Updates an existing time entry and invalidates related cache entries.
     */
    async updateTimeEntry(workspaceId, timeEntryId, updates) {
        const result = await super.updateTimeEntry(workspaceId, timeEntryId, updates);
        // Invalidate current time entry cache since the update might affect the current entry
        await this.cache.delete('current_time_entry');
        return result;
    }
}
