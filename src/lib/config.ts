import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {type} from 'arktype'

const CONFIG_FILE = '.togrc'

const ApiTokenSchema = type('string>=32')
const ConfigSchema = type({
  apiToken: ApiTokenSchema,
})

export type TogglConfig = typeof ConfigSchema.infer

function getConfigPath(): string {
  return path.join(os.homedir(), CONFIG_FILE)
}

export function configExists(): boolean {
  return fs.existsSync(getConfigPath())
}

export function loadConfig(): TogglConfig | null {
  try {
    const configPath = getConfigPath()
    if (!fs.existsSync(configPath)) {
      return null
    }

    const data = fs.readFileSync(configPath, 'utf8')
    const parsed = JSON.parse(data)

    const validation = ConfigSchema(parsed)
    if (validation instanceof type.errors) {
      return null
    }

    return validation
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