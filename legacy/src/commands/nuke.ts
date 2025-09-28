import {BaseCommand} from '../lib/base-command.js'
import {configExists, deleteConfig, getConfigFilePath} from '../lib/config.js'
import {promptForConfirmation} from '../lib/prompts.js'

export default class Nuke extends BaseCommand {
  static override description = 'Delete Toggl CLI configuration'
  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    try {
      // Check if configuration file exists before attempting deletion
      if (!configExists()) {
        this.logInfo('No Toggl CLI configuration found. Nothing to delete.')
        return
      }

      // Warning message about permanent deletion
      this.logWarning(`This will permanently delete your Toggl CLI configuration (${getConfigFilePath()})`)
      this.log('You will need to run `tog init` again to set up your API token.')

      // Prompt for confirmation (defaults to No for safety)
      const confirmed = await promptForConfirmation(
        'Are you sure you want to continue?',
        false
      )

      if (!confirmed) {
        this.logInfo('Operation cancelled.')
        return
      }

      // Delete the configuration file
      deleteConfig()
      this.logSuccess('Toggl CLI configuration deleted successfully')
      this.log('Run `tog init` to set up your API token again.')
    } catch (error) {
      this.handleError(error, 'Failed to delete configuration')
    }
  }
}
