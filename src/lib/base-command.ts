import {Command, Flags} from '@oclif/core'

import {loadConfig, type TogglConfig} from './config.js'
import {EMOJIS} from './emojis.js'
import {TogglClient} from './toggl-client.js'

/**
 * Base command class providing common functionality for all Toggl CLI commands
 */
export abstract class BaseCommand extends Command {
  static baseFlags = {
    debug: Flags.boolean({
      description: 'Show debug output including full error details',
      hidden: true, // Hide from help unless specifically requested
      // No shorthand to avoid conflicts with command-specific flags
    }),
  }
  private client: null | TogglClient = null
  private togglConfig: null | TogglConfig = null

  /**
   * Get or create Toggl client instance
   * @returns TogglClient instance
   */
  protected getClient(): TogglClient {
    if (!this.client) {
      const config = this.togglConfig || this.loadConfigOrExit()
      this.client = new TogglClient(config.apiToken)
    }

    return this.client
  }

  /**
   * Handle common error scenarios with consistent messaging
   * @param error The error to handle
   * @param context Additional context for the error
   * @param debug Optional debug flag to show full error details
   */
  protected handleError(error: unknown, context: string, debug?: boolean): never {
    if (debug) {
      // In debug mode, show the full error details
      console.error('Debug: Full error details:', error)
      if (error instanceof Error && 'stack' in error) {
        console.error('Debug: Stack trace:', error.stack)
      }
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