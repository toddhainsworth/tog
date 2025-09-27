import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { CACHE_FILE_SYNC_DEBOUNCE_MS, DEFAULT_CACHE_MAX_ENTRIES, DEFAULT_CACHE_MAX_FILE_SIZE_BYTES } from './constants.js'

interface CacheEntry<T> {
  data: T
  expiresAt: number
  lastAccessed: number
}

interface FileCache {
  [key: string]: CacheEntry<unknown>
}

interface CacheOptions {
  maxEntries?: number
  maxFileSizeBytes?: number
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
  private lastFileSync = 0
  private lockPath: string
  private readonly maxEntries: number
  private readonly maxFileSizeBytes: number
  private memoryCache = new Map<string, CacheEntry<unknown>>()
  private pendingRequests = new Map<string, Promise<unknown>>()

  constructor(filename: string = '.togcache', options: CacheOptions = {}) {
    // Sanitize filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename)
    if (sanitizedFilename !== filename || filename.includes('..')) {
      throw new CacheError('Invalid cache filename: path traversal detected')
    }

    this.cachePath = path.join(os.homedir(), sanitizedFilename)
    this.lockPath = `${this.cachePath}.lock`
    this.maxEntries = options.maxEntries ?? DEFAULT_CACHE_MAX_ENTRIES
    this.maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_CACHE_MAX_FILE_SIZE_BYTES

    // Load initial cache into memory
    this.syncFromFile()
  }

