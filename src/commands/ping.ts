import {Flags} from '@oclif/core'

import {BaseCommand} from '../lib/base-command.js'
import {withSpinner} from '../lib/prompts.js'

export default class Ping extends BaseCommand {
  static override description = 'Test connection to Toggl API using stored token'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
static override flags = {
    json: Flags.boolean({description: 'Format output as json'}),
  }

  public async run(): Promise<void | {connected: boolean; message: string}> {
    try {
      const {flags} = await this.parse(Ping)

      // Load config and create client using base class methods
      this.loadConfigOrExit()
      const client = this.getClient()

      const isConnected = await withSpinner(
        'Testing connection to Toggl API...',
        () => client.ping(),
        {
          jsonEnabled: () => flags.json,
          log: this.log.bind(this),
          warn: this.warn.bind(this)
        }
      )

      if (flags.json) {
        return {connected: isConnected, message: isConnected ? 'API connection successful' : 'API connection failed'}
      }

      if (isConnected) {
        this.logSuccess('Successfully connected to Toggl API!')
        this.log('Your API token is working correctly.')
      } else {
        this.handleError(new Error('Failed to connect to Toggl API. Your API token may be invalid.'), 'Connection test failed')
      }

    } catch (error) {
      this.handleError(error, 'Failed to test connection')
    }
  }
}
