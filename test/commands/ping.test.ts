import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('ping', () => {
  it('runs ping cmd', async () => {
    const {stdout} = await runCommand('ping')
    expect(stdout).to.contain('hello world')
  })

  it('runs ping --name oclif', async () => {
    const {stdout} = await runCommand('ping --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
