/**
 * Nuke Command - Delete Toggl CLI configuration
 *
 * Usage: tog nuke
 *
 * This command removes the Toggl CLI configuration file (~/.togrc).
 * Includes confirmation prompt to prevent accidental deletion.
 * Follows the single-file pattern with clear user messaging.
 *
 * Flow:
 *   1. Check if configuration exists
 *   2. Show confirmation prompt with warning
 *   3. Delete configuration file if confirmed
 *   4. Display success or cancellation message
 */

import { Command } from 'commander'
import { confirm } from '@inquirer/prompts'
import { configExists, deleteConfig } from '../config/index.js'
import { formatSuccess, formatError, formatWarning, formatInfo } from '../utils/format.js'

/**
 * Create the nuke command
 */
export function createNukeCommand(): Command {
  return new Command('nuke')
    .description('Delete Toggl CLI configuration')
    .action(async () => {
      try {
        // Step 1: Check if configuration exists
        const configFileExists = await configExists()

        if (!configFileExists) {
          console.log(formatInfo('No configuration file found'))
          console.log('Run "tog init" to set up your API token.')
          return
        }

        // Step 2: Show warning and confirmation prompt
        console.log(formatWarning('This will permanently delete your Toggl CLI configuration'))
        console.log('')
        console.log('You will need to run "tog init" again to use Toggl CLI commands.')
        console.log('')

        const shouldDelete = await confirm({
          message: 'Are you sure you want to delete the configuration?',
          default: false
        })

        if (!shouldDelete) {
          console.log(formatInfo('Configuration deletion cancelled'))
          return
        }

        // Step 3: Delete configuration file
        await deleteConfig()

        // Step 4: Display success message
        console.log('')
        console.log(formatSuccess('Configuration deleted successfully'))
        console.log('')
        console.log('To use Toggl CLI again, run:')
        console.log('  tog init')

      } catch (error) {
        console.error(formatError('Failed to delete configuration'))
        console.error(`  ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
      }
    })
}