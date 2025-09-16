import {Command} from '@oclif/core'
import * as fs from 'fs'
import * as path from 'path'

// @ts-ignore - home-config doesn't have types
import homeConfig from 'home-config'
import {TogglClient} from '../lib/toggl-client.js'

export default class Ping extends Command {
  static override description = 'Test connection to Toggl API using stored token'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    try {
      // Check if config file exists
      const configPath = path.resolve((homeConfig as any).homeDir, '.togrc')
      const configExists = fs.existsSync(configPath)

      if (!configExists) {
        this.error('No Toggl CLI configuration found. Run `tog init` to set up your API token first.')
        return
      }

      // Load configuration
      const config = homeConfig.load('.togrc', {})

      if (!config.apiToken) {
        this.error('No API token found in configuration. Run `tog init` to set up your API token.')
        return
      }

      this.log('🔄 Testing connection to Toggl API...')

      // Test the connection
      const client = new TogglClient(config.apiToken)
      const isConnected = await client.ping()

      if (isConnected) {
        this.log('✅ Successfully connected to Toggl API!')
        this.log('Your API token is working correctly.')
      } else {
        this.error('❌ Failed to connect to Toggl API. Your API token may be invalid.')
      }

    } catch (error) {
      this.error(`Failed to test connection: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
