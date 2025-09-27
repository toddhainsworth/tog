import { expect } from 'chai'

import { CachedTogglClient } from '../../src/lib/cached-toggl-client.js'

describe('BaseCommand Cache Integration', () => {
  it('should verify CachedTogglClient can be instantiated', () => {
    const client = new CachedTogglClient('test-token-123456789012345678901234567890ab')

    expect(client).to.be.instanceOf(CachedTogglClient)
    expect(typeof client.getProjects).to.equal('function')
    expect(typeof client.getClients).to.equal('function')
    expect(typeof client.clearCache).to.equal('function')
    expect(typeof client.getCacheStats).to.equal('function')
  })

  it('should have cache management functionality', () => {
    const client = new CachedTogglClient('test-token-123456789012345678901234567890ab')

    const stats = client.getCacheStats()
    expect(stats.cacheSize).to.equal(0)
    expect(stats.pendingRequests).to.equal(0)

    client.clearCache() // Should not throw
  })
})