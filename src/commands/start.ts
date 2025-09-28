/**
 * Start Command - Start a new time tracking timer
 *
 * Usage: tog start
 *
 * This command demonstrates the single-file pattern for complex interactive
 * operations. All logic is contained here for immediate understanding.
 *
 * Flow:
 *   1. Load configuration and create API client
 *   2. Check if a timer is already running
 *   3. Interactive prompt for timer description
 *   4. Interactive project selection (with search)
 *   5. Interactive task selection (if project has tasks)
 *   6. Create and start the timer
 *   7. Confirm success with timer details
 */

import { confirm, input, select } from '@inquirer/prompts'
import { type } from 'arktype'
import { isAxiosError } from 'axios'
import { Command } from 'commander'
import dayjs from 'dayjs'
import { createTogglClient, TogglApiClient, TogglProject, TogglTask, TogglTimeEntry, TogglUser } from '../api/client.js'
import { loadConfig } from '../config/index.js'
import { formatError, formatInfo, formatSuccess, formatWarning } from '../utils/format.js'

/**
 * Schema for timer data when starting a new timer
 */
const StartTimerDataSchema = type({
  description: 'string',
  duration: 'number',
  start: 'string',
  project_id: 'number?',
  task_id: 'number?',
  workspace_id: 'number',
  created_with: 'string'
})

/**
 * Schema for timer description validation
 */
const TimerDescriptionSchema = type('string<=200')

/**
 * Type definitions inferred from schemas
 */
type StartTimerData = typeof StartTimerDataSchema.infer

/**
 * Create the start command
 */
export function createStartCommand(): Command {
  return new Command('start')
    .description('Start a new time tracking timer')
    .action(async () => {
      try {
        // Step 1: Load configuration and create client
        const config = await loadConfig()
        const client = createTogglClient(config.apiToken)

        // Step 2: Check for running timer
        const currentEntry = await getCurrentTimeEntry(client)
        if (currentEntry) {
          console.log(formatWarning('Timer is already running'))
          console.log(`Current: "${currentEntry.description || 'No description'}"`)
          console.log('')

          const shouldStop = await confirm({
            message: 'Do you want to stop the current timer and start a new one?',
            default: false
          })

          if (!shouldStop) {
            console.log(formatInfo('Timer start cancelled'))
            return
          }

          // Stop current timer
          if (currentEntry.workspace_id && currentEntry.id) {
            await stopTimeEntry(client, currentEntry.workspace_id, currentEntry.id)
            console.log(formatSuccess('Previous timer stopped'))
          }
        }

        // Step 3: Get timer description
        const description = await getTimerDescription()

        // Step 4: Get user's workspace (needed for API calls)
        const user: TogglUser = await client.get('/me')
        const workspaceId = user.default_workspace_id

        // Step 5: Project selection
        const selectedProject = await selectProject(client, workspaceId)

        // Step 6: Task selection (if project has tasks)
        let selectedTask: TogglTask | undefined
        if (selectedProject) {
          selectedTask = await selectTask(client, workspaceId, selectedProject.id)
        }

        // Step 7: Create and start timer
        const timerData: StartTimerData = {
          description,
          duration: -1, // Negative duration indicates running timer
          start: dayjs().toISOString(), // Current time as start time
          workspace_id: workspaceId,
          created_with: 'tog-cli',
        }

        if (selectedProject) {
          timerData.project_id = selectedProject.id
        }

        if (selectedTask) {
          timerData.task_id = selectedTask.id
        }

        // Validate timer data before sending to API
        const validatedData = StartTimerDataSchema.assert(timerData)
        const newTimer = await createTimer(client, workspaceId, validatedData)

        // Step 8: Confirm success
        console.log('')
        console.log(formatSuccess('Timer started successfully!'))
        console.log(`📝 Description: ${description || 'No description'}`)

        if (selectedProject) {
          console.log(`📂 Project: ${selectedProject.name}`)
        }

        if (selectedTask) {
          console.log(`📋 Task: ${selectedTask.name}`)
        }

      } catch (error) {
        console.error(formatError('Failed to start timer'))
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
 * Stop a time entry via the API
 */
async function stopTimeEntry(client: TogglApiClient, workspaceId: number, timeEntryId: number): Promise<void> {
  try {
    await client.put(`/workspaces/${workspaceId}/time_entries/${timeEntryId}/stop`)
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Timer not found. It may have already been stopped.')
    }
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to stop timer: ${message}`)
  }
}

/**
 * Interactive prompt for timer description
 */
async function getTimerDescription(): Promise<string> {
  const description = await input({
    message: 'Enter timer description (optional):',
    validate: (input: string) => {
      const trimmed = input.trim()
      const validation = TimerDescriptionSchema(trimmed)
      if (validation instanceof type.errors) {
        return 'Description must be 200 characters or less'
      }
      return true
    }
  })

  return description.trim()
}

/**
 * Interactive project selection
 */
async function selectProject(client: TogglApiClient, workspaceId: number): Promise<TogglProject | undefined> {
  try {
    // Fetch available projects
    const projects: TogglProject[] = await client.get(`/workspaces/${workspaceId}/projects`)

    if (projects.length === 0) {
      console.log(formatInfo('No projects available'))
      return undefined
    }

    // Create choices with "No project" option
    const choices = [
      {
        name: 'No project',
        value: null
      },
      ...projects.map(project => ({
        name: project.name,
        value: project
      }))
    ]

    const selectedProject = await select({
      message: 'Select a project:',
      choices
    })

    return selectedProject || undefined
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to fetch projects: ${message}`)
  }
}

/**
 * Interactive task selection for a project
 */
async function selectTask(client: TogglApiClient, workspaceId: number, projectId: number): Promise<TogglTask | undefined> {
  try {
    // Fetch all tasks for the user, then filter by project
    const allTasks: TogglTask[] = await client.get('/me/tasks?meta=true')
    const projectTasks = allTasks.filter(task => task.project_id === projectId)

    if (projectTasks.length === 0) {
      return undefined
    }

    // Create choices with "No task" option
    const choices = [
      {
        name: 'No task',
        value: null
      },
      ...projectTasks.map(task => ({
        name: task.name,
        value: task
      }))
    ]

    const selectedTask = await select({
      message: 'Select a task:',
      choices
    })

    return selectedTask || undefined
  } catch (error: unknown) {
    // If user has no tasks or endpoint fails, that's ok
    if (isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 403)) {
      return undefined
    }
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to fetch tasks: ${message}`)
  }
}

/**
 * Create a new timer via the API
 */
async function createTimer(client: TogglApiClient, workspaceId: number, timerData: StartTimerData): Promise<TogglTimeEntry> {
  try {
    const timer: TogglTimeEntry = await client.post(`/workspaces/${workspaceId}/time_entries?meta=true`, timerData)
    return timer
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error('Invalid timer data. Please check your input.')
      }
      if (error.response?.status === 403) {
        throw new Error('Permission denied. Check your workspace access.')
      }
    }
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to create timer: ${message}`)
  }
}