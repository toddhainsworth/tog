/**
 * Week Command - Display comprehensive weekly time tracking summary
 *
 * Usage: tog week [--last]
 *
 * This command displays a comprehensive weekly summary showing daily
 * breakdowns and project aggregations. Supports current week (default)
 * and previous week views. Follows the single-file pattern with
 * comprehensive date handling and performance optimization.
 *
 * Flow:
 *   1. Load configuration and determine week range
 *   2. Fetch time entries, current timer, and projects in parallel
 *   3. Process and aggregate data by day and project
 *   4. Fill missing days to show complete week
 *   5. Display formatted tables and totals
 */

import { Command } from 'commander'
import { isAxiosError } from 'axios'
import Table from 'cli-table3'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween.js'

dayjs.extend(isBetween)
import { loadConfig } from '../config/index.js'
import { createTogglClient, TogglTimeEntry, TogglProject } from '../api/client.js'
import { formatSuccess, formatError, formatInfo } from '../utils/format.js'
import {
  getCurrentWeekDateRange,
  getPreviousWeekDateRange,
  formatWeekRange,
  groupTimeEntriesByDay,
  aggregateWeeklyProjectSummary,
  fillMissingDays,
  formatDuration,
  calculateElapsedSeconds,
  type DailySummary,
  type WeeklyProjectSummary,
} from '../utils/time.js'

/**
 * Create the week command
 */
export function createWeekCommand(): Command {
  return new Command('week')
    .description('Display comprehensive weekly time tracking summary')
    .option('-l, --last', 'Show previous week instead of current week')
    .action(async (options: { last?: boolean }) => {
      try {
        // Step 1: Load configuration and determine week range
        const config = await loadConfig()
        if (!config) {
          console.error(formatError('No configuration found'))
          console.error('Run "tog init" to set up your API token.')
          process.exit(1)
        }

        const dateRange = options.last ? getPreviousWeekDateRange() : getCurrentWeekDateRange()
        const weekLabel = options.last ? 'Last Week' : 'This Week'
        const weekRangeStr = formatWeekRange(dateRange)

        console.log(formatInfo(`Fetching ${weekLabel.toLowerCase()} time entries...`))

        // Step 2: Create API client and fetch data in parallel
        const client = createTogglClient(config.apiToken)
        const [timeEntries, currentTimer, projects] = await Promise.all([
          fetchTimeEntries(client, dateRange.start_date, dateRange.end_date),
          getCurrentTimeEntry(client),
          fetchAllProjects(client),
        ])

        const allEntries = [...timeEntries]

        // Step 3: Include current timer if it's in the current week and we're viewing current week
        if (currentTimer && !options.last) {
          const currentStart = dayjs(currentTimer.start)
          const rangeStart = dayjs(dateRange.start_date)
          const rangeEnd = dayjs(dateRange.end_date)

          if (currentStart.isBetween(rangeStart, rangeEnd, null, '[]')) {
            allEntries.push(currentTimer)
          }
        }

        console.log('')
        console.log(`📅 ${weekLabel} Summary (${weekRangeStr})`)
        console.log('')

        // Step 4: Handle empty state
        if (allEntries.length === 0) {
          console.log(
            formatInfo(
              `No time entries found for ${weekLabel.toLowerCase()}. Start tracking with "tog start"!`
            )
          )
          return
        }

        // Step 5: Process and aggregate data
        const dailySummaries = groupTimeEntriesByDay(allEntries, projects)
        const projectSummaries = aggregateWeeklyProjectSummary(allEntries, projects)
        const completeDailySummaries = fillMissingDays(dailySummaries, dateRange)

        // Calculate total time
        let totalSeconds = 0
        for (const entry of allEntries) {
          totalSeconds += entry.stop ? entry.duration : calculateElapsedSeconds(entry.start)
        }

        // Step 6: Display results
        console.log('📋 Daily Summary')
        displayDailySummaryTable(completeDailySummaries)

        if (projectSummaries.length > 0) {
          console.log('')
          console.log('📊 Project Summary')
          displayProjectSummaryTable(projectSummaries)
        }

        console.log('')
        console.log(formatSuccess(`Total time tracked: ${formatDuration(totalSeconds)}`))

        // Show running timer info if applicable
        if (currentTimer && !options.last) {
          const currentStart = dayjs(currentTimer.start)
          const rangeStart = dayjs(dateRange.start_date)
          const rangeEnd = dayjs(dateRange.end_date)

          if (currentStart.isBetween(rangeStart, rangeEnd, null, '[]')) {
            console.log('')
            console.log(formatInfo('⏰ Timer is currently running'))
          }
        }
      } catch (error: unknown) {
        console.error(formatError('Failed to fetch weekly summary'))

        if (isAxiosError(error) && error.response) {
          const status = error.response.status
          if (status === 401) {
            console.error('Invalid API token. Run "tog init" to update your credentials.')
          } else if (status === 403) {
            console.error('Access denied. Check your API token permissions.')
          } else if (status >= 500) {
            console.error('Toggl API is currently unavailable. Please try again later.')
          } else {
            console.error(`API error ${status}: ${error.response.statusText}`)
          }
        } else if (error instanceof Error) {
          console.error(`Error: ${error.message}`)
        } else {
          console.error(`Unknown error: ${String(error)}`)
        }

        process.exit(1)
      }
    })
}

