import {Command} from '@oclif/core'

import {loadConfig} from '../lib/config.js'
import {EMOJIS} from '../lib/emojis.js'
import {TogglClient} from '../lib/toggl-client.js'

export default class Stop extends Command {
  static override description = 'Stop the currently running timer'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    try {
      // Load and validate configuration
      const config = loadConfig()

      if (!config) {
        this.error('No Toggl CLI configuration found. Run `tog init` to set up your API token first.')
        return
      }

      this.log(`${EMOJIS.LOADING} Checking for running timer...`)

      // Create Toggl client and get current time entry
      const client = new TogglClient(config.apiToken)
      const currentEntry = await client.getCurrentTimeEntry()

      if (!currentEntry) {
        this.log(`${EMOJIS.INFO} No timer is currently running.`)
        return
      }

      // Stop the current time entry
      if (!currentEntry.workspace_id || !currentEntry.id) {
        this.error('Current time entry missing required IDs. Unable to stop timer.')
        return
      }

      const stopped = await client.stopTimeEntry(currentEntry.workspace_id, currentEntry.id)

      if (stopped) {
        this.log(`${EMOJIS.SUCCESS} Timer stopped successfully!`)
        if (currentEntry.description) {
          this.log(`Stopped: "${currentEntry.description}"`)
        }
      } else {
        this.error(`${EMOJIS.ERROR} Failed to stop timer. Please try again.`)
      }

    } catch (error) {
      this.error(`Failed to stop timer: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
