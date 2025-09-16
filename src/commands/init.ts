import {Command, Flags} from '@oclif/core'
import {type} from 'arktype'
import * as readline from 'readline/promises'

// @ts-ignore - home-config doesn't have types
import homeConfig from 'home-config'
import {TogglClient} from '../lib/toggl-client.js'

const ApiTokenSchema = type("string>=32")
type ApiToken = typeof ApiTokenSchema.infer

const ConfigSchema = type({
  apiToken: ApiTokenSchema
})
type TogglConfig = typeof ConfigSchema.infer

export default class Init extends Command {
  static override description = 'Initialize Toggl CLI with API token'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --validate',
  ]
  static override flags = {
    validate: Flags.boolean({char: 'v', description: 'Validate API token by testing connection to Toggl API'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Init)
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    try {
      this.log('Welcome to Toggl CLI! Let\'s set up your API token.')
      this.log('You can find your API token at: https://track.toggl.com/profile')

      const token = await rl.question('Enter your Toggl API token: ')

      const validation = ApiTokenSchema(token)
      if (validation instanceof type.errors) {
        this.error('Invalid API token. Token must be at least 32 characters long.')
        return
      }

      if (flags.validate) {
        this.log('🔄 Validating API token...')
        const client = new TogglClient(validation)
        const isValid = await client.ping()

        if (!isValid) {
          this.error('❌ API token validation failed. Your API token doesn\'t work with the Toggl API. Please check your token and try again.')
          return
        }

        this.log('✓ API token validated successfully!')
      }

      const config = homeConfig.load('.togrc', {})
      config.apiToken = validation
      config.save()

      this.log('✓ API token saved successfully to ~/.togrc')
      this.log('You can now use other Toggl CLI commands!')
    } catch (error) {
      this.error(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      rl.close()
    }
  }
}