  /**
   * Clears all cache entries
   */
  async clear(): Promise<void> {
    try {
      await this.acquireLock()

      try {
        await fs.promises.unlink(this.cachePath)
        // Clear memory cache immediately
        this.memoryCache.clear()
        this.lastFileSync = Date.now()
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw new CacheError('Failed to clear cache', error as Error)
        }

        // Still clear memory cache even if file doesn't exist
        this.memoryCache.clear()
        this.lastFileSync = Date.now()
      }
    } catch {
      // Silently fail cache clears
    } finally {
      await this.releaseLock()
    }
  }

  /**
   * Deletes a specific key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.atomicUpdate(cache => {
        delete cache[key]
      })
    } catch {
      // Silently fail deletions
    }
  }

  /**
   * Gets a value from cache, returns undefined if not found or expired
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.atomicUpdate(cache => {
        const entry = cache[key] as CacheEntry<T> | undefined

        if (!entry || entry.expiresAt <= Date.now()) {
          // Entry doesn't exist or expired, remove it
          delete cache[key]
          return
        }

        // Update last accessed time for LRU
        entry.lastAccessed = Date.now()
        return entry.data
      })
    } catch {
      // On error, return undefined (cache miss)
      return undefined
    }
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

    // Check for pending request
    const pending = this.pendingRequests.get(key) as Promise<T> | undefined
    if (pending) {
      return pending
    }

    // Start new request
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
   * Gets cache statistics using memory cache for immediate response
   */
  getStats(): { cacheSize: number; pendingRequests: number } {
    // Sync from file if needed (non-blocking)
    this.syncFromFile()

    // Clean expired entries from memory cache
    const now = Date.now()
    let validEntries = 0

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt > now) {
        validEntries++
      } else {
        // Clean expired entry from memory
        this.memoryCache.delete(key)
      }
    }

    return {
      cacheSize: validEntries,
      pendingRequests: this.pendingRequests.size
    }
  }

  /**
   * Sets a value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    try {
      await this.atomicUpdate(cache => {
        // Clean expired entries
        const cleanedCache = this.cleanExpiredEntries(cache)
        for (const k of Object.keys(cache)) delete cache[k]
        Object.assign(cache, cleanedCache)

        cache[key] = {
          data: value,
          expiresAt: Date.now() + ttlMs,
          lastAccessed: Date.now()
        }
      })
    } catch {
      // Silently fail cache writes to not break the application
    }
  }

  /**
   * Acquires a simple file lock with timeout
   */
  private async acquireLock(timeoutMs: number = 5000): Promise<void> {
    const startTime = Date.now()

    /* eslint-disable no-await-in-loop */
    while (Date.now() - startTime < timeoutMs) {
      try {
        await fs.promises.writeFile(this.lockPath, process.pid.toString(), { flag: 'wx' })
        return
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          throw new CacheError('Failed to acquire lock', error as Error)
        }

        // Check if lock is stale (older than 30 seconds)
        try {
          const lockStat = await fs.promises.stat(this.lockPath)
          if (Date.now() - lockStat.mtime.getTime() > 30_000) {
            await fs.promises.unlink(this.lockPath)
            continue
          }
        } catch {
          // Lock file doesn't exist anymore, continue
          continue
        }

        // Wait before retrying
        await new Promise<void>(resolve => {
          setTimeout(() => resolve(), 50)
        })
      }
    }
    /* eslint-enable no-await-in-loop */

    throw new CacheError('Failed to acquire lock: timeout')
  }

  /**
   * Performs atomic cache update with locking
   */
  private async atomicUpdate<T>(updateFn: (cache: FileCache) => Promise<T> | T): Promise<T> {
    await this.acquireLock()

    try {
      const cache = await this.loadCache()
      const result = await updateFn(cache)
      await this.saveCache(cache)
      return result
    } finally {
      await this.releaseLock()
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

  /**
   * Loads cache from file with error handling and syncs to memory
   */
  private async loadCache(): Promise<FileCache> {
    try {
      const content = await fs.promises.readFile(this.cachePath, 'utf8')
      const cache = JSON.parse(content) as FileCache

      // Check file size limits
      const stats = await fs.promises.stat(this.cachePath)
      if (stats.size > this.maxFileSizeBytes) {
        throw new CacheError(`Cache file too large: ${stats.size} bytes`)
      }

      // Sync to memory cache
      this.syncToMemoryCache(cache)
      this.lastFileSync = Date.now()

      return cache
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {} // File doesn't exist, return empty cache
      }

      if (error instanceof CacheError) {
        throw error
      }

      // File is corrupted, backup and start fresh
      try {
        const backupPath = `${this.cachePath}.corrupted.${Date.now()}`
        await fs.promises.copyFile(this.cachePath, backupPath)
      } catch {
        // Ignore backup failure
      }

      return {}
    }
  }

  /**
   * Releases the file lock
   */
  private async releaseLock(): Promise<void> {
    try {
      await fs.promises.unlink(this.lockPath)
    } catch {
      // Lock file might not exist, ignore
    }
  }

  /**
   * Saves cache to file atomically with error handling and syncs to memory
   */
  private async saveCache(cache: FileCache): Promise<void> {
    // Enforce entry limits
    const limitedCache = this.enforceMaxEntries(cache)

    const tempPath = `${this.cachePath}.tmp`

    try {
      await fs.promises.writeFile(tempPath, JSON.stringify(limitedCache, null, 2))
      await fs.promises.rename(tempPath, this.cachePath) // Atomic on most filesystems

      // Update memory cache after successful file write
      this.syncToMemoryCache(limitedCache)
      this.lastFileSync = Date.now()
    } catch (error) {
      // Clean up temp file
      try {
        await fs.promises.unlink(tempPath)
      } catch {
        // Ignore cleanup failure
      }

      throw new CacheError('Failed to save cache', error as Error)
    }
  }

  /**
   * Syncs from file if memory cache is stale
   */
  private syncFromFile(): void {
    // Don't sync more than once per second
    if (Date.now() - this.lastFileSync < CACHE_FILE_SYNC_DEBOUNCE_MS) {
      return
    }

    // Fire and forget sync - don't block operations
    this.loadCache().catch(() => {
      // Ignore sync failures
    })
  }

  /**
   * Syncs file cache data to memory cache for immediate access
   */
  private syncToMemoryCache(cache: FileCache): void {
    this.memoryCache.clear()
    for (const [key, entry] of Object.entries(cache)) {
      this.memoryCache.set(key, entry)
    }
  }
}