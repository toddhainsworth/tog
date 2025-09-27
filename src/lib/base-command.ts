import {Command, Flags} from '@oclif/core'

import {CachedTogglClient} from './cached-toggl-client.js'
import {loadConfig, type TogglConfig} from './config.js'
import {DataSanitizer} from './data-sanitizer.js'
import {EMOJIS} from './emojis.js'

export interface LoggingContext {
  debug?: (message: string, data?: Record<string, unknown>) => void
  warn?: (message: string) => void
}

/**
 * Base command class providing common functionality for all Toggl CLI commands
 */
export abstract class BaseCommand extends Command {
  static override baseFlags = {
    debug: Flags.boolean({
      description: 'Show debug output including full error details',
      hidden: true, // Hide from help unless specifically requested
      // No shorthand to avoid conflicts with command-specific flags
    }),
  }
  private client: CachedTogglClient | null = null
  private togglConfig: null | TogglConfig = null

  /**
   * Get or create Toggl client instance with caching
   * @returns CachedTogglClient instance
   */
  protected getClient(): CachedTogglClient {
    if (!this.client) {
      const config = this.togglConfig || this.loadConfigOrExit()
      const debugLogger = {
        debug: (message: string, data?: Record<string, unknown>) => this.logDebug(`[TogglClient] ${message}`, data)
      }
      this.client = new CachedTogglClient(config.apiToken, debugLogger)
    }

    return this.client
  }

  /**
   * Get logging context for services
   * @returns LoggingContext instance
   */
  protected getLoggingContext(): LoggingContext {
    return {
      debug: (message: string, data?: Record<string, unknown>) => this.logDebug(message, data),
      warn: (message: string) => this.logWarning(message)
    }
  }

  /**
   * Handle common error scenarios with consistent messaging
   * @param error The error to handle
   * @param context Additional context for the error
   * @param debug Optional debug flag to show full error details
   */
  protected handleError(error: unknown, context: string, debug?: boolean): never {
    if (debug) {
      // In debug mode, show the full error details using oclif's logToStderr
      this.logDebugError('Full error details', error instanceof Error ? error : new Error(String(error)), {
        context,
      })
    }

    const message = error instanceof Error ? error.message : String(error)
    this.error(`${EMOJIS.ERROR} ${context}: ${message}`)
  }

  /**
   * Load configuration or exit with error message
   * @returns Valid TogglConfig
   */
  protected loadConfigOrExit(): TogglConfig {
    const config = loadConfig()
    if (!config) {
      this.error('No Toggl CLI configuration found. Run `tog init` to set up your API token first.')
    }

    this.togglConfig = config
    return config
  }

  /**
   * Log debug message when debug flag is enabled
   * Uses oclif's logToStderr for proper output handling
   * @param message Debug message
   * @param data Optional structured data (will be sanitized)
   */
  protected logDebug(message: string, data?: Record<string, unknown>): void {
    // Access debug flag directly from argv - simpler than overriding parse
    if (!process.argv.includes('--debug')) return

    let output = `🔍 DEBUG: ${message}`
    if (data && Object.keys(data).length > 0) {
      const sanitizedData = DataSanitizer.sanitize(data)
      output += ` ${JSON.stringify(sanitizedData)}`
    }

    this.logToStderr(output)
  }

  /**
   * Log debug error with full details when debug flag is enabled
   * @param message Debug message
   * @param error Error object
   * @param data Optional structured data (will be sanitized)
   */
  protected logDebugError(message: string, error: Error, data?: Record<string, unknown>): void {
    // Access debug flag directly from argv - simpler than overriding parse
    if (!process.argv.includes('--debug')) return

    let output = `🔍 DEBUG: ${message}`
    output += `\n  Error: ${error.message}`

    if (data && Object.keys(data).length > 0) {
      const sanitizedData = DataSanitizer.sanitize(data)
      output += `\n  Data: ${JSON.stringify(sanitizedData)}`
    }

    if (error.stack) {
      output += `\n  Stack: ${error.stack}`
    }

    this.logToStderr(output)
  }

  /**
   * Log info message with emoji
   * @param message Info message
   */
  protected logInfo(message: string): void {
    this.log(`${EMOJIS.INFO} ${message}`)
  }

  /**
   * Log success message with emoji
   * @param message Success message
   */
  protected logSuccess(message: string): void {
    this.log(`${EMOJIS.SUCCESS} ${message}`)
  }

  /**
   * Log warning message with emoji
   * @param message Warning message
   */
  protected logWarning(message: string): void {
    this.log(`${EMOJIS.WARNING} ${message}`)
  }

  /**
   * Set config directly (for testing)
   */
  protected setConfig(config: TogglConfig): void {
    this.togglConfig = config
    this.client = null // Reset client to use new config
  }
}