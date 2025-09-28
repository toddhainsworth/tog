/**
 * Ping Command - Test connection to Toggl API
 *
 * Usage: tog ping
 *
 * This command demonstrates the new single-file pattern where all
 * command logic is contained in one readable file.
 *
 * Flow:
 *   1. Load API token from configuration
 *   2. Make authenticated request to /me endpoint
 *   3. Display connection status and user information
 *   4. Handle common error scenarios with helpful messages
 */

import { Command } from 'commander'
import { loadConfig } from '../config/index.js'
import { createTogglClient, TogglUser } from '../api/client.js'
import { formatSuccess, formatError, formatInfo } from '../utils/format.js'

/**
 * Create the ping command
 */
export function createPingCommand(): Command {
  return new Command('ping')
    .description('Test connection to Toggl API')
    .action(async () => {
      try {
        // Step 1: Load configuration
        const config = await loadConfig()

        // Step 2: Create API client
        const client = createTogglClient(config.apiToken)

        // Step 3: Test connection by fetching user info
        const user: TogglUser = await client.get('/me')

        // Step 4: Display success information
        console.log(formatSuccess('Connected to Toggl API'))
        console.log(formatInfo(`User: ${user.fullname} (${user.email})`))
        console.log(formatInfo(`Default Workspace: ${user.default_workspace_id}`))
        console.log(formatInfo(`Timezone: ${user.timezone}`))
        console.log(formatInfo(`Token: ${config.apiToken.substring(0, 8)}...`))

      } catch (error: unknown) {
        // Step 5: Handle errors with helpful troubleshooting
        console.error(formatError('Connection failed'))
        console.error(`  ${(error as Error).message}`)

        // Provide troubleshooting steps
        console.error('')
        console.error('Troubleshooting:')
        console.error('  1. Check your internet connection')
        console.error('  2. Verify your API token with "tog init"')
        console.error('  3. Check Toggl API status at https://status.toggl.com')

        process.exit(1)
      }
    })
}