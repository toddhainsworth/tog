import {Command, Flags} from '@oclif/core'
import * as readline from 'node:readline/promises'

import {getConfigFilePath, saveConfig} from '../lib/config.js'
import {EMOJIS} from '../lib/emojis.js'
import {promptForWorkspaceSelection} from '../lib/prompts.js'
import {TogglClient} from '../lib/toggl-client.js'
import {ApiTokenSchema} from '../lib/validation.js'

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
      let validatedToken: string
      try {
        validatedToken = ApiTokenSchema.assert(token)
      } catch (error) {
        this.error(`Invalid API token: ${error instanceof Error ? error.message : String(error)}`)
        return
      }

      // Optional API validation - test token against Toggl API
      if (flags.validate) {
        this.log(`${EMOJIS.LOADING} Validating API token...`)
        const client = new TogglClient(validatedToken)

        let isValid: boolean
        try {
          isValid = await client.ping()
        } catch (error) {
          this.error(`${EMOJIS.ERROR} API validation failed: ${error instanceof Error ? error.message : String(error)}`)
          return
        }

        if (!isValid) {
          this.error(
            `${EMOJIS.ERROR} API token validation failed. Your API token doesn't work with the Toggl API. Please check your token and try again.`,
          )
        }

        this.log(`${EMOJIS.SUCCESS} API token validated successfully!`)
      }

      // Fetch available workspaces for selection
      this.log(`${EMOJIS.LOADING} Fetching available workspaces...`)
      const client = new TogglClient(validatedToken)

      let workspaces: Awaited<ReturnType<typeof client.getWorkspaces>>
      try {
        workspaces = await client.getWorkspaces()
      } catch (error) {
        this.error(`Failed to fetch workspaces: ${error instanceof Error ? error.message : String(error)}`)
        return
      }

      if (workspaces.length === 0) {
        this.error('No workspaces found for your account. Please ensure you have access to at least one workspace.')
        return
      }

      // Use enhanced workspace selection
      let selectedWorkspaceId: number
      try {
        selectedWorkspaceId = await promptForWorkspaceSelection(workspaces)
        const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId)
        if (selectedWorkspace) {
          this.log(`${EMOJIS.SUCCESS} Selected workspace: "${selectedWorkspace.name}"`)
        }
      } catch (error) {
        this.error(`Failed to select workspace: ${error instanceof Error ? error.message : String(error)}`)
        return
      }

      // Save the validated token and workspace ID to configuration file
      saveConfig({
        apiToken: validatedToken,
        workspaceId: selectedWorkspaceId
      })

      this.log(`${EMOJIS.SUCCESS} Configuration saved successfully to ${getConfigFilePath()}`)
      this.log('You can now use other Toggl CLI commands!')
    } catch (error) {
      this.error(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      rl.close()
    }
  }
}
