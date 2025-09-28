import { expect } from 'chai'

import { ReferenceCachedTogglClient } from '../../src/lib/reference-cached-toggl-client.js'

describe('BaseCommand Cache Integration', () => {
  it('should verify ReferenceCachedTogglClient can be instantiated', () => {
    const client = new ReferenceCachedTogglClient('test-token-123456789012345678901234567890ab')

    expect(client).to.be.instanceOf(ReferenceCachedTogglClient)
    expect(typeof client.getProjects).to.equal('function')
    expect(typeof client.getClients).to.equal('function')
    expect(typeof client.clearCache).to.equal('function')
    expect(typeof client.ping).to.equal('function')
  })

  it('should have cache management functionality', () => {
    const client = new ReferenceCachedTogglClient('test-token-123456789012345678901234567890ab')

    // Should have cache clearing capability
    expect(typeof client.clearCache).to.equal('function')
  })
})