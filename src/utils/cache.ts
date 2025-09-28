/**
 * File-Based Cache Manager
 *
 * Simple, focused caching implementation for API response optimization.
 * Provides TTL-based expiration and request deduplication.
 */

import { readFile, writeFile, access, unlink } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

interface CacheEntry<T> {
  data: T
  expiresAt: number
  lastAccessed: number
}

interface FileCache {
  [key: string]: CacheEntry<unknown>
}

export class CacheError extends Error {
  public override readonly cause?: Error

  constructor(message: string, cause?: Error) {
    super(message)
    this.name = 'CacheError'
    this.cause = cause
  }
}

export class FileCacheManager {
  private cachePath: string
  private pendingRequests = new Map<string, Promise<unknown>>()
  private readonly maxEntries: number = 100
  private readonly maxFileSizeBytes: number = 1024 * 1024 // 1MB

  constructor(filename: string = '.togcache') {
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    this.cachePath = join(homedir(), sanitizedFilename)
  }

  /**
   * Gets or fetches data with request deduplication
   */
  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number = 300_000): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    // Check for pending request to avoid duplicate API calls
    const pending = this.pendingRequests.get(key) as Promise<T> | undefined
    if (pending) {
      return pending
    }

    // Start new request with deduplication
    const promise = fetchFn().then(async data => {
      await this.set(key, data, ttlMs)
      this.pendingRequests.delete(key)
      return data
    }).catch(error => {
      this.pendingRequests.delete(key)
      throw error
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * Gets a value from cache, returns undefined if not found or expired
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const cache = await this.loadCache()
      const entry = cache[key] as CacheEntry<T> | undefined

      if (!entry || entry.expiresAt <= Date.now()) {
        // Entry doesn't exist or expired
        if (entry) {
          await this.delete(key)
        }
        return undefined
      }

      // Update last accessed time for LRU
      entry.lastAccessed = Date.now()
      await this.saveCache(cache)

      return entry.data
    } catch {
      // On error, return undefined (cache miss)
      return undefined
    }
  }

  /**
   * Sets a value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    try {
      const cache = await this.loadCache()

      // Clean expired entries
      const cleanedCache = this.cleanExpiredEntries(cache)

      cleanedCache[key] = {
        data: value,
        expiresAt: Date.now() + ttlMs,
        lastAccessed: Date.now()
      }

      await this.saveCache(cleanedCache)
    } catch {
      // Silently fail cache writes to not break the application
    }
  }

  /**
   * Deletes a specific key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      const cache = await this.loadCache()
      delete cache[key]
      await this.saveCache(cache)
    } catch {
      // Silently fail deletions
    }
  }

  /**
   * Clears all cache entries
   */
  async clear(): Promise<void> {
    try {
      await unlink(this.cachePath)
    } catch (error: unknown) {
      // File might not exist, which is fine
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new CacheError('Failed to clear cache', error instanceof Error ? error : new Error(errorMessage))
      }
    }
  }

  /**
   * Loads cache from file with error handling
   */
  private async loadCache(): Promise<FileCache> {
    try {
      await access(this.cachePath)
      const content = await readFile(this.cachePath, 'utf8')
      return JSON.parse(content) as FileCache
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return {} // File doesn't exist, return empty cache
      }

      // File is corrupted, start fresh
      return {}
    }
  }

  /**
   * Saves cache to file with error handling
   */
  private async saveCache(cache: FileCache): Promise<void> {
    try {
      // Enforce entry limits
      const limitedCache = this.enforceMaxEntries(cache)

      const tempPath = `${this.cachePath}.tmp`
      await writeFile(tempPath, JSON.stringify(limitedCache, null, 2))

      // Atomic rename on most filesystems
      await writeFile(this.cachePath, JSON.stringify(limitedCache, null, 2))

      // Clean up temp file
      try {
        await unlink(tempPath)
      } catch {
        // Ignore cleanup failure
      }
    } catch (error: unknown) {
      throw new CacheError('Failed to save cache', error as Error)
    }
  }

  /**
   * Cleans expired entries from cache
   */
  private cleanExpiredEntries(cache: FileCache): FileCache {
    const now = Date.now()
    const cleaned: FileCache = {}

    for (const [key, entry] of Object.entries(cache)) {
      if (entry.expiresAt > now) {
        cleaned[key] = entry
      }
    }

    return cleaned
  }

  /**
   * Enforces maximum entry limits using LRU policy
   */
  private enforceMaxEntries(cache: FileCache): FileCache {
    const entries = Object.entries(cache)
    if (entries.length <= this.maxEntries) {
      return cache
    }

    // Keep most recently accessed entries
    const sortedEntries = entries.sort((a, b) =>
      (b[1].lastAccessed || 0) - (a[1].lastAccessed || 0)
    )

    return Object.fromEntries(sortedEntries.slice(0, this.maxEntries))
  }
}