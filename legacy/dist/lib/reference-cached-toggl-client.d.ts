import type { Client, Favorite, Project, Task, Workspace } from './validation.js';
import { type DebugLogger, TogglClient } from './toggl-client.js';
/**
 * A cached Toggl client that only caches stable reference data.
 * Current time entries and other frequently changing data are never cached.
 */
export declare class ReferenceCachedTogglClient extends TogglClient {
    private cache;
    constructor(apiToken: string, logger?: DebugLogger, cacheFilename?: string);
    /**
     * Clears all cached data.
     */
    clearCache(): Promise<void>;
    /**
     * Fetches all clients with long-term caching (1 week).
     */
    getClients(): Promise<Client[]>;
    /**
     * Fetches all favorites with long-term caching (1 week).
     */
    getFavorites(): Promise<Favorite[]>;
    /**
     * Fetches all projects with long-term caching (1 week).
     */
    getProjects(): Promise<Project[]>;
    /**
     * Fetches all tasks with long-term caching (1 week).
     */
    getTasks(): Promise<Task[]>;
    /**
     * Fetches all workspaces with long-term caching (1 week).
     */
    getWorkspaces(): Promise<Workspace[]>;
}
