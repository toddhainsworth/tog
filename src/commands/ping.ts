import {Command, Flags} from '@oclif/core'

import {loadConfig} from '../lib/config.js'
import {EMOJIS} from '../lib/emojis.js'
import {withSpinner} from '../lib/prompts.js'
import {TogglClient} from '../lib/toggl-client.js'

export default class Ping extends Command {
  static override description = 'Test connection to Toggl API using stored token'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static override flags = {
    json: Flags.boolean({description: 'Format output as json'}),
  }

  public async run(): Promise<{connected: boolean; message: string} | void> {
    try {
      // Parse flags to get json option
      const {flags} = await this.parse(Ping)

      // Load and validate configuration from ~/.togrc
      const config = loadConfig()

      if (!config) {
        this.error('No Toggl CLI configuration found. Run `tog init` to set up your API token first.')
        return
      }

      // Create Toggl client with stored API token and test connectivity
      const client = new TogglClient(config.apiToken)
      const isConnected = await withSpinner(
        'Testing connection to Toggl API...',
        () => client.ping(),
        {
          log: this.log.bind(this),
          jsonEnabled: () => flags.json,
          warn: this.warn.bind(this)
        }
      )

      if (flags.json) {
        return {connected: isConnected, message: isConnected ? 'API connection successful' : 'API connection failed'}
      }

      if (isConnected) {
        this.log(`${EMOJIS.SUCCESS} Successfully connected to Toggl API!`)
        this.log('Your API token is working correctly.')
      } else {
        this.error(`${EMOJIS.ERROR} Failed to connect to Toggl API. Your API token may be invalid.`)
      }

    } catch (error) {
      this.error(`Failed to test connection: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
