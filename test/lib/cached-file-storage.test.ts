import { expect } from 'chai'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { CachedFileStorage } from '../../src/lib/cached-file-storage.js'

// Test constants
const TEST_TTL_MS = 60_000 // 1 minute - sufficient for tests

const createSimpleFetchFn = (value: string) => {
  let fetchCalled = false
  const fetchFn = async () => {
    fetchCalled = true
    return value
  }

  return { fetchFn, getFetchCalled: () => fetchCalled }
}

const createSyncFetchFn = (value: string) => {
  let fetchCallCount = 0
  const fetchFn = async () => {
    fetchCallCount++
    return value
  }

  return {
    fetchFn,
    getFetchCallCount: () => fetchCallCount
  }
}

const createErrorFetchFn = (errorMessage: string) => async () => {
  throw new Error(errorMessage)
}

describe('CachedFileStorage', () => {
  let cache: CachedFileStorage
  let testCachePath: string

  beforeEach(() => {
    // Use unique cache file for each test
    const testFilename = `test-cache-${Date.now()}-${Math.random().toString(36).slice(7)}`
    testCachePath = path.join(os.tmpdir(), testFilename)
    cache = new CachedFileStorage(testFilename)
  })

  afterEach(async () => {
    // Clean up test cache file
    try {
      await fs.promises.unlink(testCachePath)
    } catch {
      // Ignore if file doesn't exist
    }
  })

  describe('basic operations', () => {
    it('should store and retrieve data', async () => {
      await cache.set('test-key', { value: 'test-data' }, TEST_TTL_MS)

      const result = await cache.get('test-key')

      expect(result).to.deep.equal({ value: 'test-data' })
    })

    it('should return undefined for non-existent keys', async () => {
      const result = await cache.get('non-existent')

      expect(result).to.be.undefined
    })

    it('should clear all cache entries', async () => {
      await cache.set('key1', 'value1', TEST_TTL_MS)
      await cache.set('key2', 'value2', TEST_TTL_MS)

      await cache.clear()

      expect(await cache.get('key1')).to.be.undefined
      expect(await cache.get('key2')).to.be.undefined
    })
  })

  describe('TTL (Time To Live)', () => {
    it('should respect TTL and expire entries', async () => {
      await cache.set('short-lived', 'data', -1) // Already expired TTL

      const result = await cache.get('short-lived')
      expect(result).to.be.undefined
    })

    it('should not expire before TTL', async () => {
      await cache.set('long-lived', 'data', TEST_TTL_MS)

      const result = await cache.get('long-lived')
      expect(result).to.equal('data')
    })
  })

  describe('getOrFetch with request deduplication', () => {

    it('should fetch data when not cached', async () => {
      const { fetchFn, getFetchCalled } = createSimpleFetchFn('fetched-data')

      const result = await cache.getOrFetch('key', fetchFn, TEST_TTL_MS)

      expect(result).to.equal('fetched-data')
      expect(getFetchCalled()).to.be.true
    })

    it('should return cached data without fetching', async () => {
      await cache.set('cached-key', 'cached-data', TEST_TTL_MS)

      const { fetchFn, getFetchCalled } = createSimpleFetchFn('fetched-data')

      const result = await cache.getOrFetch('cached-key', fetchFn, TEST_TTL_MS)

      expect(result).to.equal('cached-data')
      expect(getFetchCalled()).to.be.false
    })

    it('should deduplicate concurrent requests', async () => {
      const { fetchFn, getFetchCallCount } = createSyncFetchFn('fetched-data')

      // Start multiple concurrent requests for the same key
      const results = await Promise.all([
        cache.getOrFetch('concurrent-key', fetchFn, TEST_TTL_MS),
        cache.getOrFetch('concurrent-key', fetchFn, TEST_TTL_MS),
        cache.getOrFetch('concurrent-key', fetchFn, TEST_TTL_MS)
      ])

      // All should return the same result
      expect(results).to.deep.equal(['fetched-data', 'fetched-data', 'fetched-data'])

      // But fetch should only have been called once due to deduplication
      expect(getFetchCallCount()).to.equal(1)
    })

    it('should handle fetch errors', async () => {
      const fetchFn = createErrorFetchFn('Fetch failed')

      try {
        await cache.getOrFetch('error-key', fetchFn, TEST_TTL_MS)
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).to.be.instanceOf(Error)
        expect((error as Error).message).to.equal('Fetch failed')
      }
    })
  })

  describe('file persistence', () => {
    it('should persist data across cache instances', async () => {
      const filename = `persist-test-${Date.now()}`
      const cache1 = new CachedFileStorage(filename)

      await cache1.set('persist-key', 'persist-value', TEST_TTL_MS)

      // Create new cache instance with same file
      const cache2 = new CachedFileStorage(filename)
      const result = await cache2.get('persist-key')

      expect(result).to.equal('persist-value')

      // Cleanup
      await cache1.clear()
    })

    it('should handle missing cache file gracefully', async () => {
      const result = await cache.get('missing-key')
      expect(result).to.be.undefined
    })
  })
})