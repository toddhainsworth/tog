import {Command} from '@oclif/core'

import {TogglClient} from '../lib/toggl-client.js'
import {loadConfig} from '../lib/config.js'
import {EMOJIS} from '../lib/emojis.js'

export default class Ping extends Command {
  static override description = 'Test connection to Toggl API using stored token'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    try {
      // Load and validate configuration from ~/.togrc
      const config = loadConfig()

      if (!config) {
        this.error('No Toggl CLI configuration found. Run `tog init` to set up your API token first.')
        return
      }

      this.log(`${EMOJIS.LOADING} Testing connection to Toggl API...`)

      // Create Toggl client with stored API token and test connectivity
      const client = new TogglClient(config.apiToken)
      const isConnected = await client.ping()

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
