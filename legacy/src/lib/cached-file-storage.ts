import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

interface FileCache {
  [key: string]: CacheEntry<unknown>
}

export class CachedFileStorage {
  private cachePath: string
  private pendingRequests = new Map<string, Promise<unknown>>()

  constructor(filename: string = '.togcache') {
    this.cachePath = path.join(os.homedir(), filename)
  }

  /**
   * Clears all cache entries
   */
  async clear(): Promise<void> {
    try {
      await fs.promises.unlink(this.cachePath)
    } catch {
      // Ignore if file doesn't exist
    }

    // Clear in-memory pending requests
    this.pendingRequests.clear()
  }

  /**
   * Gets a value from cache, returns undefined if not found or expired
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const cache = await this.loadCache()
      const entry = cache[key] as CacheEntry<T> | undefined

      if (!entry || entry.expiresAt <= Date.now()) {
        return undefined
      }

      return entry.data
    } catch {
      return undefined
    }
  }

  /**
   * Gets or fetches data with request deduplication
   */
  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number): Promise<T> {
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
   * Sets a value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    try {
      const cache = await this.loadCache()

      cache[key] = {
        data: value,
        expiresAt: Date.now() + ttlMs
      }

      await this.saveCache(cache)
    } catch {
      // Silently fail cache writes
    }
  }

  /**
   * Loads cache from file
   */
  private async loadCache(): Promise<FileCache> {
    try {
      const content = await fs.promises.readFile(this.cachePath, 'utf8')
      return JSON.parse(content) as FileCache
    } catch {
      return {}
    }
  }

  /**
   * Saves cache to file
   */
  private async saveCache(cache: FileCache): Promise<void> {
    await fs.promises.writeFile(this.cachePath, JSON.stringify(cache, null, 2))
  }
}