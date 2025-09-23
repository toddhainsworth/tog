import ora from 'ora'

import {BaseCommand} from '../lib/base-command.js'
import {createProjectSummaryTable, createTimeEntriesTable, formatGrandTotal} from '../lib/table-formatter.js'
import {
  aggregateTimeEntriesByProject,
  calculateElapsedSeconds,
  formatTimeEntry,
  getTodayDateRange,
} from '../lib/time-utils.js'

export default class Today extends BaseCommand {
  static override description = 'Display a comprehensive summary of today\'s time tracking activities'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    this.loadConfigOrExit()
    const client = this.getClient()
    const spinner = ora('Fetching today\'s time entries...').start()

    try {
      const dateRange = getTodayDateRange()
      const [timeEntries, currentEntry, projects] = await Promise.all([
        client.getTimeEntries(dateRange.start_date, dateRange.end_date),
        client.getCurrentTimeEntry(),
        client.getProjects(),
      ])

      const allEntries = [...timeEntries]
      if (currentEntry) {
        allEntries.push(currentEntry)
      }

      spinner.succeed(`Found ${allEntries.length} time ${allEntries.length === 1 ? 'entry' : 'entries'} for today`)

      if (allEntries.length === 0) {
        this.log('')
        this.logInfo('No time entries found for today. Start tracking with `tog start`!')
        return
      }

      allEntries.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

      const timeEntrySummaries = allEntries.map(entry => formatTimeEntry(entry, projects))
      const projectSummaries = aggregateTimeEntriesByProject(allEntries, projects)

      let totalSeconds = 0
      for (const entry of allEntries) {
        totalSeconds += entry.stop ? entry.duration : calculateElapsedSeconds(entry.start)
      }

      this.log('')
      this.log('📅 Today\'s Time Entries')
      this.log(createTimeEntriesTable(timeEntrySummaries))

      if (projectSummaries.length > 0) {
        this.log('')
        this.log('📊 Project Summary')
        this.log(createProjectSummaryTable(projectSummaries))
      }

      this.log('')
      this.logSuccess(`Total time tracked today: ${formatGrandTotal(totalSeconds)}`)

      if (currentEntry) {
        this.log('')
        this.logInfo('⏰ Timer is currently running')
      }

    } catch (error) {
      spinner.fail('Failed to fetch today\'s summary')
      this.handleError(error, 'Error fetching today\'s time entries')
    }
  }
}