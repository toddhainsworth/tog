import { expect } from 'chai'
import sinon from 'sinon'

import { ReferenceCachedTogglClient } from '../../src/lib/reference-cached-toggl-client.js'

describe('ReferenceCachedTogglClient', () => {
  let client: ReferenceCachedTogglClient
  let getProjectsStub: sinon.SinonStub
  let getClientsStub: sinon.SinonStub
  let getTasksStub: sinon.SinonStub
  let getWorkspacesStub: sinon.SinonStub
  let getFavoritesStub: sinon.SinonStub
  let getCurrentTimeEntryStub: sinon.SinonStub

  beforeEach(() => {
    // Use unique cache file for each test
    const testCacheFile = `test-cache-${Date.now()}-${Math.random().toString(36).slice(7)}`
    client = new ReferenceCachedTogglClient('test-token', undefined, testCacheFile)

    // Stub all parent methods
    getProjectsStub = sinon.stub(Object.getPrototypeOf(Object.getPrototypeOf(client)), 'getProjects')
    getClientsStub = sinon.stub(Object.getPrototypeOf(Object.getPrototypeOf(client)), 'getClients')
    getTasksStub = sinon.stub(Object.getPrototypeOf(Object.getPrototypeOf(client)), 'getTasks')
    getWorkspacesStub = sinon.stub(Object.getPrototypeOf(Object.getPrototypeOf(client)), 'getWorkspaces')
    getFavoritesStub = sinon.stub(Object.getPrototypeOf(Object.getPrototypeOf(client)), 'getFavorites')
    getCurrentTimeEntryStub = sinon.stub(Object.getPrototypeOf(Object.getPrototypeOf(client)), 'getCurrentTimeEntry')
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('cached methods', () => {
    it('should cache getProjects calls', async () => {
      const mockProjects = [{ active: true, id: 1, name: 'Project 1', workspace_id: 123 }]
      getProjectsStub.resolves(mockProjects)

      // First call should hit API
      const result1 = await client.getProjects()
      expect(result1).to.deep.equal(mockProjects)
      expect(getProjectsStub.callCount).to.equal(1)

      // Second call should use cache
      const result2 = await client.getProjects()
      expect(result2).to.deep.equal(mockProjects)
      expect(getProjectsStub.callCount).to.equal(1) // Still only 1 call
    })

    it('should cache getClients calls', async () => {
      const mockClients = [{ id: 1, name: 'Client 1' }]
      getClientsStub.resolves(mockClients)

      const result1 = await client.getClients()
      const result2 = await client.getClients()

      expect(result1).to.deep.equal(mockClients)
      expect(result2).to.deep.equal(mockClients)
      expect(getClientsStub.callCount).to.equal(1)
    })

    it('should cache getTasks calls', async () => {
      const mockTasks = [{ active: true, id: 1, name: 'Task 1', project_id: 1 }]
      getTasksStub.resolves(mockTasks)

      const result1 = await client.getTasks()
      const result2 = await client.getTasks()

      expect(result1).to.deep.equal(mockTasks)
      expect(result2).to.deep.equal(mockTasks)
      expect(getTasksStub.callCount).to.equal(1)
    })

    it('should cache getWorkspaces calls', async () => {
      const mockWorkspaces = [{ id: 123, name: 'Workspace 1' }]
      getWorkspacesStub.resolves(mockWorkspaces)

      const result1 = await client.getWorkspaces()
      const result2 = await client.getWorkspaces()

      expect(result1).to.deep.equal(mockWorkspaces)
      expect(result2).to.deep.equal(mockWorkspaces)
      expect(getWorkspacesStub.callCount).to.equal(1)
    })

    it('should cache getFavorites calls', async () => {
      const mockFavorites = [{ description: 'Favorite 1', favorite_id: 1 }]
      getFavoritesStub.resolves(mockFavorites)

      const result1 = await client.getFavorites()
      const result2 = await client.getFavorites()

      expect(result1).to.deep.equal(mockFavorites)
      expect(result2).to.deep.equal(mockFavorites)
      expect(getFavoritesStub.callCount).to.equal(1)
    })
  })

  describe('non-cached methods', () => {
    it('should NOT cache getCurrentTimeEntry calls', async () => {
      const mockTimeEntry = {
        at: '2023-01-01T09:00:00Z',
        description: 'Current work',
        duration: -1,
        id: 1,
        start: '2023-01-01T09:00:00Z',
        workspace_id: 123
      }
      getCurrentTimeEntryStub.resolves(mockTimeEntry)

      const result1 = await client.getCurrentTimeEntry()
      const result2 = await client.getCurrentTimeEntry()

      expect(result1).to.deep.equal(mockTimeEntry)
      expect(result2).to.deep.equal(mockTimeEntry)
      expect(getCurrentTimeEntryStub.callCount).to.equal(2) // Should call API twice
    })
  })

  describe('cache management', () => {
    it('should clear cache when requested', async () => {
      const mockProjects = [{ active: true, id: 1, name: 'Project 1', workspace_id: 123 }]
      getProjectsStub.resolves(mockProjects)

      // Prime the cache
      await client.getProjects()
      expect(getProjectsStub.callCount).to.equal(1)

      // Clear cache
      await client.clearCache()

      // Next call should hit API again
      await client.getProjects()
      expect(getProjectsStub.callCount).to.equal(2)
    })
  })

  describe('inheritance', () => {
    it('should inherit from TogglClient', () => {
      expect(client).to.be.instanceOf(ReferenceCachedTogglClient)
      // Check that it has TogglClient methods
      expect(typeof client.ping).to.equal('function')
      expect(typeof client.createTimeEntry).to.equal('function')
      expect(typeof client.stopTimeEntry).to.equal('function')
    })

    it('should maintain TogglClient interface for non-cached methods', () => {
      // These methods should exist and not be overridden
      expect(typeof client.ping).to.equal('function')
      expect(typeof client.createTimeEntry).to.equal('function')
      expect(typeof client.stopTimeEntry).to.equal('function')
      expect(typeof client.updateTimeEntry).to.equal('function')
      expect(typeof client.getMostRecentTimeEntry).to.equal('function')
    })
  })
})