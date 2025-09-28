/**
 * Current Command - Show currently running timer
 *
 * Usage: tog current
 *
 * This command demonstrates the single-file pattern by containing all
 * logic needed to check and display the current timer status.
 *
 * Flow:
 *   1. Load configuration and create API client
 *   2. Fetch current time entry from Toggl API
 *   3. Display timer details or "no timer running" message
 *   4. Optionally fetch project/task names for enhanced display
 */

import { Command } from 'commander'
import { isAxiosError } from 'axios'
import { loadConfig } from '../config/index.js'
import { createTogglClient, TogglApiClient, TogglTimeEntry, TogglProject, TogglTask } from '../api/client.js'
import { formatSuccess, formatError, formatInfo } from '../utils/format.js'
import { calculateElapsedSeconds, formatDuration, formatStartTime } from '../utils/format.js'

/**
 * Create the current command
 */
export function createCurrentCommand(): Command {
  return new Command('current')
    .description('Show currently running timer')
    .action(async () => {
      try {
        // Step 1: Load configuration and create client
        const config = await loadConfig()
        const client = createTogglClient(config.apiToken)

        // Step 2: Fetch current time entry
        const currentEntry = await getCurrentTimeEntry(client)

        // Step 3: Display results
        if (!currentEntry) {
          console.log(formatInfo('No timer currently running'))
          return
        }

        // Step 4: Display timer details
        await displayTimerDetails(client, currentEntry)

      } catch (error) {
        console.error(formatError('Failed to fetch timer status'))
        console.error(`  ${(error as Error).message}`)
        process.exit(1)
      }
    })
}

/**
 * Fetch the current time entry from the API
 */
async function getCurrentTimeEntry(client: TogglApiClient): Promise<TogglTimeEntry | null> {
  try {
    const currentEntry: TogglTimeEntry = await client.get('/me/time_entries/current')
    return currentEntry
  } catch (error: unknown) {
    // Use axios type guard for better type safety
    if (isAxiosError(error)) {
      // If API returns 200 with null/empty response, no timer is running
      if (error.response?.status === 200 || !error.response) {
        return null
      }
    }
    throw error
  }
}

/**
 * Display detailed information about the running timer
 */
async function displayTimerDetails(client: TogglApiClient, timeEntry: TogglTimeEntry): Promise<void> {
  console.log(formatSuccess('Timer is running'))
  console.log('')

  // Basic timer information
  console.log(`📝 Description: ${timeEntry.description || 'No description'}`)

  // Calculate and display elapsed time
  const elapsedSeconds = calculateElapsedSeconds(timeEntry.start)
  const elapsedTime = formatDuration(elapsedSeconds, true) // Use precise HH:MM:SS format
  console.log(formatInfo(`Elapsed time: ${elapsedTime}`))

  // Display start time
  const startTime = formatStartTime(timeEntry.start)
  console.log(formatInfo(`Started at: ${startTime}`))

  // Fetch and display project information if available
  if (timeEntry.project_id) {
    try {
      const project: TogglProject = await client.get(`/workspaces/${timeEntry.workspace_id}/projects/${timeEntry.project_id}`)
      console.log(formatInfo(`Project: ${project.name}`))
    } catch {
      // Silently ignore project lookup errors - project might be archived/deleted
    }
  }

  // Fetch and display task information if available
  if (timeEntry.task_id) {
    try {
      const task: TogglTask = await client.get(`/workspaces/${timeEntry.workspace_id}/tasks/${timeEntry.task_id}`)
      console.log(formatInfo(`Task: ${task.name}`))
    } catch {
      // Silently ignore task lookup errors - task might be archived/deleted
    }
  }
}