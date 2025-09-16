import {Command} from '@oclif/core'
import * as readline from 'readline/promises'

import {configExists, deleteConfig, getConfigFilePath} from '../lib/config.js'
import {EMOJIS} from '../lib/emojis.js'

export default class Nuke extends Command {
  static override description = 'Delete Toggl CLI configuration'
  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    // Set up interactive prompt for confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    try {
      // Check if configuration file exists before attempting deletion
      if (!configExists()) {
        this.log(`${EMOJIS.INFO}  No Toggl CLI configuration found. Nothing to delete.`)
        return
      }

      // Warning message about permanent deletion
      this.log(`${EMOJIS.WARNING}  This will permanently delete your Toggl CLI configuration (${getConfigFilePath()})`)
      this.log('You will need to run `tog init` again to set up your API token.')

      // Prompt for confirmation (defaults to No for safety)
      const confirmation = await rl
        .question('Are you sure you want to continue? (y/N): ')
        .then((resp) => resp.toLowerCase())

      // Only proceed if user explicitly confirms with 'y' or 'yes'
      if (!['yes', 'y'].includes(confirmation)) {
        this.log(`${EMOJIS.ERROR} Operation cancelled.`)
        return
      }

      // Delete the configuration file
      deleteConfig()
      this.log(`${EMOJIS.SUCCESS} Toggl CLI configuration deleted successfully`)
      this.log('Run `tog init` to set up your API token again.')
    } catch (error) {
      this.error(`Failed to delete configuration: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      rl.close()
    }
  }
}
