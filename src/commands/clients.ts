/**
 * Clients Command - List all clients in workspace
 *
 * Usage: tog clients [--tree]
 *
 * This command displays all clients in the user's default workspace.
 * Supports both table view (default) and hierarchical tree view.
 * Follows the single-file pattern with comprehensive error handling.
 *
 * Flow:
 *   1. Load configuration and validate API token
 *   2. Fetch clients, projects, and tasks (if tree view)
 *   3. Display in requested format (table or tree)
 *   4. Handle empty state gracefully
 */

import { Command } from 'commander'
import { isAxiosError } from 'axios'
import { loadConfig } from '../config/index.js'
import { createTogglClient, TogglClient, TogglProject, TogglTask } from '../api/client.js'
import { formatSuccess, formatError, formatInfo } from '../utils/format.js'

/**
 * Create the clients command
 */
export function createClientsCommand(): Command {
  return new Command('clients')
    .description('List all clients in the workspace')
    .option('-t, --tree', 'Display clients in hierarchical tree format with projects and tasks')
    .action(async (options: { tree?: boolean }) => {
      try {
        console.log(formatInfo('Fetching clients...'))

        // Step 1: Load configuration
        const config = await loadConfig()
        if (!config) {
          console.error(formatError('No configuration found'))
          console.error('Run "tog init" to set up your API token.')
          process.exit(1)
        }

        // Step 2: Create API client and fetch data
        const client = createTogglClient(config.apiToken)
        const [clients, projects] = await Promise.all([
          fetchAllClients(client),
          fetchAllProjects(client)
        ])

        // Step 3: Handle empty state
        if (clients.length === 0) {
          console.log('')
          console.log(formatInfo('No clients found in this workspace'))
          console.log('Create clients at https://track.toggl.com/clients')
          return
        }

        // Step 4: Display in requested format
        if (options.tree) {
          const tasks = await fetchAllTasks(client)
          displayTreeView(clients, projects, tasks)
        } else {
          displayTableView(clients, projects)
        }

      } catch (error) {
        console.error(formatError('Failed to fetch clients'))

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
 * Display clients in table format
 */
function displayTableView(clients: TogglClient[], projects: TogglProject[]): void {
  // Calculate project counts per client
  const clientProjectCounts = new Map<number, number>()
  for (const project of projects) {
    if (project.client_id) {
      const count = clientProjectCounts.get(project.client_id) || 0
      clientProjectCounts.set(project.client_id, count + 1)
    }
  }

  // Sort clients alphabetically by name
  const sortedClients = clients.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )

  console.log('')
  console.log(formatSuccess(`Found ${clients.length} client${clients.length === 1 ? '' : 's'}`))
  console.log('')

  // Create simple table display
  const maxIdWidth = Math.max(2, ...sortedClients.map(c => String(c.id).length))
  const maxNameWidth = Math.max(4, ...sortedClients.map(c => c.name.length))

  // Header
  console.log(
    'ID'.padEnd(maxIdWidth) + '  ' +
    'Name'.padEnd(maxNameWidth) + '  ' +
    'Projects'
  )
  console.log(
    '-'.repeat(maxIdWidth) + '  ' +
    '-'.repeat(maxNameWidth) + '  ' +
    '--------'
  )

  // Client rows
  for (const client of sortedClients) {
    const projectCount = clientProjectCounts.get(client.id) || 0
    console.log(
      String(client.id).padEnd(maxIdWidth) + '  ' +
      client.name.padEnd(maxNameWidth) + '  ' +
      projectCount
    )
  }

  console.log('')
}

/**
 * Display clients in hierarchical tree format
 */
function displayTreeView(clients: TogglClient[], projects: TogglProject[], tasks: TogglTask[]): void {
  // Organize data into hierarchical structure
  const clientProjectMap = new Map<number, TogglProject[]>()
  const projectTaskMap = new Map<number, TogglTask[]>()
  const orphanedProjects: TogglProject[] = []
  const orphanedTasks: TogglTask[] = []

  // Group projects by client
  for (const project of projects) {
    if (project.client_id) {
      if (!clientProjectMap.has(project.client_id)) {
        clientProjectMap.set(project.client_id, [])
      }
      clientProjectMap.get(project.client_id)!.push(project)
    } else {
      orphanedProjects.push(project)
    }
  }

  // Group tasks by project
  for (const task of tasks) {
    if (task.project_id) {
      if (!projectTaskMap.has(task.project_id)) {
        projectTaskMap.set(task.project_id, [])
      }
      projectTaskMap.get(task.project_id)!.push(task)
    } else {
      orphanedTasks.push(task)
    }
  }

  console.log('')
  console.log(formatSuccess(`Found ${clients.length} client${clients.length === 1 ? '' : 's'}`))

  // Display clients with their projects and tasks
  const sortedClients = clients.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )

  console.log('')

  for (const client of sortedClients) {
    const clientProjects = (clientProjectMap.get(client.id) || [])
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

    console.log(`📁 ${client.name}`)

    if (clientProjects.length > 0) {
      displayProjectsWithTasks(clientProjects, projectTaskMap)
    }

    console.log('')
  }

  // Display orphaned projects and tasks (those without clients)
  if (orphanedProjects.length > 0 || orphanedTasks.length > 0) {
    console.log('📁 No Client')

    // Display orphaned projects with their tasks
    const sortedOrphanedProjects = orphanedProjects.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )

    for (let i = 0; i < sortedOrphanedProjects.length; i++) {
      const project = sortedOrphanedProjects[i]
      const isLastProject = i === sortedOrphanedProjects.length - 1 && orphanedTasks.length === 0
      const projectPrefix = isLastProject ? '└── ' : '├── '

      console.log(`${projectPrefix}📋 ${project.name}`)

      const projectTasks = (projectTaskMap.get(project.id) || [])
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

      for (let j = 0; j < projectTasks.length; j++) {
        const task = projectTasks[j]
        const isLastTask = j === projectTasks.length - 1
        const taskPrefix = isLastProject
          ? (isLastTask ? '    └── ' : '    ├── ')
          : (isLastTask ? '│   └── ' : '│   ├── ')

        console.log(`${taskPrefix}📝 ${task.name}`)
      }
    }

    // Display orphaned tasks (those without projects)
    const sortedOrphanedTasks = orphanedTasks.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )

    for (let i = 0; i < sortedOrphanedTasks.length; i++) {
      const task = sortedOrphanedTasks[i]
      const isLastTask = i === sortedOrphanedTasks.length - 1
      const taskPrefix = isLastTask ? '└── ' : '├── '

      console.log(`${taskPrefix}📝 ${task.name}`)
    }

    console.log('')
  }
}

