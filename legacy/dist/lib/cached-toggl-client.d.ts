import type { Client, Favorite, Project, Task, TimeEntry, Workspace } from './validation.js';
import { type DebugLogger, type TimeEntryPayload, TogglClient } from './toggl-client.js';
export declare class CachedTogglClient extends TogglClient {
    private cache;
    constructor(apiToken: string, logger?: DebugLogger);
    /**
     * Clears all cached data.
     */
    clearCache(): Promise<void>;
    /**
     * Creates a new time entry and invalidates related cache entries.
     */
    createTimeEntry(workspaceId: number, timeEntry: TimeEntryPayload): Promise<TimeEntry>;
    /**
     * Gets cache statistics for debugging.
     */
    getCacheStats(): {
        cacheSize: number;
        pendingRequests: number;
    };
    /**
     * Fetches all clients for the authenticated user with caching.
     */
    getClients(): Promise<Client[]>;
    /**
     * Fetches the current running time entry with short-term caching.
     */
    getCurrentTimeEntry(): Promise<null | TimeEntry>;
    /**
     * Fetches all favorites for the authenticated user with caching.
     */
    getFavorites(): Promise<Favorite[]>;
    /**
     * Fetches all projects for the authenticated user with caching.
     */
    getProjects(): Promise<Project[]>;
    /**
     * Fetches all tasks for the authenticated user with caching.
     */
    getTasks(): Promise<Task[]>;
    /**
     * Fetches all workspaces for the authenticated user with caching.
     */
    getWorkspaces(): Promise<Workspace[]>;
    /**
     * Stops a running time entry and invalidates related cache entries.
     */
    stopTimeEntry(workspaceId: number, timeEntryId: number): Promise<boolean>;
    /**
     * Updates an existing time entry and invalidates related cache entries.
     */
    updateTimeEntry(workspaceId: number, timeEntryId: number, updates: Partial<TimeEntryPayload>): Promise<TimeEntry>;
}
