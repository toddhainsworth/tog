/**
 * Search Command - Search time entries by description text
 *
 * Usage: tog search <query> [options]
 *
 * This command searches through time entries to find matches in the description
 * field. Supports flexible date range filtering.
 *
 * Flow:
 *   1. Parse search query and date range flags
 *   2. Determine search scope (month, year, or all)
 *   3. Fetch matching time entries from API
 *   4. Fetch projects for display names
 *   5. Display results in formatted table
 */

import { Command } from 'commander'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import Table from 'cli-table3'
import { createTogglClient, TogglApiClient, TogglTimeEntry, TogglProject } from '../api/client.js'
import { loadConfig } from '../config/index.js'
import { formatSuccess, formatError, formatInfo, formatWarning } from '../utils/format.js'
import { formatDuration, formatStartTime, setTimezone } from '../utils/time.js'

dayjs.extend(utc)

interface TimeEntrySummary {
  date: string
  startTime: string
  duration: string
  description: string
  projectName: string
}

interface DateRange {
  start_date: string
  end_date: string
}

/**
 * Create the search command
 */
export function createSearchCommand(): Command {
  return new Command('search')
    .description('Search time entries by description text')
    .argument('<query>', 'Search query to find in time entry descriptions')
    .action(async (query: string) => {
      try {
        // Step 1: Load configuration and create client
        const config = await loadConfig()

        // Set timezone from config for consistent date handling
        setTimezone(config.timezone)

        const client = createTogglClient(config.apiToken)

        // Step 2: Get current month date range
        const dateRange = getCurrentMonthDateRange()
        const scopeDescription = 'this month'

        console.log(formatInfo(`Searching for "${query}" in ${scopeDescription}...`))

        // Step 3: Fetch matching time entries and projects
        const [timeEntries, projects] = await Promise.all([
          fetchTimeEntriesWithSearch(client, config.workspaceId, dateRange),
          fetchAllProjects(client, config.workspaceId),
        ])

        // Step 4: Filter entries that match the query (case-insensitive)
        const searchLower = query.toLowerCase()
        const matchingEntries = timeEntries.filter(
          entry => entry.description && entry.description.toLowerCase().includes(searchLower)
        )

        if (matchingEntries.length === 0) {
          console.log('')
          console.log(
            formatWarning(`No time entries found matching "${query}" for ${scopeDescription}`)
          )
          console.log('')
          console.log(formatInfo('No matching entries found for this month'))
          return
        }

        // Step 5: Sort by date (newest first) and format for display
        matchingEntries.sort((a, b) => dayjs(b.start).valueOf() - dayjs(a.start).valueOf())

        const projectMap = new Map(projects.map(p => [p.id, p]))
        const summaries = matchingEntries.map(entry => formatTimeEntry(entry, projectMap))

        // Calculate total duration
        const totalSeconds = matchingEntries.reduce((sum, entry) => {
          // For running timers, calculate elapsed time
          if (entry.duration < 0) {
            const elapsed = dayjs().diff(dayjs(entry.start), 'second')
            return sum + elapsed
          }
          return sum + entry.duration
        }, 0)

        // Step 6: Display results
        console.log('')
        console.log(`🔍 Search Results: "${query}" (${scopeDescription})`)
        console.log(
          `Found ${matchingEntries.length} matching ${matchingEntries.length === 1 ? 'entry' : 'entries'}`
        )
        console.log('')

        displaySearchResultsTable(summaries)

        console.log('')
        console.log(formatSuccess(`Total time found: ${formatDuration(totalSeconds)}`))
      } catch (error: unknown) {
        console.error(formatError('Search failed'))
        console.error(`  ${(error as Error).message}`)
        process.exit(1)
      }
    })
}

/**
 * Get date range for current month
 */
function getCurrentMonthDateRange(): DateRange {
  const now = dayjs().utc()
  const startOfMonth = now.startOf('month')
  const endOfMonth = now.endOf('month')

  return {
    start_date: startOfMonth.format('YYYY-MM-DD'),
    end_date: endOfMonth.format('YYYY-MM-DD'),
  }
}

/**
 * Fetch all time entries in date range
 */
async function fetchTimeEntriesWithSearch(
  client: TogglApiClient,
  workspaceId: number,
  dateRange: DateRange
): Promise<TogglTimeEntry[]> {
  // Note: Toggl API doesn't have a search parameter, so we fetch all in range and filter client-side
  // The /me/time_entries endpoint returns all entries for the date range in a single response
  const start = dateRange.start_date
  const end = dateRange.end_date

  return await client.get(`/me/time_entries?start_date=${start}&end_date=${end}`)
}

/**
 * Fetch all projects with pagination
 */
async function fetchAllProjects(
  client: TogglApiClient,
  workspaceId: number
): Promise<TogglProject[]> {
  const allProjects: TogglProject[] = []
  const maxPages = 50
  const perPage = 200
  let page = 1

  while (page <= maxPages) {
    const projects: TogglProject[] = await client.get(
      `/workspaces/${workspaceId}/projects?page=${page}&per_page=${perPage}`
    )

    if (!projects || projects.length === 0) {
      break
    }

    allProjects.push(...projects)

    if (projects.length < perPage) {
      break
    }

    page++
  }

  return allProjects
}

/**
 * Format time entry for display
 */
function formatTimeEntry(
  entry: TogglTimeEntry,
  projectMap: Map<number, TogglProject>
): TimeEntrySummary {
  const project = entry.project_id ? projectMap.get(entry.project_id) : undefined
  const date = dayjs(entry.start).format('YYYY-MM-DD')
  const startTime = formatStartTime(entry.start)

  let duration: string
  if (entry.duration < 0) {
    // Running timer
    const elapsed = dayjs().diff(dayjs(entry.start), 'second')
    duration = formatDuration(elapsed)
  } else {
    duration = formatDuration(entry.duration)
  }

  return {
    date,
    startTime,
    duration,
    description: entry.description || '(no description)',
    projectName: project?.name || '-',
  }
}

/**
 * Display search results in table format using cli-table3
 */
function displaySearchResultsTable(entries: TimeEntrySummary[]): void {
  const table = new Table({
    colWidths: [12, 10, 10, 35, 25],
    head: ['Date', 'Start', 'Duration', 'Description', 'Project'],
    style: {
      border: ['gray'],
      head: ['cyan'],
    },
    wordWrap: true,
  })

  // Add rows to table
  for (const entry of entries) {
    table.push([entry.date, entry.startTime, entry.duration, entry.description, entry.projectName])
  }

  console.log(table.toString())
}