/**
 * Display daily summary table using cli-table3
 */
function displayDailySummaryTable(dailySummaries: DailySummary[]): void {
  const table = new Table({
    colWidths: [15, 12],
    head: ['Day', 'Duration'],
    style: {
      border: ['gray'],
      head: ['cyan'],
    },
  })

  // Add rows to table
  for (const day of dailySummaries) {
    table.push([day.dayName, day.formattedDuration])
  }

  console.log(table.toString())
}

/**
 * Display project summary table using cli-table3
 */
function displayProjectSummaryTable(projectSummaries: WeeklyProjectSummary[]): void {
  const table = new Table({
    colWidths: [25, 12, 8, 12, 12],
    head: ['Project', 'Duration', 'Days', 'Daily Avg', 'Percentage'],
    style: {
      border: ['gray'],
      head: ['cyan'],
    },
  })

  // Add rows to table
  for (const project of projectSummaries) {
    table.push([
      project.projectName,
      project.formattedDuration,
      String(project.daysWorked),
      project.dailyAverage,
      `${project.percentage}%`,
    ])
  }

  console.log(table.toString())
}

/**
 * Fetch time entries for date range
 */
async function fetchTimeEntries(
  client: ReturnType<typeof createTogglClient>,
  startDate: string,
  endDate: string
): Promise<TogglTimeEntry[]> {
  const start = dayjs(startDate).format('YYYY-MM-DD')
  const end = dayjs(endDate).format('YYYY-MM-DD')

  return await client.get(`/me/time_entries?start_date=${start}&end_date=${end}`)
}

/**
 * Get currently running timer
 */
async function getCurrentTimeEntry(
  client: ReturnType<typeof createTogglClient>
): Promise<TogglTimeEntry | null> {
  try {
    const currentEntry: TogglTimeEntry = await client.get('/me/time_entries/current')
    return currentEntry || null
  } catch (error: unknown) {
    // 404 means no current timer, which is expected
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Fetch all projects using pagination
 */
async function fetchAllProjects(
  client: ReturnType<typeof createTogglClient>
): Promise<TogglProject[]> {
  const allProjects: TogglProject[] = []
  const perPage = 50
  let page = 1
  let hasMorePages = true

  while (hasMorePages) {
    const projects: TogglProject[] = await client.get(
      `/me/projects?per_page=${perPage}&page=${page}`
    )

    allProjects.push(...projects)
    hasMorePages = projects.length === perPage
    page++

    if (page > 100) {
      throw new Error('Too many pages - possible infinite loop detected')
    }
  }

  return allProjects
}
