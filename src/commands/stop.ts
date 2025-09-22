import {BaseCommand} from '../lib/base-command.js'
import {withSpinner} from '../lib/prompts.js'

export default class Stop extends BaseCommand {
  static override description = 'Stop the currently running timer'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    try {
      // Load config and create client using base class methods
      this.loadConfigOrExit()
      const client = this.getClient()

      const currentEntry = await withSpinner('Checking for running timer...', () => client.getCurrentTimeEntry(), {
        log: this.log.bind(this),
        warn: this.warn.bind(this)
      })

      if (!currentEntry) {
        this.logInfo('No timer is currently running.')
        return
      }

      // Stop the current time entry
      if (!currentEntry.workspace_id || !currentEntry.id) {
        this.handleError(new Error('Current time entry missing required IDs. Unable to stop timer.'), 'Timer validation failed')
        return
      }

      const stopped = await client.stopTimeEntry(currentEntry.workspace_id, currentEntry.id)

      if (stopped) {
        this.logSuccess('Timer stopped successfully!')
        if (currentEntry.description) {
          this.log(`Stopped: "${currentEntry.description}"`)
        }
      } else {
        this.handleError(new Error('Failed to stop timer. Please try again.'), 'Timer stop failed')
      }

    } catch (error) {
      this.handleError(error, 'Failed to stop timer')
    }
  }
}
