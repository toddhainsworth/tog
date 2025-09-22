import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import sinon from 'sinon'

import {
  configExists,
  deleteConfig,
  getConfigFilePath,
  loadConfig,
  saveConfig,
  type TogglConfig,
} from '../../src/lib/config.js'

describe('Config module', () => {
  let sandbox: sinon.SinonSandbox
  let configPath: string

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    configPath = path.join(os.homedir(), '.togrc')

    // Clean up any existing config
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }
  })

  afterEach(() => {
    sandbox.restore()

    // Clean up test config
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }
  })

  describe('configExists', () => {
    it('should return false when config does not exist', () => {
      expect(configExists()).to.be.false
    })

    it('should return true when config exists', () => {
      fs.writeFileSync(configPath, JSON.stringify({
        apiToken: 'test-token-at-least-32-characters-long',
        workspaceId: 12345,
      }))
      expect(configExists()).to.be.true
    })
  })

  describe('loadConfig', () => {
    it('should return null when config does not exist', () => {
      expect(loadConfig()).to.be.null
    })

    it('should return parsed config when valid config exists', () => {
      const testConfig: TogglConfig = {
        apiToken: 'test-token-at-least-32-characters-long',
        workspaceId: 12345,
      }
      fs.writeFileSync(configPath, JSON.stringify(testConfig))

      const config = loadConfig()
      expect(config).to.deep.equal(testConfig)
    })

    it('should return null for invalid config format', () => {
      fs.writeFileSync(configPath, JSON.stringify({
        apiToken: 'short', // Invalid: too short
        workspaceId: 12345,
      }))

      expect(loadConfig()).to.be.null
    })

    it('should return null for malformed JSON', () => {
      fs.writeFileSync(configPath, 'not valid json')
      expect(loadConfig()).to.be.null
    })
  })

  describe('saveConfig', () => {
    it('should write config to file', () => {
      const testConfig: TogglConfig = {
        apiToken: 'test-token-at-least-32-characters-long',
        workspaceId: 12345,
      }

      saveConfig(testConfig)

      expect(fs.existsSync(configPath)).to.be.true
      const savedData = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      expect(savedData).to.deep.equal(testConfig)
    })

    it('should overwrite existing config', () => {
      const oldConfig: TogglConfig = {
        apiToken: 'old-token-at-least-32-characters-long!!',
        workspaceId: 11111,
      }
      const newConfig: TogglConfig = {
        apiToken: 'new-token-at-least-32-characters-long!!',
        workspaceId: 22222,
      }

      saveConfig(oldConfig)
      saveConfig(newConfig)

      const savedData = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      expect(savedData).to.deep.equal(newConfig)
    })
  })

  describe('deleteConfig', () => {
    it('should delete existing config file', () => {
      fs.writeFileSync(configPath, JSON.stringify({
        apiToken: 'test-token-at-least-32-characters-long',
        workspaceId: 12345,
      }))

      expect(fs.existsSync(configPath)).to.be.true
      deleteConfig()
      expect(fs.existsSync(configPath)).to.be.false
    })

    it('should not throw when config does not exist', () => {
      expect(fs.existsSync(configPath)).to.be.false
      expect(() => deleteConfig()).to.not.throw()
    })
  })

  describe('getConfigFilePath', () => {
    it('should return the config file path', () => {
      expect(getConfigFilePath()).to.equal('~/.togrc')
    })
  })
})