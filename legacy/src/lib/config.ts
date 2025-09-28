import * as fs from 'node:fs'
import * as os from 'node:os'
import {join} from 'node:path'

import {ConfigSchema} from './validation.js'

const CONFIG_FILE = '.togrc'

export type TogglConfig = typeof ConfigSchema.infer

// Allow overriding config path for testing
let configPath: string | undefined

export function setConfigPath(path: string | undefined): void {
  configPath = path
}

function getConfigPath(): string {
  return configPath || join(os.homedir(), CONFIG_FILE)
}

export function configExists(): boolean {
  return fs.existsSync(getConfigPath())
}

export function loadConfig(): null | TogglConfig {
  try {
    const configPath = getConfigPath()
    if (!fs.existsSync(configPath)) {
      return null
    }

    const data = fs.readFileSync(configPath, 'utf8')
    const parsed = JSON.parse(data)

    // Use assertion for validation - let caller handle errors
    return ConfigSchema.assert(parsed)
  } catch {
    return null
  }
}

export function saveConfig(config: TogglConfig): void {
  const configPath = getConfigPath()
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

export function deleteConfig(): void {
  const configPath = getConfigPath()
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath)
  }
}

export function getConfigFilePath(): string {
  return `~/${CONFIG_FILE}`
}