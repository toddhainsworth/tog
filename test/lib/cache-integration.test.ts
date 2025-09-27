import { expect } from 'chai'

import { CachedTogglClient } from '../../src/lib/cached-toggl-client.js'
import { ClientService } from '../../src/lib/client-service.js'
import { FileCacheManager } from '../../src/lib/file-cache.js'
import { ProjectService } from '../../src/lib/project-service.js'
import { WorkspaceService } from '../../src/lib/workspace-service.js'

describe('Cache Integration', () => {
  let cachedClient: CachedTogglClient

  beforeEach(() => {
    cachedClient = new CachedTogglClient('test-token')
  })

  afterEach(() => {
    cachedClient.clearCache()
  })

  describe('service compatibility', () => {
    it('should work with ProjectService', () => {
      const projectService = new ProjectService(cachedClient)
      expect(projectService).to.be.instanceOf(ProjectService)

      // Verify the client is properly typed
      expect(typeof projectService.getProjects).to.equal('function')
    })

    it('should work with ClientService static methods', () => {
      // ClientService uses static methods with client parameters
      expect(typeof ClientService.getClients).to.equal('function')
      expect(typeof ClientService.selectClient).to.equal('function')
      expect(typeof ClientService.validateClient).to.equal('function')
    })

    it('should work with WorkspaceService static methods', () => {
      // WorkspaceService uses static methods with client parameters
      expect(typeof WorkspaceService.getWorkspaces).to.equal('function')
      expect(typeof WorkspaceService.validateWorkspace).to.equal('function')
      expect(typeof WorkspaceService.getDefaultWorkspace).to.equal('function')
    })
  })

  describe('type compatibility', () => {
    it('should be assignable to TogglClient type', () => {
      // This test verifies that CachedTogglClient can be used wherever TogglClient is expected
      expect(typeof cachedClient.getProjects).to.equal('function')
    })

    it('should maintain all TogglClient method signatures', () => {
      // Verify that CachedTogglClient maintains the same interface as TogglClient
      expect(typeof cachedClient.getProjects).to.equal('function')
      expect(typeof cachedClient.getClients).to.equal('function')
      expect(typeof cachedClient.getTasks).to.equal('function')
      expect(typeof cachedClient.getWorkspaces).to.equal('function')
      expect(typeof cachedClient.getFavorites).to.equal('function')
      expect(typeof cachedClient.getCurrentTimeEntry).to.equal('function')
      expect(typeof cachedClient.getMostRecentTimeEntry).to.equal('function')
      expect(typeof cachedClient.getTimeEntries).to.equal('function')
      expect(typeof cachedClient.searchTimeEntries).to.equal('function')
      expect(typeof cachedClient.createTimeEntry).to.equal('function')
      expect(typeof cachedClient.updateTimeEntry).to.equal('function')
      expect(typeof cachedClient.stopTimeEntry).to.equal('function')
      expect(typeof cachedClient.ping).to.equal('function')
    })
  })

  describe('cache behavior verification', () => {
    it('should start with empty cache', () => {
      const stats = cachedClient.getCacheStats()
      expect(stats.cacheSize).to.equal(0)
      expect(stats.pendingRequests).to.equal(0)
    })

    it('should clear cache when requested', async () => {
      // Manually add something to cache to test clearing
      const {cache} = (cachedClient as unknown as {cache: FileCacheManager})
      await cache.set('test', 'value', 60_000) // 1 minute TTL

      expect(cachedClient.getCacheStats().cacheSize).to.be.greaterThan(0)

      await cachedClient.clearCache()

      expect(cachedClient.getCacheStats().cacheSize).to.equal(0)
    })
  })

  describe('feature compatibility', () => {
    it('should support all cache management features', () => {
      // Verify cache management methods exist
      expect(typeof cachedClient.clearCache).to.equal('function')
      expect(typeof cachedClient.getCacheStats).to.equal('function')
    })

    it('should cache appropriate methods', () => {
      // These methods should be overridden (cached)
      const parentPrototype = Object.getPrototypeOf(Object.getPrototypeOf(cachedClient))
      expect(cachedClient.getProjects).to.not.equal(parentPrototype.getProjects)
      expect(cachedClient.getClients).to.not.equal(parentPrototype.getClients)
      expect(cachedClient.getTasks).to.not.equal(parentPrototype.getTasks)
      expect(cachedClient.getWorkspaces).to.not.equal(parentPrototype.getWorkspaces)
      expect(cachedClient.getFavorites).to.not.equal(parentPrototype.getFavorites)
      expect(cachedClient.getCurrentTimeEntry).to.not.equal(parentPrototype.getCurrentTimeEntry)
    })

    it('should not cache ping method', () => {
      // ping should not be overridden
      const parentPrototype = Object.getPrototypeOf(Object.getPrototypeOf(cachedClient))
      expect(cachedClient.ping).to.equal(parentPrototype.ping)
    })
  })
})