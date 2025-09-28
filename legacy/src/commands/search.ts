import {Args, Flags} from '@oclif/core'
import ora from 'ora'

import {BaseCommand} from '../lib/base-command.js'
import { HTTP_STATUS, MAX_SEARCH_PAGE_SIZE } from '../lib/constants.js'
import {ProjectService} from '../lib/project-service.js'
import {createSearchResultsTable, formatGrandTotal} from '../lib/table-formatter.js'
import {TimeEntryService} from '../lib/time-entry-service.js'
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
    const timeEntryService = new TimeEntryService(client, this.getLoggingContext())

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
      const [searchResult, projects] = await Promise.all([
        timeEntryService.searchTimeEntries({
          description: args.query,
          endDate: dateRange.end_date,
          pageSize: MAX_SEARCH_PAGE_SIZE,
          startDate: dateRange.start_date,
          workspaceId: config.workspaceId
        }),
        ProjectService.getProjects(client, this.getLoggingContext()),
      ])

      if (searchResult.error) {
        spinner.fail('Failed to search time entries')
        this.handleError(new Error(searchResult.error), 'Search error', flags.debug)
        return
      }

      const searchResults = searchResult.timeEntries

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
      // More specific error message based on error type
      if (error instanceof Error) {
        if (error.message.includes(`HTTP ${HTTP_STATUS.UNAUTHORIZED}`) || error.message.includes('Unauthorized')) {
          spinner.fail('Authentication failed - check your API token')
          this.handleError(error, 'Authentication error', flags.debug)
        } else if (error.message.includes(`HTTP ${HTTP_STATUS.FORBIDDEN}`) || error.message.includes('Forbidden')) {
          spinner.fail('Access denied - insufficient permissions for Reports API')
          this.handleError(error, 'Permission error', flags.debug)
        } else if (error.message.includes(`HTTP ${HTTP_STATUS.TOO_MANY_REQUESTS}`) || error.message.includes('rate limit')) {
          spinner.fail('Rate limit exceeded - please wait before searching again')
          this.handleError(error, 'Rate limit error', flags.debug)
        } else if (error.message.includes('network') || error.message.includes('connect')) {
          spinner.fail('Network connection failed - check your internet connection')
          this.handleError(error, 'Network error', flags.debug)
        } else {
          spinner.fail(`Search failed for "${args.query}"`)
          this.handleError(error, 'Search error', flags.debug)
        }
      } else {
        spinner.fail(`Failed to search time entries for "${args.query}"`)
        this.handleError(error, 'Unknown search error', flags.debug)
      }
    }
  }
}