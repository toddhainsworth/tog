/**
 * Projects Command - List all projects in workspace
 *
 * Usage: tog projects
 *
 * This command displays all projects in the user's default workspace
 * in a clear table format. Follows the single-file pattern with
 * comprehensive error handling and pagination support.
 *
 * Flow:
 *   1. Load configuration and validate API token
 *   2. Fetch all projects using pagination
 *   3. Sort projects alphabetically by name
 *   4. Display in formatted table with ID, Name, and Active status
 *   5. Handle empty state gracefully
 */

import { Command } from 'commander'
import { isAxiosError } from 'axios'
import { loadConfig } from '../config/index.js'
import { createTogglClient, TogglProject } from '../api/client.js'
import { formatSuccess, formatError, formatInfo } from '../utils/format.js'

/**
 * Create the projects command
 */
export function createProjectsCommand(): Command {
  return new Command('projects')
    .description('List all projects in the workspace')
    .action(async () => {
      try {
        console.log(formatInfo('Fetching projects...'))

        // Step 1: Load configuration
        const config = await loadConfig()
        if (!config) {
          console.error(formatError('No configuration found'))
          console.error('Run "tog init" to set up your API token.')
          process.exit(1)
        }

        // Step 2: Create API client and fetch all projects with pagination
        const client = createTogglClient(config.apiToken)
        const projects = await fetchAllProjects(client)

        // Step 3: Handle empty state
        if (projects.length === 0) {
          console.log('')
          console.log(formatInfo('No projects found in this workspace'))
          console.log('Create projects at https://track.toggl.com/projects')
          return
        }

        // Step 4: Sort projects alphabetically by name
        const sortedProjects = projects.sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        )

        // Step 5: Display results
        console.log('')
        console.log(formatSuccess(`Found ${projects.length} project${projects.length === 1 ? '' : 's'}`))
        console.log('')

        // Create simple table display
        const maxIdWidth = Math.max(2, ...sortedProjects.map(p => String(p.id).length))
        const maxNameWidth = Math.max(4, ...sortedProjects.map(p => p.name.length))

        // Header
        console.log(
          'ID'.padEnd(maxIdWidth) + '  ' +
          'Name'.padEnd(maxNameWidth) + '  ' +
          'Active'
        )
        console.log(
          '-'.repeat(maxIdWidth) + '  ' +
          '-'.repeat(maxNameWidth) + '  ' +
          '------'
        )

        // Project rows
        for (const project of sortedProjects) {
          const activeStatus = project.active ? '✓' : '✗'
          console.log(
            String(project.id).padEnd(maxIdWidth) + '  ' +
            project.name.padEnd(maxNameWidth) + '  ' +
            activeStatus
          )
        }

        console.log('')

      } catch (error) {
        console.error(formatError('Failed to fetch projects'))

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