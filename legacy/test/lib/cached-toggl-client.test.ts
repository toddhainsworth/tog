import { expect } from 'chai'
import sinon from 'sinon'

import { CachedTogglClient } from '../../src/lib/cached-toggl-client.js'
import { ClientCache } from '../../src/lib/client-cache.js'
import { FileCacheManager } from '../../src/lib/file-cache.js'

describe('CachedTogglClient', () => {
  let client: CachedTogglClient

  beforeEach(() => {
    client = new CachedTogglClient('test-token')

    // Stub all parent methods that we override
    // Stub parent methods for testing
  })

  afterEach(() => {
    sinon.restore()
    client.clearCache()
  })

  describe('cache management', () => {
    it('should provide cache statistics', () => {
      const stats = client.getCacheStats()

      expect(stats).to.have.property('cacheSize')
      expect(stats).to.have.property('pendingRequests')
      expect(typeof stats.cacheSize).to.equal('number')
      expect(typeof stats.pendingRequests).to.equal('number')
    })

    it('should clear all cache data', async () => {
      // Set some cache data manually to verify clearing
      const {cache} = (client as unknown as {cache: FileCacheManager})
      await cache.set('test-key', 'test-value', 60_000) // 1 minute TTL

      expect(client.getCacheStats().cacheSize).to.be.greaterThan(0)

      await client.clearCache()

      expect(client.getCacheStats().cacheSize).to.equal(0)
    })
  })

  describe('cache behavior', () => {
    it('should use underlying cache for getOrFetch pattern', async () => {
      const {cache} = (client as unknown as {cache: ClientCache})
      expect(cache).to.exist
      expect(typeof cache.getOrFetch).to.equal('function')
    })

  })

  describe('method overrides', () => {
    it('should override getProjects method', () => {
      expect(client.getProjects).to.not.equal(Object.getPrototypeOf(Object.getPrototypeOf(client)).getProjects)
    })

    it('should override getClients method', () => {
      expect(client.getClients).to.not.equal(Object.getPrototypeOf(Object.getPrototypeOf(client)).getClients)
    })

    it('should override getTasks method', () => {
      expect(client.getTasks).to.not.equal(Object.getPrototypeOf(Object.getPrototypeOf(client)).getTasks)
    })

    it('should override getWorkspaces method', () => {
      expect(client.getWorkspaces).to.not.equal(Object.getPrototypeOf(Object.getPrototypeOf(client)).getWorkspaces)
    })

    it('should override getFavorites method', () => {
      expect(client.getFavorites).to.not.equal(Object.getPrototypeOf(Object.getPrototypeOf(client)).getFavorites)
    })

    it('should override getCurrentTimeEntry method', () => {
      expect(client.getCurrentTimeEntry).to.not.equal(Object.getPrototypeOf(Object.getPrototypeOf(client)).getCurrentTimeEntry)
    })

    it('should not override ping method', () => {
      expect(client.ping).to.equal(Object.getPrototypeOf(Object.getPrototypeOf(client)).ping)
    })
  })

  describe('inheritance', () => {
    it('should inherit from TogglClient', () => {
      const TogglClient = Object.getPrototypeOf(Object.getPrototypeOf(client)).constructor
      expect(client).to.be.instanceOf(TogglClient)
    })

    it('should maintain TogglClient interface', () => {
      // Should have all TogglClient methods
      expect(typeof client.getProjects).to.equal('function')
      expect(typeof client.getClients).to.equal('function')
      expect(typeof client.getTasks).to.equal('function')
      expect(typeof client.getWorkspaces).to.equal('function')
      expect(typeof client.getFavorites).to.equal('function')
      expect(typeof client.getCurrentTimeEntry).to.equal('function')
      expect(typeof client.getMostRecentTimeEntry).to.equal('function')
      expect(typeof client.getTimeEntries).to.equal('function')
      expect(typeof client.searchTimeEntries).to.equal('function')
      expect(typeof client.createTimeEntry).to.equal('function')
      expect(typeof client.updateTimeEntry).to.equal('function')
      expect(typeof client.stopTimeEntry).to.equal('function')
      expect(typeof client.ping).to.equal('function')
    })
  })
})