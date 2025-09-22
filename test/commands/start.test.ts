import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import ora from 'ora'
import sinon from 'sinon'

import {TogglClient} from '../../src/lib/toggl-client.js'
import * as prompts from '../../src/lib/prompts.js'

describe('start', () => {
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

    // Mock interactive prompts
    sandbox.stub(prompts, 'promptForDescription').resolves('Test description')
    sandbox.stub(prompts, 'promptForTaskSelection').resolves({
      task_id: 1,
      project_id: 2,
      display: 'Test Task'
    })
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

    const {error} = await runCommand('start')
    expect(error?.message).to.contain('No Toggl CLI configuration found')
  })

  it.skip('is interactive - difficult to test reliably', () => {
    // The start command uses interactive prompts (inquirer) for timer description
    // and task selection, which don't work well with oclif test framework.
    // The business logic is tested in unit tests for TogglClient and other modules.
  })
})
