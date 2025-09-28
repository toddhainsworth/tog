/**
 * Edit Command - Modify the currently running timer
 *
 * Usage: tog edit
 *
 * This command allows users to modify the currently running timer's
 * description, project, and task through interactive prompts.
 * Follows the single-file pattern with comprehensive validation.
 *
 * Flow:
 *   1. Load configuration and check for running timer
 *   2. Show current timer details
 *   3. Present interactive prompts for modifications
 *   4. Update timer with new settings
 *   5. Display confirmation with changes made
 */

import { Command } from 'commander'
import { input, select, confirm } from '@inquirer/prompts'
import { type } from 'arktype'
import { isAxiosError } from 'axios'
import { loadConfig } from '../config/index.js'
import { createTogglClient, TogglTimeEntry, TogglProject, TogglTask } from '../api/client.js'
import { formatSuccess, formatError, formatInfo, formatWarning } from '../utils/format.js'

/**
 * Schema for timer update data
 */
const TimerUpdateSchema = type({
  description: 'string?',
  project_id: 'number | null?',
  task_id: 'number | null?'
})

/**
 * Schema for timer description validation
 */
const TimerDescriptionSchema = type('string<=200')

/**
 * Type definitions inferred from schemas
 */
type TimerUpdateData = typeof TimerUpdateSchema.infer

/**
 * Create the edit command
 */
