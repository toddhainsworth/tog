import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('nuke', () => {
  it('runs nuke cmd', async () => {
    const {stdout} = await runCommand('nuke')
    expect(stdout).to.contain('hello world')
  })

  it('runs nuke --name oclif', async () => {
    const {stdout} = await runCommand('nuke --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
