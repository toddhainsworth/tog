import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

describe('nuke', () => {
  let configPath: string

  beforeEach(() => {
    configPath = path.join(os.homedir(), '.togrc')
  })

  afterEach(() => {
    // Clean up test config
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }
  })

  it('shows message when no config exists', async () => {
    // Ensure no config exists
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }

    const {stdout} = await runCommand('nuke')
    expect(stdout).to.contain('No Toggl CLI configuration found')
  })

  it('requires config file to exist for deletion', async () => {
    // Ensure no config exists
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }

    // Since nuke is interactive and requires stdin, we can't fully test it
    // We can only test the case where no config exists
    const {stdout} = await runCommand('nuke')
    expect(stdout).to.contain('No Toggl CLI configuration found')
  })
})
