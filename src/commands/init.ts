import {Command, Flags} from '@oclif/core'
import {type} from 'arktype'
import * as readline from 'readline/promises'

import {TogglClient} from '../lib/toggl-client.js'
import {saveConfig, getConfigFilePath} from '../lib/config.js'
import {EMOJIS} from '../lib/emojis.js'

const ApiTokenSchema = type('string>=32')

export default class Init extends Command {
  static override description = 'Initialize Toggl CLI with API token'
  static override examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --validate']
  static override flags = {
    validate: Flags.boolean({char: 'v', description: 'Validate API token by testing connection to Toggl API'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Init)

    // Set up interactive prompt for user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    try {
      // Welcome message and instructions
      this.log("Welcome to Toggl CLI! Let's set up your API token.")
      this.log('You can find your API token at: https://track.toggl.com/profile')

      // Prompt user for their API token
      const token = await rl.question('Enter your Toggl API token: ')

      // Validate token format (must be at least 32 characters)
      const validation = ApiTokenSchema(token)
      if (validation instanceof type.errors) {
        this.error('Invalid API token. Token must be at least 32 characters long.')
      }

      // Optional API validation - test token against Toggl API
      if (flags.validate) {
        this.log(`${EMOJIS.LOADING} Validating API token...`)
        const client = new TogglClient(validation)
        const isValid = await client.ping()

        if (!isValid) {
          this.error(
            `${EMOJIS.ERROR} API token validation failed. Your API token doesn't work with the Toggl API. Please check your token and try again.`,
          )
        }

        this.log(`${EMOJIS.SUCCESS} API token validated successfully!`)
      }

      // Save the validated token to configuration file
      saveConfig({ apiToken: validation })

      this.log(`${EMOJIS.SUCCESS} API token saved successfully to ${getConfigFilePath()}`)
      this.log('You can now use other Toggl CLI commands!')
    } catch (error) {
      this.error(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      rl.close()
    }
  }
}
