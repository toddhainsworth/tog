/**
 * Integration tests for ping command
 *
 * Basic test to ensure the simplified architecture is working.
 * More comprehensive tests will be added as we build out the system.
 */

import { expect } from 'chai'

describe('ping command', () => {
  it('can import ping command without errors', async () => {
    // Simple test to ensure the command can be imported
    // This validates our new module structure is working
    const { createPingCommand } = await import('../../dist/commands/ping.js')

    const command = createPingCommand()
    expect(command).to.be.ok
    expect(command.name()).to.equal('ping')
    expect(command.description()).to.equal('Test connection to Toggl API')
  })
})