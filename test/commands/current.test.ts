import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('current', () => {
  it('runs current cmd', async () => {
    const {stdout} = await runCommand('current')
    expect(stdout).to.contain('hello world')
  })

  it('runs current --name oclif', async () => {
    const {stdout} = await runCommand('current --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
