import type {
  Client,
  Favorite,
  Project,
  Task,
  TimeEntry,
  Workspace
} from './validation.js'

import { FileCacheManager } from './file-cache.js'
import {
  type DebugLogger,
  type TimeEntryPayload,
  TogglClient
} from './toggl-client.js'

export class CachedTogglClient extends TogglClient {
  private cache: FileCacheManager

  constructor(apiToken: string, logger?: DebugLogger) {
    super(apiToken, logger)
    this.cache = new FileCacheManager()
  }

  /**
   * Clears all cached data.
   */
  async clearCache(): Promise<void> {
    try {
      await this.cache.clear()
    } catch {
      // Silently ignore cache clear failures
    }
  }

  /**
   * Creates a new time entry and invalidates related cache entries.
   */
  override async createTimeEntry(workspaceId: number, timeEntry: TimeEntryPayload): Promise<TimeEntry> {
    const result = await super.createTimeEntry(workspaceId, timeEntry)

    // Invalidate current time entry cache since we just created a new one
    await this.cache.delete('current_time_entry')

    return result
  }

  /**
   * Gets cache statistics for debugging.
   */
  getCacheStats(): {
    cacheSize: number
    pendingRequests: number
  } {
    return this.cache.getStats()
  }

  /**
   * Fetches all clients for the authenticated user with caching.
   */
  override async getClients(): Promise<Client[]> {
    return this.cache.getOrFetch(
      'clients',
      () => super.getClients(),
      300_000 // 5 minutes
    )
  }

  /**
   * Fetches the current running time entry with short-term caching.
   */
  override async getCurrentTimeEntry(): Promise<null | TimeEntry> {
    return this.cache.getOrFetch(
      'current_time_entry',
      () => super.getCurrentTimeEntry(),
      30_000 // 30 seconds
    )
  }

  /**
   * Fetches all favorites for the authenticated user with caching.
   */
  override async getFavorites(): Promise<Favorite[]> {
    return this.cache.getOrFetch(
      'favorites',
      () => super.getFavorites(),
      300_000 // 5 minutes
    )
  }

  /**
   * Fetches all projects for the authenticated user with caching.
   */
  override async getProjects(): Promise<Project[]> {
    return this.cache.getOrFetch(
      'projects',
      () => super.getProjects(),
      300_000 // 5 minutes
    )
  }

  /**
   * Fetches all tasks for the authenticated user with caching.
   */
  override async getTasks(): Promise<Task[]> {
    return this.cache.getOrFetch(
      'tasks',
      () => super.getTasks(),
      300_000 // 5 minutes
    )
  }

  /**
   * Fetches all workspaces for the authenticated user with caching.
   */
  override async getWorkspaces(): Promise<Workspace[]> {
    return this.cache.getOrFetch(
      'workspaces',
      () => super.getWorkspaces(),
      300_000 // 5 minutes
    )
  }

  /**
   * Stops a running time entry and invalidates related cache entries.
   */
  override async stopTimeEntry(workspaceId: number, timeEntryId: number): Promise<boolean> {
    const result = await super.stopTimeEntry(workspaceId, timeEntryId)

    if (result) {
      // Invalidate current time entry cache since we just stopped the current entry
      await this.cache.delete('current_time_entry')
    }

    return result
  }

  /**
   * Updates an existing time entry and invalidates related cache entries.
   */
  override async updateTimeEntry(workspaceId: number, timeEntryId: number, updates: Partial<TimeEntryPayload>): Promise<TimeEntry> {
    const result = await super.updateTimeEntry(workspaceId, timeEntryId, updates)

    // Invalidate current time entry cache since the update might affect the current entry
    await this.cache.delete('current_time_entry')

    return result
  }

  // Non-cached methods inherit from parent class automatically
}