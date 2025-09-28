/**
 * Tasks Command - List all tasks in workspace
 *
 * Usage: tog tasks
 *
 * This command displays all tasks in the user's default workspace
 * in a clear table format with project information. Follows the
 * single-file pattern with comprehensive error handling and pagination.
 *
 * Flow:
 *   1. Load configuration and validate API token
 *   2. Fetch all tasks and projects using pagination
 *   3. Create project lookup map for efficient matching
 *   4. Sort tasks alphabetically by name
 *   5. Display in formatted table with ID, Name, Project, and Active status
 *   6. Handle empty state gracefully
 */

import { Command } from 'commander'
import { isAxiosError } from 'axios'
import { loadConfig } from '../config/index.js'
import { createTogglClient, TogglTask, TogglProject } from '../api/client.js'
import { formatSuccess, formatError, formatInfo } from '../utils/format.js'

/**
 * Create the tasks command
 */
export function createTasksCommand(): Command {
  return new Command('tasks')
    .description('List all tasks in the workspace')
    .action(async () => {
      try {
        console.log(formatInfo('Fetching tasks and projects...'))

        // Step 1: Load configuration
        const config = await loadConfig()
        if (!config) {
          console.error(formatError('No configuration found'))
          console.error('Run "tog init" to set up your API token.')
          process.exit(1)
        }

        // Step 2: Create API client and fetch all tasks and projects
        const client = createTogglClient(config.apiToken)
        const [tasks, projects] = await Promise.all([
          fetchAllTasks(client),
          fetchAllProjects(client)
        ])

        // Step 3: Handle empty state
        if (tasks.length === 0) {
          console.log('')
          console.log(formatInfo('No tasks found in this workspace'))
          console.log('Create tasks at https://track.toggl.com/projects')
          return
        }

        // Step 4: Create project lookup map for efficient matching
        const projectMap = new Map<number, string>()
        for (const project of projects) {
          projectMap.set(project.id, project.name)
        }

        // Step 5: Sort tasks alphabetically by name
        const sortedTasks = tasks.sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        )

        // Step 6: Display results
        console.log('')
        console.log(formatSuccess(`Found ${tasks.length} task${tasks.length === 1 ? '' : 's'}`))
        console.log('')

        // Create simple table display
        const maxIdWidth = Math.max(2, ...sortedTasks.map(t => String(t.id).length))
        const maxNameWidth = Math.max(4, ...sortedTasks.map(t => t.name.length))
        const maxProjectWidth = Math.max(7, ...sortedTasks.map(t => {
          const projectName = projectMap.get(t.project_id) || 'No Project'
          return projectName.length
        }))

        // Header
        console.log(
          'ID'.padEnd(maxIdWidth) + '  ' +
          'Name'.padEnd(maxNameWidth) + '  ' +
          'Project'.padEnd(maxProjectWidth) + '  ' +
          'Active'
        )
        console.log(
          '-'.repeat(maxIdWidth) + '  ' +
          '-'.repeat(maxNameWidth) + '  ' +
          '-'.repeat(maxProjectWidth) + '  ' +
          '------'
        )

        // Task rows
        for (const task of sortedTasks) {
          const projectName = projectMap.get(task.project_id) || 'No Project'
          const activeStatus = task.active ? '✓' : '✗'
          console.log(
            String(task.id).padEnd(maxIdWidth) + '  ' +
            task.name.padEnd(maxNameWidth) + '  ' +
            projectName.padEnd(maxProjectWidth) + '  ' +
            activeStatus
          )
        }

        console.log('')

      } catch (error) {
        console.error(formatError('Failed to fetch tasks'))

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
 * Fetch all tasks using pagination
 */
async function fetchAllTasks(client: ReturnType<typeof createTogglClient>): Promise<TogglTask[]> {
  const allTasks: TogglTask[] = []
  const perPage = 50 // Toggl API default page size
  let page = 1
  let hasMorePages = true

  while (hasMorePages) {
    const tasks: TogglTask[] = await client.get(
      `/me/tasks?per_page=${perPage}&page=${page}`
    )

    allTasks.push(...tasks)

    // If we got fewer results than the page size, we've reached the end
    hasMorePages = tasks.length === perPage
    page++

    // Safety check to prevent infinite loops
    if (page > 100) {
      throw new Error('Too many pages - possible infinite loop detected')
    }
  }

  return allTasks
}

/**
 * Fetch all projects using pagination
 */
async function fetchAllProjects(client: ReturnType<typeof createTogglClient>): Promise<TogglProject[]> {
  const allProjects: TogglProject[] = []
  const perPage = 50 // Toggl API default page size
  let page = 1
  let hasMorePages = true

  while (hasMorePages) {
    const projects: TogglProject[] = await client.get(
      `/me/projects?per_page=${perPage}&page=${page}`
    )

    allProjects.push(...projects)

    // If we got fewer results than the page size, we've reached the end
    hasMorePages = projects.length === perPage
    page++

    // Safety check to prevent infinite loops
    if (page > 100) {
      throw new Error('Too many pages - possible infinite loop detected')
    }
  }

  return allProjects
}