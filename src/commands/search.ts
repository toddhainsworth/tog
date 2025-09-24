import {Args, Flags} from '@oclif/core'
import ora from 'ora'

import {BaseCommand} from '../lib/base-command.js'
import {createSearchResultsTable, formatGrandTotal} from '../lib/table-formatter.js'
import {
  formatTimeEntry,
  getAllTimeSearchRange,
  getCurrentMonthDateRange,
  getCurrentYearDateRange,
} from '../lib/time-utils.js'

export default class Search extends BaseCommand {
  static override args = {
    query: Args.string({
      description: 'Search query to find in time entry descriptions',
      required: true,
    }),
  }
  static override description = 'Search time entries by description text with date range options'
  static override examples = [
    '<%= config.bin %> <%= command.id %> "bug fix"',
    '<%= config.bin %> <%= command.id %> "meeting" --year',
    '<%= config.bin %> <%= command.id %> "project" --all',
  ]
  static override flags = {
    ...BaseCommand.baseFlags,
    all: Flags.boolean({
      char: 'a',
      description: 'Search all time entries (overrides --year)',
      exclusive: ['year'],
    }),
    year: Flags.boolean({
      char: 'y',
      description: 'Search current year entries (default is current month)',
      exclusive: ['all'],
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Search)
    const config = this.loadConfigOrExit()
    const client = this.getClient()

    let dateRange
    let scopeDescription

    if (flags.all) {
      dateRange = getAllTimeSearchRange()
      scopeDescription = 'all time'
    } else if (flags.year) {
      dateRange = getCurrentYearDateRange()
      scopeDescription = 'this year'
    } else {
      dateRange = getCurrentMonthDateRange()
      scopeDescription = 'this month'
    }

    const spinner = ora(`Searching for "${args.query}" in ${scopeDescription}...`).start()

    try {
      const [searchResults, projects] = await Promise.all([
        client.searchTimeEntries(config.workspaceId, {
          description: args.query, // Use original query, not lowercased
          end_date: dateRange.end_date,
          page_size: 1000,
          start_date: dateRange.start_date,
        }),
        client.getProjects(),
      ])

      spinner.succeed(`Found ${searchResults.length} time ${searchResults.length === 1 ? 'entry' : 'entries'} for "${args.query}" in ${scopeDescription}`)

      if (searchResults.length === 0) {
        this.log('')
        this.logInfo(`No time entries found matching "${args.query}" for ${scopeDescription}`)
        this.log('')
        this.logInfo('Try expanding your search scope with --year or --all flags')
        return
      }

      searchResults.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())

      const timeEntrySummaries = searchResults.map(entry => formatTimeEntry(entry, projects))

      let totalSeconds = 0
      for (const entry of searchResults) {
        totalSeconds += entry.duration
      }

      this.log('')
      this.log(`🔍 Search Results: "${args.query}" (${scopeDescription})`)
      this.log(createSearchResultsTable(timeEntrySummaries))

      this.log('')
      this.logSuccess(`Total time found: ${formatGrandTotal(totalSeconds)}`)

    } catch (error) {
      spinner.fail(`Failed to search time entries for "${args.query}"`)
      this.handleError(error, 'Error searching time entries', flags.debug)
    }
  }
}