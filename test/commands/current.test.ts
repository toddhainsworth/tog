import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import ora from 'ora'
import sinon from 'sinon'

import {TogglClient} from '../../src/lib/toggl-client.js'

describe('current', () => {
  let sandbox: sinon.SinonSandbox
  let configPath: string

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    configPath = path.join(os.homedir(), '.togrc')

    // Mock ora spinner to output to stdout instead of terminal
    const mockSpinner = {
      text: '',
      start: function() { return this },
      succeed: function(text?: string) {
        console.log(text || 'Success')
        return this
      },
      fail: function(text?: string) {
        console.log(text || 'Failed')
        return this
      }
    }
    sandbox.stub(ora as any, 'default').returns(mockSpinner)
  })

  afterEach(() => {
    sandbox.restore()

    // Clean up test config
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }
  })

  it('shows error when no config exists', async () => {
    // Ensure no config exists
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }

    const {error} = await runCommand('current')
    expect(error?.message).to.contain('No configuration found')
  })

  it('shows message when no timer is running', async () => {
    // Create a test config file
    const testConfig = {
      apiToken: 'test-token-at-least-32-characters-long',
      workspaceId: 12345,
    }
    fs.writeFileSync(configPath, JSON.stringify(testConfig))

    // Mock TogglClient methods
    sandbox.stub(TogglClient.prototype, 'getCurrentTimeEntry').resolves(null)

    const {stdout} = await runCommand('current')
    expect(stdout).to.contain('No timer currently running')
  })

  it('shows current timer details', async () => {
    // Create a test config file
    const testConfig = {
      apiToken: 'test-token-at-least-32-characters-long',
      workspaceId: 12345,
    }
    fs.writeFileSync(configPath, JSON.stringify(testConfig))

    // Mock TogglClient methods
    const startTime = new Date()
    startTime.setHours(startTime.getHours() - 1) // Started 1 hour ago

    sandbox.stub(TogglClient.prototype, 'getCurrentTimeEntry').resolves({
      id: 1,
      description: 'Working on tests',
      start: startTime.toISOString(),
      duration: -1,
      workspace_id: 12345,
      at: new Date().toISOString(),
    })
    sandbox.stub(TogglClient.prototype, 'getProjects').resolves([])
    sandbox.stub(TogglClient.prototype, 'getTasks').resolves([])

    const {stdout} = await runCommand('current')
    expect(stdout).to.contain('Timer is running')
    expect(stdout).to.contain('Working on tests')
    expect(stdout).to.contain('Elapsed time')
    expect(stdout).to.contain('Started at')
  })
})
