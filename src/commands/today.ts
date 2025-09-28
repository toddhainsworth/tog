/**
 * Today Command - Display comprehensive daily time tracking summary
 *
 * Usage: tog today
 *
 * This command displays a comprehensive summary of today's time tracking
 * activities, including chronological entries and project aggregations.
 * Follows the single-file pattern with efficient data processing.
 *
 * Flow:
 *   1. Load configuration and get today's date range
 *   2. Fetch time entries, current timer, and projects in parallel
 *   3. Sort entries chronologically and format for display
 *   4. Aggregate by project with percentages
 *   5. Display formatted tables and totals
 */

import { Command } from 'commander'
import { isAxiosError } from 'axios'
import { loadConfig } from '../config/index.js'
import { createTogglClient, TogglTimeEntry, TogglProject } from '../api/client.js'
import { formatSuccess, formatError, formatInfo } from '../utils/format.js'
import {
  getTodayDateRange,
  formatTimeEntry,
  aggregateTimeEntriesByProject,
  formatDuration,
  calculateElapsedSeconds,
  type TimeEntrySummary,
  type ProjectSummary
} from '../utils/time.js'

/**
 * Create the today command
 */
export function createTodayCommand(): Command {
  return new Command('today')
    .description('Display a comprehensive summary of today\'s time tracking activities')
    .action(async () => {
      try {
        console.log(formatInfo('Fetching today\'s time entries...'))

        // Step 1: Load configuration
        const config = await loadConfig()
        if (!config) {
          console.error(formatError('No configuration found'))
          console.error('Run "tog init" to set up your API token.')
          process.exit(1)
        }

        // Step 2: Create API client and fetch data in parallel
        const client = createTogglClient(config.apiToken)
        const dateRange = getTodayDateRange()

        const [timeEntries, currentTimer, projects] = await Promise.all([
          fetchTimeEntries(client, dateRange.start_date, dateRange.end_date),
          getCurrentTimeEntry(client),
          fetchAllProjects(client)
        ])

        const allEntries = [...timeEntries]
        if (currentTimer) {
          allEntries.push(currentTimer)
        }

        console.log('')
        console.log('📅 Today\'s Time Entries')
        console.log('')

        // Step 3: Handle empty state
        if (allEntries.length === 0) {
          console.log(formatInfo('No time entries found for today. Start tracking with "tog start"!'))
          return
        }

        // Step 4: Sort entries chronologically and format
        allEntries.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

        const timeEntrySummaries = allEntries.map(entry => formatTimeEntry(entry, projects))
        const projectSummaries = aggregateTimeEntriesByProject(allEntries, projects)

        // Calculate total time
        let totalSeconds = 0
        for (const entry of allEntries) {
          totalSeconds += entry.stop ? entry.duration : calculateElapsedSeconds(entry.start)
        }

        // Step 5: Display results
        displayTimeEntriesTable(timeEntrySummaries)

        if (projectSummaries.length > 0) {
          console.log('')
          console.log('📊 Project Summary')
          displayProjectSummaryTable(projectSummaries)
        }

        console.log('')
        console.log(formatSuccess(`Total time tracked today: ${formatDuration(totalSeconds)}`))

        if (currentTimer) {
          console.log('')
          console.log(formatInfo('⏰ Timer is currently running'))
        }

      } catch (error) {
        console.error(formatError('Failed to fetch today\'s summary'))

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
 * Display time entries table in chronological order
 */
function displayTimeEntriesTable(entries: TimeEntrySummary[]): void {
  const maxDescriptionWidth = Math.max(11, ...entries.map(e => e.description.length))
  const maxProjectWidth = Math.max(7, ...entries.map(e => (e.projectName || '-').length))

  // Header
  console.log(
    'Start'.padEnd(8) + '  ' +
    'End'.padEnd(8) + '  ' +
    'Duration'.padEnd(8) + '  ' +
    'Description'.padEnd(maxDescriptionWidth) + '  ' +
    'Project'
  )
  console.log(
    '-'.repeat(8) + '  ' +
    '-'.repeat(8) + '  ' +
    '-'.repeat(8) + '  ' +
    '-'.repeat(maxDescriptionWidth) + '  ' +
    '-'.repeat(maxProjectWidth)
  )

  // Entry rows
  for (const entry of entries) {
    console.log(
      entry.startTime.padEnd(8) + '  ' +
      entry.endTime.padEnd(8) + '  ' +
      entry.duration.padEnd(8) + '  ' +
      entry.description.padEnd(maxDescriptionWidth) + '  ' +
      (entry.projectName || '-')
    )
  }
}

/**
 * Display project summary table
 */
function displayProjectSummaryTable(projectSummaries: ProjectSummary[]): void {
  const maxProjectWidth = Math.max(7, ...projectSummaries.map(p => p.projectName.length))

  // Header
  console.log(
    'Project'.padEnd(maxProjectWidth) + '  ' +
    'Duration'.padEnd(10) + '  ' +
    'Percentage'
  )
  console.log(
    '-'.repeat(maxProjectWidth) + '  ' +
    '-'.repeat(10) + '  ' +
    '----------'
  )

  // Project rows
  for (const project of projectSummaries) {
    console.log(
      project.projectName.padEnd(maxProjectWidth) + '  ' +
      project.formattedDuration.padEnd(10) + '  ' +
      `${project.percentage}%`
    )
  }
}

/**
 * Fetch time entries for date range
 */
async function fetchTimeEntries(
  client: ReturnType<typeof createTogglClient>,
  startDate: string,
  endDate: string
): Promise<TogglTimeEntry[]> {
  const start = startDate.split('T')[0] // Get YYYY-MM-DD format
  const end = endDate.split('T')[0]

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
  } catch (error) {
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