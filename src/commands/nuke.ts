import {Command} from '@oclif/core'

import {configExists, deleteConfig, getConfigFilePath} from '../lib/config.js'
import {EMOJIS} from '../lib/emojis.js'
import {promptForConfirmation} from '../lib/prompts.js'

export default class Nuke extends Command {
  static override description = 'Delete Toggl CLI configuration'
  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
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
      const confirmed = await promptForConfirmation(
        'Are you sure you want to continue?',
        false
      )

      if (!confirmed) {
        this.log(`${EMOJIS.INFO} Operation cancelled.`)
        return
      }

      // Delete the configuration file
      deleteConfig()
      this.log(`${EMOJIS.SUCCESS} Toggl CLI configuration deleted successfully`)
      this.log('Run `tog init` to set up your API token again.')
    } catch (error) {
      this.error(`Failed to delete configuration: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