/**
 * Display projects with their tasks in tree format
 */
function displayProjectsWithTasks(projects: TogglProject[], projectTaskMap: Map<number, TogglTask[]>): void {
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i]
    const isLastProject = i === projects.length - 1
    const projectPrefix = isLastProject ? '└── ' : '├── '

    console.log(`${projectPrefix}📋 ${project.name}`)

    const projectTasks = (projectTaskMap.get(project.id) || [])
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

    for (let j = 0; j < projectTasks.length; j++) {
      const task = projectTasks[j]
      const isLastTask = j === projectTasks.length - 1
      const taskPrefix = isLastProject
        ? (isLastTask ? '    └── ' : '    ├── ')
        : (isLastTask ? '│   └── ' : '│   ├── ')

      console.log(`${taskPrefix}📝 ${task.name}`)
    }
  }
}

/**
 * Fetch all clients using pagination
 */
async function fetchAllClients(client: ReturnType<typeof createTogglClient>): Promise<TogglClient[]> {
  const allClients: TogglClient[] = []
  const perPage = 50
  let page = 1
  let hasMorePages = true

  while (hasMorePages) {
    const clients: TogglClient[] = await client.get(
      `/me/clients?per_page=${perPage}&page=${page}`
    )

    allClients.push(...clients)
    hasMorePages = clients.length === perPage
    page++

    if (page > 100) {
      throw new Error('Too many pages - possible infinite loop detected')
    }
  }

  return allClients
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