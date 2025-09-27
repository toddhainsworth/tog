import { expect } from 'chai'

import { ClientCache } from '../../src/lib/client-cache.js'

// Helper functions for testing - moved to outer scope to satisfy eslint
const createFetchFunction = (returnValue: string) => {
  let fetchCount = 0
  const fetchFn = async () => {
    fetchCount++
    return returnValue
  }

  return { fetchFn, getFetchCount: () => fetchCount }
}

const createSlowFetchFunction = (returnValue: string, delay: number) => {
  let fetchCount = 0
  const fetchFn = async () => {
    fetchCount++
    await new Promise<void>(resolve => {
      setTimeout(() => resolve(), delay)
    })
    return `${returnValue}-${fetchCount}`
  }

  return { fetchFn, getFetchCount: () => fetchCount }
}

const createErrorFetchFunction = (error: Error) => async () => {
  throw error
}

const createSimpleFetchFunction = (returnValue: string) => async () => returnValue

const createDelayedFetchFunction = (returnValue: string, delay: number) => async () => {
  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), delay)
  })
  return returnValue
}

describe('ClientCache', () => {
  let cache: ClientCache

  beforeEach(() => {
    cache = new ClientCache({ defaultTtl: 1000 }) // 1 second for tests
  })

  afterEach(() => {
    cache.clear()
  })

  describe('basic operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'test' }
      cache.set('test-key', testData)

      const retrieved = cache.get('test-key')
      expect(retrieved).to.deep.equal(testData)
    })

    it('should return undefined for non-existent keys', () => {
      const result = cache.get('non-existent')
      expect(result).to.be.undefined
    })

    it('should delete specific entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      cache.delete('key1')

      expect(cache.get('key1')).to.be.undefined
      expect(cache.get('key2')).to.equal('value2')
    })

    it('should clear all entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      cache.clear()

      expect(cache.get('key1')).to.be.undefined
      expect(cache.get('key2')).to.be.undefined
    })
  })

  describe('TTL (Time To Live)', () => {
    it('should respect default TTL', async () => {
      cache.set('test-key', 'test-value')
      expect(cache.get('test-key')).to.equal('test-value')

      // Wait for TTL to expire
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 1100)
      })

      expect(cache.get('test-key')).to.be.undefined
    })

    it('should respect custom TTL', async () => {
      cache.set('test-key', 'test-value', 500) // 500ms TTL
      expect(cache.get('test-key')).to.equal('test-value')

      // Wait for custom TTL to expire
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 600)
      })

      expect(cache.get('test-key')).to.be.undefined
    })

    it('should not expire before TTL', async () => {
      cache.set('test-key', 'test-value', 1000)

      // Wait less than TTL
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 500)
      })

      expect(cache.get('test-key')).to.equal('test-value')
    })
  })

  describe('pattern deletion', () => {
    it('should delete entries matching pattern', () => {
      cache.set('user:1', 'user1')
      cache.set('user:2', 'user2')
      cache.set('project:1', 'project1')

      cache.deletePattern('user:')

      expect(cache.get('user:1')).to.be.undefined
      expect(cache.get('user:2')).to.be.undefined
      expect(cache.get('project:1')).to.equal('project1')
    })

    it('should handle pattern that matches nothing', () => {
      cache.set('key1', 'value1')

      cache.deletePattern('nonexistent')

      expect(cache.get('key1')).to.equal('value1')
    })
  })

  describe('getOrFetch with request deduplication', () => {

    it('should fetch data when not cached', async () => {
      const { fetchFn, getFetchCount } = createFetchFunction('fetched-data')

      const result = await cache.getOrFetch('test-key', fetchFn)

      expect(result).to.equal('fetched-data')
      expect(getFetchCount()).to.equal(1)
      expect(cache.get('test-key')).to.equal('fetched-data')
    })

    it('should return cached data without fetching', async () => {
      cache.set('test-key', 'cached-data')

      const { fetchFn, getFetchCount } = createFetchFunction('fetched-data')

      const result = await cache.getOrFetch('test-key', fetchFn)

      expect(result).to.equal('cached-data')
      expect(getFetchCount()).to.equal(0)
    })

    it('should deduplicate concurrent requests', async () => {
      const { fetchFn, getFetchCount } = createSlowFetchFunction('fetched-data', 100)

      // Start three concurrent requests
      const promises = [
        cache.getOrFetch('test-key', fetchFn),
        cache.getOrFetch('test-key', fetchFn),
        cache.getOrFetch('test-key', fetchFn)
      ]

      const results = await Promise.all(promises)

      // All should return the same result
      expect(results[0]).to.equal('fetched-data-1')
      expect(results[1]).to.equal('fetched-data-1')
      expect(results[2]).to.equal('fetched-data-1')

      // Fetch function should only be called once
      expect(getFetchCount()).to.equal(1)
    })

    it('should handle fetch errors and not cache failed results', async () => {
      const error = new Error('Fetch failed')
      const fetchFn = createErrorFetchFunction(error)

      try {
        await cache.getOrFetch('test-key', fetchFn)
        expect.fail('Should have thrown an error')
      } catch (error_) {
        expect(error_).to.equal(error)
      }

      // Should not cache the error
      expect(cache.get('test-key')).to.be.undefined
    })

    it('should clean up pending requests after success', async () => {
      const fetchFn = createSimpleFetchFunction('test-data')

      await cache.getOrFetch('test-key', fetchFn)

      const stats = cache.getStats()
      expect(stats.pendingRequests).to.equal(0)
    })

    it('should clean up pending requests after error', async () => {
      const fetchFn = createErrorFetchFunction(new Error('Test error'))

      try {
        await cache.getOrFetch('test-key', fetchFn)
      } catch {
        // Ignore error
      }

      const stats = cache.getStats()
      expect(stats.pendingRequests).to.equal(0)
    })
  })

  describe('cache statistics', () => {

    it('should track cache size', () => {
      expect(cache.getStats().cacheSize).to.equal(0)

      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      expect(cache.getStats().cacheSize).to.equal(2)

      cache.delete('key1')

      expect(cache.getStats().cacheSize).to.equal(1)
    })

    it('should track pending requests', async () => {
      const fetchFn = createDelayedFetchFunction('data', 100)

      // Start request but don't await yet
      const promise = cache.getOrFetch('test-key', fetchFn)

      expect(cache.getStats().pendingRequests).to.equal(1)

      await promise

      expect(cache.getStats().pendingRequests).to.equal(0)
    })
  })

  describe('constructor options', () => {
    it('should use default TTL when not specified', () => {
      const defaultCache = new ClientCache()
      defaultCache.set('test-key', 'test-value')

      // Should use 5 minutes default (not expiring in this test)
      expect(defaultCache.get('test-key')).to.equal('test-value')
    })

    it('should use custom default TTL', async () => {
      const customCache = new ClientCache({ defaultTtl: 100 }) // 100ms
      customCache.set('test-key', 'test-value')

      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 150)
      })

      expect(customCache.get('test-key')).to.be.undefined
    })
  })
})