export function createEditCommand(): Command {
  return new Command('edit')
    .description('Edit the currently running timer')
    .action(async () => {
      try {
        console.log(formatInfo('Checking for running timer...'))

        // Step 1: Load configuration
        const config = await loadConfig()
        if (!config) {
          console.error(formatError('No configuration found'))
          console.error('Run "tog init" to set up your API token.')
          process.exit(1)
        }

        const client = createTogglClient(config.apiToken)

        // Step 2: Get current timer
        const currentTimer = await getCurrentTimeEntry(client)
        if (!currentTimer) {
          console.log('')
          console.log(formatInfo('No timer is currently running'))
          console.log('Start a timer with "tog start" first.')
          return
        }

        // Step 3: Fetch reference data for projects and tasks
        const [projects, tasks] = await Promise.all([
          fetchAllProjects(client),
          fetchAllTasks(client)
        ])

        // Step 4: Show current timer details
        showCurrentTimer(currentTimer, projects, tasks)

        // Step 5: Interactive editing
        const updates = await collectEdits(currentTimer, projects, tasks)

        if (Object.keys(updates).length === 0) {
          console.log('')
          console.log(formatInfo('No changes made'))
          return
        }

        // Step 6: Validate and update timer
        const validatedUpdates = TimerUpdateSchema(updates)
        if (validatedUpdates instanceof type.errors) {
          throw new Error(`Invalid update data: ${validatedUpdates.summary}`)
        }

        const updatedTimer = await updateTimer(client, currentTimer.id, validatedUpdates)

        // Step 7: Show success and changes
        console.log('')
        console.log(formatSuccess('Timer updated successfully!'))
        showUpdateSummary(currentTimer, updatedTimer, projects, tasks)

      } catch (error) {
        console.error(formatError('Failed to edit timer'))

        if (isAxiosError(error) && error.response) {
          const status = error.response.status
          if (status === 401) {
            console.error('Invalid API token. Run "tog init" to update your credentials.')
          } else if (status === 403) {
            console.error('Access denied. Check your API token permissions.')
          } else if (status === 404) {
            console.error('Timer not found. It may have been stopped or deleted.')
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
 * Get currently running timer
 */
async function getCurrentTimeEntry(client: ReturnType<typeof createTogglClient>): Promise<TogglTimeEntry | null> {
  try {
    const currentEntry: TogglTimeEntry = await client.get('/me/time_entries/current')
    return currentEntry || null
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Show current timer details
 */
function showCurrentTimer(timer: TogglTimeEntry, projects: TogglProject[], tasks: TogglTask[]): void {
  console.log('')
  console.log('📋 Current timer:')
  console.log(`Description: "${timer.description || 'Untitled'}"`)

  if (timer.project_id) {
    const project = projects.find(p => p.id === timer.project_id)
    console.log(`Project: ${project?.name || `ID ${timer.project_id}`}`)
  } else {
    console.log('Project: None')
  }

  if (timer.task_id) {
    const task = tasks.find(t => t.id === timer.task_id)
    console.log(`Task: ${task?.name || `ID ${timer.task_id}`}`)
  } else {
    console.log('Task: None')
  }

  console.log('')
}

/**
 * Collect edits through interactive prompts
 */
async function collectEdits(
  currentTimer: TogglTimeEntry,
  projects: TogglProject[],
  tasks: TogglTask[]
): Promise<TimerUpdateData> {
  const updates: TimerUpdateData = {}

  // Edit description
  const editDescription = await confirm({
    message: 'Edit description?',
    default: false
  })

  if (editDescription) {
    const newDescription = await input({
      message: 'New description:',
      default: currentTimer.description || '',
      validate: (input: string) => {
        const validation = TimerDescriptionSchema(input)
        if (validation instanceof type.errors) {
          return 'Description must be 200 characters or less'
        }
        return true
      }
    })

    if (newDescription !== (currentTimer.description || '')) {
      updates.description = newDescription
    }
  }

  // Edit project
  const editProject = await confirm({
    message: 'Edit project?',
    default: false
  })

  if (editProject) {
    const projectChoices = [
      { name: 'No Project', value: null },
      ...projects
        .filter(p => p.active)
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        .map(p => ({ name: p.name, value: p.id }))
    ]

    const selectedProjectId = await select({
      message: 'Select project:',
      choices: projectChoices,
      default: currentTimer.project_id || null
    })

    if (selectedProjectId !== (currentTimer.project_id || null)) {
      updates.project_id = selectedProjectId
      // Clear task if project changed
      if (currentTimer.task_id) {
        updates.task_id = null
      }
    }
  }

  // Edit task (only if project is selected)
  const finalProjectId = updates.project_id !== undefined ? updates.project_id : currentTimer.project_id

  if (finalProjectId) {
    const editTask = await confirm({
      message: 'Edit task?',
      default: false
    })

    if (editTask) {
      const projectTasks = tasks.filter(t => t.project_id === finalProjectId && t.active)

      if (projectTasks.length > 0) {
        const taskChoices = [
          { name: 'No Task', value: null },
          ...projectTasks
            .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
            .map(t => ({ name: t.name, value: t.id }))
        ]

        const selectedTaskId = await select({
          message: 'Select task:',
          choices: taskChoices,
          default: currentTimer.task_id || null
        })

        if (selectedTaskId !== (currentTimer.task_id || null)) {
          updates.task_id = selectedTaskId
        }
      } else {
        console.log(formatWarning('No tasks available for this project'))
      }
    }
  }

  return updates
}

/**
 * Update timer with new settings
 */
async function updateTimer(
  client: ReturnType<typeof createTogglClient>,
  timerId: number,
  updates: TimerUpdateData
): Promise<TogglTimeEntry> {
  // Convert validated updates to the format expected by the API
  const updateData: Record<string, unknown> = {}

  if (updates.description !== undefined) {
    updateData.description = updates.description
  }

  if (updates.project_id !== undefined) {
    updateData.project_id = updates.project_id
  }

  if (updates.task_id !== undefined) {
    updateData.task_id = updates.task_id
  }

  return await client.put(`/me/time_entries/${timerId}`, updateData)
}

/**
 * Show summary of changes made
 */
function showUpdateSummary(
  originalTimer: TogglTimeEntry,
  updatedTimer: TogglTimeEntry,
  projects: TogglProject[],
  tasks: TogglTask[]
): void {
  console.log('')
  console.log('📝 Changes made:')

  // Description changes
  if (originalTimer.description !== updatedTimer.description) {
    console.log(`Description: "${originalTimer.description || 'Untitled'}" → "${updatedTimer.description || 'Untitled'}"`)
  }

  // Project changes
  if (originalTimer.project_id !== updatedTimer.project_id) {
    const oldProject = originalTimer.project_id ?
      projects.find(p => p.id === originalTimer.project_id)?.name || `ID ${originalTimer.project_id}` :
      'None'
    const newProject = updatedTimer.project_id ?
      projects.find(p => p.id === updatedTimer.project_id)?.name || `ID ${updatedTimer.project_id}` :
      'None'
    console.log(`Project: ${oldProject} → ${newProject}`)
  }

  // Task changes
  if (originalTimer.task_id !== updatedTimer.task_id) {
    const oldTask = originalTimer.task_id ?
      tasks.find(t => t.id === originalTimer.task_id)?.name || `ID ${originalTimer.task_id}` :
      'None'
    const newTask = updatedTimer.task_id ?
      tasks.find(t => t.id === updatedTimer.task_id)?.name || `ID ${updatedTimer.task_id}` :
      'None'
    console.log(`Task: ${oldTask} → ${newTask}`)
  }

  console.log('')
}

/**
 * Fetch all projects using pagination
 */
async function fetchAllProjects(client: ReturnType<typeof createTogglClient>): Promise<TogglProject[]> {
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
    const tasks: TogglTask[] = await client.get(
      `/me/tasks?per_page=${perPage}&page=${page}`
    )

    allTasks.push(...tasks)
    hasMorePages = tasks.length === perPage
    page++

    if (page > 100) {
      throw new Error('Too many pages - possible infinite loop detected')
    }
  }

  return allTasks
}