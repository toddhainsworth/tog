import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import ora from 'ora'
import sinon from 'sinon'

import {TogglClient} from '../../src/lib/toggl-client.js'

describe('ping', () => {
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

    const {error} = await runCommand('ping')
    expect(error?.message).to.contain('No Toggl CLI configuration found')
  })

  it('validates API token when config exists', async () => {
    // Create a test config file
    const testConfig = {
      apiToken: 'test-token-at-least-32-characters-long',
      workspaceId: 12345,
    }
    fs.writeFileSync(configPath, JSON.stringify(testConfig))

    // Mock the TogglClient.ping method
    sandbox.stub(TogglClient.prototype, 'ping').resolves(true)

    const {stdout} = await runCommand('ping')
    expect(stdout).to.contain('Successfully connected')
  })

  it('shows disconnected when API validation fails', async () => {
    // Create a test config file
    const testConfig = {
      apiToken: 'test-token-at-least-32-characters-long',
      workspaceId: 12345,
    }
    fs.writeFileSync(configPath, JSON.stringify(testConfig))

    // Mock the TogglClient.ping method to return false
    sandbox.stub(TogglClient.prototype, 'ping').resolves(false)

    const {stdout} = await runCommand('ping')
    expect(stdout).to.contain('Unable to connect to Toggl API')
  })

  it('supports JSON output with --json flag', async () => {
    // Create a test config file
    const testConfig = {
      apiToken: 'test-token-at-least-32-characters-long',
      workspaceId: 12345,
    }
    fs.writeFileSync(configPath, JSON.stringify(testConfig))

    // Mock the TogglClient.ping method
    sandbox.stub(TogglClient.prototype, 'ping').resolves(true)

    const {stdout} = await runCommand('ping --json')
    const json = JSON.parse(stdout)
    expect(json).to.have.property('connected', true)
    expect(json).to.have.property('message')
  })
})
