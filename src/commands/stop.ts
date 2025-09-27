import {BaseCommand} from '../lib/base-command.js'
import {TimeEntryService} from '../lib/time-entry-service.js'

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
      const timeEntryService = new TimeEntryService(client, this.getLoggingContext())

      // Check for running timer
      const currentResult = await timeEntryService.getCurrentTimeEntry()
      if (currentResult.error) {
        this.handleError(new Error(currentResult.error), 'Failed to check for running timer')
        return
      }

      if (!currentResult.timeEntry) {
        this.logInfo('No timer is currently running.')
        return
      }

      const currentEntry = currentResult.timeEntry

      // Stop the current time entry
      if (!currentEntry.workspace_id || !currentEntry.id) {
        this.handleError(new Error('Current time entry missing required IDs. Unable to stop timer.'), 'Timer validation failed')
        return
      }

      const stopResult = await timeEntryService.stopTimeEntry(currentEntry.workspace_id, currentEntry.id)

      if (stopResult.success) {
        this.logSuccess('Timer stopped successfully!')
        if (currentEntry.description) {
          this.log(`Stopped: "${currentEntry.description}"`)
        }
      } else {
        this.handleError(new Error(stopResult.error || 'Failed to stop timer'), 'Timer stop failed')
      }

    } catch (error) {
      this.handleError(error, 'Failed to stop timer')
    }
  }
}
