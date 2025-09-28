/**
 * Configuration Management
 *
 * Simple file-based configuration for storing API tokens and user preferences.
 * Follows the same format as the legacy implementation for compatibility.
 * Uses arktype for runtime validation to ensure config integrity.
 */

import { readFile, writeFile, access } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { ConfigSchema, ApiTokenSchema, type Config } from './validation.js'

// Export Config type from validation module for consistency
export type { Config as TogglConfig }

const CONFIG_FILE_PATH = join(homedir(), '.togrc')

/**
 * Load configuration from ~/.togrc file
 *
 * @returns Configuration object
 * @throws Error if config file doesn't exist or is invalid
 */
export async function loadConfig(): Promise<Config> {
  try {
    // Check if config file exists
    await access(CONFIG_FILE_PATH)

    // Read and parse config file
    const configContent = await readFile(CONFIG_FILE_PATH, 'utf-8')
    const rawConfig = JSON.parse(configContent)

    // Validate and return configuration using arktype
    // ConfigSchema.assert() throws on validation failure, returns validated data on success
    return ConfigSchema.assert(rawConfig)
  } catch (error) {
    // Type guard for Node.js file system errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error('Configuration not found. Run "tog init" to set up your API token.')
    }

    if (error instanceof SyntaxError) {
      throw new Error('Configuration file is corrupted. Run "tog init" to recreate it.')
    }

    throw error
  }
}

/**
 * Save configuration to ~/.togrc file
 *
 * @param config - Configuration to save
 */
export async function saveConfig(config: Config): Promise<void> {
  try {
    // Validate configuration before saving using arktype
    const validatedConfig = ConfigSchema.assert(config)

    const configContent = JSON.stringify(validatedConfig, null, 2)
    await writeFile(CONFIG_FILE_PATH, configContent, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to save configuration: ${(error as Error).message}`)
  }
}

/**
 * Check if configuration file exists
 *
 * @returns True if config exists, false otherwise
 */
export async function configExists(): Promise<boolean> {
  try {
    await access(CONFIG_FILE_PATH)
    return true
  } catch {
    return false
  }
}

/**
 * Delete configuration file
 */
export async function deleteConfig(): Promise<void> {
  try {
    const { unlink } = await import('fs/promises')
    await unlink(CONFIG_FILE_PATH)
  } catch (error) {
    // Type guard for Node.js file system errors
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to delete configuration: ${message}`)
    }
    // File doesn't exist, which is fine
  }
}

/**
 * Validate API token format
 *
 * @param token - Token to validate
 * @returns True if token format appears valid
 */
export function isValidTokenFormat(token: string): boolean {
  try {
    ApiTokenSchema.assert(token)
    return true
  } catch {
    return false
  }
}