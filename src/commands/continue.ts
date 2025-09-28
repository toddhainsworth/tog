/**
 * Continue Command - Restart a recent timer
 *
 * Usage: tog continue
 *
 * This command allows users to restart a recent timer with the same
 * settings (description, project, task). Shows recent timers and lets
 * users select one to continue. Follows the single-file pattern.
 *
 * Flow:
 *   1. Load configuration and check for running timer
 *   2. Fetch recent time entries
 *   3. Present interactive selection of recent timers
 *   4. Start new timer with selected settings
 *   5. Display confirmation
 */

import { Command } from 'commander'
import { select } from '@inquirer/prompts'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { loadConfig } from '../config/index.js'
import { createTogglClient, TogglTimeEntry, TogglProject, TogglTask } from '../api/client.js'
import { formatSuccess, formatError, formatInfo, formatWarning } from '../utils/format.js'

interface RecentTimer {
  description: string
  project_id?: number
  task_id?: number
  project_name?: string
  task_name?: string
  last_used: string
}

/**
 * Create the continue command
 */
export function createContinueCommand(): Command {
  return new Command('continue')
    .description('Continue a recent timer with the same settings')
    .action(async () => {
      try {
        console.log(formatInfo('Checking for recent timers...'))

        // Step 1: Load configuration
        const config = await loadConfig()
        if (!config) {
          console.error(formatError('No configuration found'))
          console.error('Run "tog init" to set up your API token.')
          process.exit(1)
        }

        const client = createTogglClient(config.apiToken)

        // Step 2: Check if there's already a running timer
        const currentTimer = await getCurrentTimeEntry(client)
        if (currentTimer) {
          console.log('')
          console.log(
            formatWarning(`Timer is already running: "${currentTimer.description || 'Untitled'}"`)
          )
          console.log('Use "tog stop" to stop the current timer before continuing a previous one.')
          return
        }

        // Step 3: Fetch recent time entries and reference data
        const [recentEntries, projects, tasks] = await Promise.all([
          getRecentTimeEntries(client),
          fetchAllProjects(client),
          fetchAllTasks(client),
        ])

        // Step 4: Process recent timers
        const recentTimers = processRecentTimers(recentEntries, projects, tasks)

        if (recentTimers.length === 0) {
          console.log('')
          console.log(formatInfo('No recent timers found'))
          console.log('Use "tog start" to create your first timer!')
          return
        }

        // Step 5: Interactive selection
        const selectedTimer = await selectRecentTimer(recentTimers)

        // Step 6: Start new timer with selected settings
        await startContinuedTimer(client, config.workspaceId, selectedTimer)

        console.log('')
        console.log(formatSuccess('Timer continued successfully!'))
        console.log('')
        console.log(`Description: "${selectedTimer.description || 'Untitled'}"`)
        if (selectedTimer.project_name) {
          console.log(`Project: ${selectedTimer.project_name}`)
        }
        if (selectedTimer.task_name) {
          console.log(`Task: ${selectedTimer.task_name}`)
        }
      } catch (error: unknown) {
        console.error(formatError('Failed to continue timer'))

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
 * Check for currently running timer
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
 * Get recent time entries (last 30 days, stopped only)
 */
async function getRecentTimeEntries(
  client: ReturnType<typeof createTogglClient>
): Promise<TogglTimeEntry[]> {
  const endDateStr = dayjs().format('YYYY-MM-DD')
  const startDateStr = dayjs().subtract(30, 'days').format('YYYY-MM-DD')

  const entries: TogglTimeEntry[] = await client.get(
    `/me/time_entries?start_date=${startDateStr}&end_date=${endDateStr}`
  )

  // Filter to only stopped entries and sort by most recent
  return entries
    .filter(entry => entry.stop) // Only completed entries
    .sort((a, b) => dayjs(b.stop!).valueOf() - dayjs(a.stop!).valueOf())
    .slice(0, 10) // Limit to 10 most recent
}

/**
 * Process recent time entries into unique timer configurations
 */
function processRecentTimers(
  entries: TogglTimeEntry[],
  projects: TogglProject[],
  tasks: TogglTask[]
): RecentTimer[] {
  const projectMap = new Map(projects.map(p => [p.id, p.name]))
  const taskMap = new Map(tasks.map(t => [t.id, t.name]))
  const seen = new Set<string>()
  const timers: RecentTimer[] = []

  for (const entry of entries) {
    // Create unique key for this timer configuration
    const key = `${entry.description || ''}|${entry.project_id || ''}|${entry.task_id || ''}`

    if (!seen.has(key)) {
      seen.add(key)

      timers.push({
        description: entry.description || '',
        project_id: entry.project_id,
        task_id: entry.task_id,
        project_name: entry.project_id ? projectMap.get(entry.project_id) : undefined,
        task_name: entry.task_id ? taskMap.get(entry.task_id) : undefined,
        last_used: entry.stop!,
      })
    }
  }

  return timers
}

/**
 * Interactive selection of recent timer
 */
async function selectRecentTimer(timers: RecentTimer[]): Promise<RecentTimer> {
  const choices = timers.map(timer => {
    const description = timer.description || 'Untitled'
    const project = timer.project_name ? ` • ${timer.project_name}` : ''
    const task = timer.task_name ? ` • ${timer.task_name}` : ''
    const lastUsed = dayjs(timer.last_used).format('MM/DD/YYYY')

    return {
      name: `${description}${project}${task} (${lastUsed})`,
      value: timer,
    }
  })

  return await select({
    message: 'Which timer would you like to continue?',
    choices,
  })
}

/**
 * Start new timer with continued settings
 */
async function startContinuedTimer(
  client: ReturnType<typeof createTogglClient>,
  workspaceId: number,
  timer: RecentTimer
): Promise<void> {
  const timeEntryData: Record<string, unknown> = {
    description: timer.description,
    duration: -1, // Negative duration indicates running timer
    start: dayjs().toISOString(),
    workspace_id: workspaceId,
    created_with: 'tog-cli',
  }

  if (timer.project_id) {
    timeEntryData.project_id = timer.project_id
  }

  if (timer.task_id) {
    timeEntryData.task_id = timer.task_id
  }

  await client.post(`/workspaces/${workspaceId}/time_entries`, timeEntryData)
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

/**
 * Fetch all tasks using pagination
 */
async function fetchAllTasks(client: ReturnType<typeof createTogglClient>): Promise<TogglTask[]> {
  const allTasks: TogglTask[] = []
  const perPage = 50
  let page = 1
  let hasMorePages = true

  while (hasMorePages) {
    const tasks: TogglTask[] = await client.get(`/me/tasks?per_page=${perPage}&page=${page}`)

    allTasks.push(...tasks)
    hasMorePages = tasks.length === perPage
    page++

    if (page > 100) {
      throw new Error('Too many pages - possible infinite loop detected')
    }
  }

  return allTasks
}
