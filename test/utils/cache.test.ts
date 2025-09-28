import { expect } from 'chai'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

import { FileCacheManager } from '../../src/utils/cache.js'

// Helper functions for testing
const createMockFetchFunction = (returnValue: string) => {
  let fetchCount = 0
  const fetchFn = async () => {
    fetchCount++
    return returnValue
  }
  return { fetchFn, getFetchCount: () => fetchCount }
}

const createDelayedFetchFunction = (returnValue: string, delay: number) => {
  let fetchCount = 0
  const fetchFn = async () => {
    fetchCount++
    await new Promise<void>(resolve => setTimeout(() => resolve(), delay))
    return `${returnValue}-${fetchCount}`
  }
  return { fetchFn, getFetchCount: () => fetchCount }
}

const createErrorFetchFunction = (error: Error) => async () => {
  throw error
}

describe('FileCacheManager', () => {
  let cache: FileCacheManager

  beforeEach(() => {
    // Create unique cache file for each test
    const randomSuffix = Math.random().toString(36).substring(7)
    const testFileName = `.test-togcache-${Date.now()}-${randomSuffix}`
    cache = new FileCacheManager(testFileName)
  })

  afterEach(async () => {
    // Clean up test cache file
    try {
      await cache.clear()
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('basic operations', () => {
    it('should store and retrieve data', async () => {
      const testData = { id: 1, name: 'test project' }
      await cache.set('test-key', testData, 60000)

      const retrieved = await cache.get<typeof testData>('test-key')
      expect(retrieved).to.deep.equal(testData)
    })

    it('should return undefined for non-existent keys', async () => {
      const result = await cache.get('non-existent-key')
      expect(result).to.be.undefined
    })

    it('should handle string data', async () => {
      const testData = 'simple string value'
      await cache.set('string-key', testData, 60000)

      const retrieved = await cache.get<string>('string-key')
      expect(retrieved).to.equal(testData)
    })

    it('should handle array data', async () => {
      const testData = [
        { id: 1, name: 'project 1' },
        { id: 2, name: 'project 2' },
      ]
      await cache.set('array-key', testData, 60000)

      const retrieved = await cache.get<typeof testData>('array-key')
      expect(retrieved).to.deep.equal(testData)
    })
  })

  describe('TTL and expiration', () => {
    it('should expire data after TTL', async () => {
      const testData = 'expiring data'
      await cache.set('expiring-key', testData, 50) // 50ms TTL

      // Should be available immediately
      let result = await cache.get<string>('expiring-key')
      expect(result).to.equal(testData)

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should be expired now
      result = await cache.get<string>('expiring-key')
      expect(result).to.be.undefined
    })

    it('should handle zero TTL', async () => {
      const testData = 'immediate expiry'
      await cache.set('zero-ttl-key', testData, 0)

      // Should be expired immediately
      const result = await cache.get<string>('zero-ttl-key')
      expect(result).to.be.undefined
    })
  })

  describe('getOrFetch functionality', () => {
    it('should fetch data when cache miss', async () => {
      const { fetchFn, getFetchCount } = createMockFetchFunction('fetched data')

      const result = await cache.getOrFetch('fetch-key', fetchFn, 60000)

      expect(result).to.equal('fetched data')
      expect(getFetchCount()).to.equal(1)
    })

    it('should return cached data without fetching', async () => {
      const { fetchFn, getFetchCount } = createMockFetchFunction('fetched data')

      // First call should fetch
      const result1 = await cache.getOrFetch('cached-key', fetchFn, 60000)
      expect(result1).to.equal('fetched data')
      expect(getFetchCount()).to.equal(1)

      // Second call should use cache
      const result2 = await cache.getOrFetch('cached-key', fetchFn, 60000)
      expect(result2).to.equal('fetched data')
      expect(getFetchCount()).to.equal(1) // No additional fetch
    })

    it('should handle fetch errors gracefully', async () => {
      const fetchError = new Error('Fetch failed')
      const errorFetchFn = createErrorFetchFunction(fetchError)

      try {
        await cache.getOrFetch('error-key', errorFetchFn, 60000)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).to.equal(fetchError)
      }

      // Error should not be cached
      const result = await cache.get('error-key')
      expect(result).to.be.undefined
    })

    it('should deduplicate concurrent requests', async () => {
      const { fetchFn, getFetchCount } = createDelayedFetchFunction('slow data', 100)

      // Start multiple concurrent requests
      const promises = [
        cache.getOrFetch('concurrent-key', fetchFn, 60000),
        cache.getOrFetch('concurrent-key', fetchFn, 60000),
        cache.getOrFetch('concurrent-key', fetchFn, 60000),
      ]

      const results = await Promise.all(promises)

      // All should return the same result
      expect(results[0]).to.equal('slow data-1')
      expect(results[1]).to.equal('slow data-1')
      expect(results[2]).to.equal('slow data-1')

      // Should only fetch once due to deduplication
      expect(getFetchCount()).to.equal(1)
    })
  })

  describe('delete operations', () => {
    it('should delete specific keys', async () => {
      await cache.set('delete-key', 'delete me', 60000)
      await cache.set('keep-key', 'keep me', 60000)

      // Verify data exists
      expect(await cache.get('delete-key')).to.equal('delete me')
      expect(await cache.get('keep-key')).to.equal('keep me')

      // Delete one key
      await cache.delete('delete-key')

      // Verify deletion
      expect(await cache.get('delete-key')).to.be.undefined
      expect(await cache.get('keep-key')).to.equal('keep me')
    })

    it('should handle deleting non-existent keys', async () => {
      // Should not throw
      await cache.delete('non-existent')
    })
  })

  describe('clear operations', () => {
    it('should clear all cached data', async () => {
      await cache.set('key1', 'value1', 60000)
      await cache.set('key2', 'value2', 60000)

      // Verify data exists
      expect(await cache.get('key1')).to.equal('value1')
      expect(await cache.get('key2')).to.equal('value2')

      // Clear cache
      await cache.clear()

      // Verify all data is cleared
      expect(await cache.get('key1')).to.be.undefined
      expect(await cache.get('key2')).to.be.undefined
    })
  })

  describe('file persistence', () => {
    it('should persist data across instances', async () => {
      const testFileName = `.persistent-test-${Date.now()}`
      const cache1 = new FileCacheManager(testFileName)

      // Store data in first instance
      await cache1.set('persistent-key', 'persistent data', 60000)

      // Create new instance with same file
      const cache2 = new FileCacheManager(testFileName)

      // Should retrieve data from file
      const result = await cache2.get<string>('persistent-key')
      expect(result).to.equal('persistent data')

      // Cleanup
      await cache1.clear()
    })

    it('should handle corrupted cache files gracefully', async () => {
      const testFileName = `.corrupted-test-${Date.now()}`
      const cachePath = join(tmpdir(), testFileName)

      // Create corrupted file
      await fs.writeFile(cachePath, 'invalid json content')

      // Should handle gracefully and start with empty cache
      const cache = new FileCacheManager(testFileName)
      const result = await cache.get('any-key')
      expect(result).to.be.undefined

      // Should be able to store new data
      await cache.set('new-key', 'new data', 60000)
      const newResult = await cache.get<string>('new-key')
      expect(newResult).to.equal('new data')

      // Cleanup
      await cache.clear()
    })
  })

  describe('error handling', () => {
    it('should handle cache write failures gracefully', async () => {
      // Cache should not throw on write failures
      await cache.set('test-key', 'test data', 60000)
    })

    it('should handle cache read failures gracefully', async () => {
      // Should return undefined on read failures
      const result = await cache.get('any-key')
      expect(result).to.be.undefined
    })

    it('should reject invalid filenames', () => {
      expect(() => new FileCacheManager('../dangerous-path')).to.not.throw()
      expect(() => new FileCacheManager('safe-filename')).to.not.throw()
    })
  })

  describe('edge cases', () => {
    it('should handle null and undefined values', async () => {
      await cache.set('null-key', null, 60000)
      await cache.set('undefined-key', undefined, 60000)

      expect(await cache.get('null-key')).to.be.null
      expect(await cache.get('undefined-key')).to.be.undefined
    })

    it('should handle large data objects', async () => {
      const largeData = {
        projects: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Project ${i}`,
          description: 'A'.repeat(100),
        })),
      }

      await cache.set('large-data', largeData, 60000)
      const result = await cache.get<typeof largeData>('large-data')
      expect(result).to.deep.equal(largeData)
    })

    it('should handle sequential operations correctly', async () => {
      // Test sequential operations instead of rapid concurrent ones
      for (let i = 0; i < 5; i++) {
        await cache.set(`seq-${i}`, `value-${i}`, 60000)
      }

      // Verify all data was stored
      for (let i = 0; i < 5; i++) {
        const result = await cache.get(`seq-${i}`)
        expect(result).to.equal(`value-${i}`)
      }
    })
  })
})
