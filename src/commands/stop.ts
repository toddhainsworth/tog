/**
 * Stop Command - Stop the currently running timer
 *
 * Usage: tog stop
 *
 * This command demonstrates the single-file pattern for state-changing
 * operations. All logic is contained here for immediate understanding.
 *
 * Flow:
 *   1. Load configuration and create API client
 *   2. Check if a timer is currently running
 *   3. If no timer: show helpful message
 *   4. If timer exists: stop it and confirm success
 */

import { isAxiosError } from 'axios'
import { Command } from 'commander'
import { createTogglClient, TogglApiClient, TogglTimeEntry } from '../api/client.js'
import { loadConfig } from '../config/index.js'
import { formatError, formatInfo, formatSuccess } from '../utils/format.js'

/**
 * Create the stop command
 */
export function createStopCommand(): Command {
  return new Command('stop')
    .description('Stop the currently running timer')
    .action(async () => {
      try {
        // Step 1: Load configuration and create client
        const config = await loadConfig()
        const client = createTogglClient(config.apiToken)

        // Step 2: Check for running timer
        const currentEntry = await getCurrentTimeEntry(client)

        if (!currentEntry) {
          console.log(formatInfo('No timer is currently running'))
          return
        }

        // Step 3: Validate timer has required IDs
        if (!currentEntry.workspace_id || !currentEntry.id) {
          throw new Error('Current time entry missing required IDs. Unable to stop timer.')
        }

        // Step 4: Stop the timer
        await stopTimeEntry(client, currentEntry.workspace_id, currentEntry.id)

        // Step 5: Confirm success
        console.log(formatSuccess('Timer stopped successfully!'))
        if (currentEntry.description) {
          console.log(`Stopped: "${currentEntry.description}"`)
        }

      } catch (error: unknown) {
        console.error(formatError('Failed to stop timer'))
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
 * Stop a time entry via the API
 */
async function stopTimeEntry(client: TogglApiClient, workspaceId: number, timeEntryId: number): Promise<void> {
  try {
    await client.patch(`/workspaces/${workspaceId}/time_entries/${timeEntryId}/stop`)
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Timer not found. It may have already been stopped.')
    }
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to stop timer: ${message}`)
  }
}