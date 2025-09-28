import {expect} from 'chai'
import * as fs from 'node:fs'
import * as os from 'node:os'
import {join} from 'node:path'
import {createSandbox} from 'sinon'

import {
  configExists,
  deleteConfig,
  getConfigFilePath,
  loadConfig,
  saveConfig,
  setConfigPath,
  type TogglConfig,
} from '../../src/lib/config.js'

describe('Config module', () => {
  let sandbox: ReturnType<typeof createSandbox>
  let testConfigPath: string

  beforeEach(() => {
    sandbox = createSandbox()

    // Use a temporary test config file instead of real ~/.togrc
    testConfigPath = join(os.tmpdir(), `test-togrc-${Date.now()}-${Math.random().toString(36).slice(7)}`)
    setConfigPath(testConfigPath)
  })

  afterEach(() => {
    sandbox.restore()

    // Reset to default path
    setConfigPath(undefined)

    // Clean up test config file
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath)
    }
  })

  describe('configExists', () => {
    it('should return false when config does not exist', () => {
      expect(configExists()).to.be.false
    })

    it('should return true when config exists', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify({
        apiToken: 'test-token-at-least-32-characters-long',
        workspaceId: 12_345,
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
        workspaceId: 12_345,
      }
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig))

      const config = loadConfig()
      expect(config).to.deep.equal(testConfig)
    })

    it('should return null for invalid config format', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify({
        apiToken: 'short', // Invalid: too short
        workspaceId: 12_345,
      }))

      expect(loadConfig()).to.be.null
    })

    it('should return null for malformed JSON', () => {
      fs.writeFileSync(testConfigPath, 'not valid json')
      expect(loadConfig()).to.be.null
    })
  })

  describe('saveConfig', () => {
    it('should write config to file', () => {
      const testConfig: TogglConfig = {
        apiToken: 'test-token-at-least-32-characters-long',
        workspaceId: 12_345,
      }

      saveConfig(testConfig)

      expect(fs.existsSync(testConfigPath)).to.be.true
      const savedData = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'))
      expect(savedData).to.deep.equal(testConfig)
    })

    it('should overwrite existing config', () => {
      const oldConfig: TogglConfig = {
        apiToken: 'old-token-at-least-32-characters-long!!',
        workspaceId: 11_111,
      }
      const newConfig: TogglConfig = {
        apiToken: 'new-token-at-least-32-characters-long!!',
        workspaceId: 22_222,
      }

      saveConfig(oldConfig)
      saveConfig(newConfig)

      const savedData = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'))
      expect(savedData).to.deep.equal(newConfig)
    })
  })

  describe('deleteConfig', () => {
    it('should delete existing config file', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify({
        apiToken: 'test-token-at-least-32-characters-long',
        workspaceId: 12_345,
      }))

      expect(fs.existsSync(testConfigPath)).to.be.true
      deleteConfig()
      expect(fs.existsSync(testConfigPath)).to.be.false
    })

    it('should not throw when config does not exist', () => {
      expect(fs.existsSync(testConfigPath)).to.be.false
      expect(() => deleteConfig()).to.not.throw()
    })
  })

  describe('getConfigFilePath', () => {
    it('should return the config file path', () => {
      expect(getConfigFilePath()).to.equal('~/.togrc')
    })
  })
})