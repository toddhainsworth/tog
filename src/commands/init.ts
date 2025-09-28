/**
 * Init Command - Initialize Toggl CLI configuration
 *
 * Usage: tog init
 *
 * This command helps users set up their Toggl API token and validates
 * the connection. Follows the single-file pattern with comprehensive
 * error handling and user-friendly prompts.
 *
 * Flow:
 *   1. Check if configuration already exists
 *   2. Prompt for API token with validation
 *   3. Test token by calling Toggl API
 *   4. Save configuration to ~/.togrc
 *   5. Display success message with user info
 */

import { Command } from 'commander'
import { input, confirm } from '@inquirer/prompts'
import { isAxiosError } from 'axios'
import { configExists, saveConfig } from '../config/index.js'
import { createTogglClient, TogglUser } from '../api/client.js'
import { formatSuccess, formatError, formatWarning, formatInfo } from '../utils/format.js'

/**
 * Create the init command
 */
export function createInitCommand(): Command {
  return new Command('init')
    .description('Initialize Toggl CLI configuration')
    .action(async () => {
      try {
        console.log(formatInfo('Welcome to Toggl CLI setup!'))
        console.log('')

        // Step 1: Check if configuration already exists
        const configAlreadyExists = await configExists()

        if (configAlreadyExists) {
          console.log(formatWarning('Configuration already exists'))

          const shouldOverwrite = await confirm({
            message: 'Do you want to overwrite the existing configuration?',
            default: false
          })

          if (!shouldOverwrite) {
            console.log(formatInfo('Setup cancelled'))
            return
          }
          console.log('')
        }

        // Step 2: Prompt for API token
        const apiToken = await getApiToken()
        if (!apiToken) {
          console.log(formatError('Setup cancelled - API token is required'))
          process.exit(1)
        }

        // Step 3: Validate token with Toggl API
        console.log(formatInfo('Validating API token...'))
        const user = await validateApiToken(apiToken)

        // Step 4: Save configuration
        await saveConfig({ apiToken })

        // Step 5: Display success
        console.log('')
        console.log(formatSuccess('Configuration saved successfully!'))
        console.log('')
        console.log(formatInfo(`Connected as: ${user.fullname} (${user.email})`))
        console.log(formatInfo(`Default workspace: ${user.default_workspace_id}`))
        console.log(formatInfo(`Timezone: ${user.timezone}`))
        console.log('')
        console.log('You can now use Toggl CLI commands like:')
        console.log('  tog ping      # Test connection')
        console.log('  tog current   # Show running timer')
        console.log('  tog start     # Start a new timer')

      } catch (error) {
        console.error(formatError('Setup failed'))
        console.error(`  ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
      }
    })
}

/**
 * Interactive prompt for API token with validation
 */
async function getApiToken(): Promise<string> {
  console.log('To get your API token:')
  console.log('1. Visit https://track.toggl.com/profile')
  console.log('2. Scroll down to "API Token" section')
  console.log('3. Copy your API token')
  console.log('')

  const token = await input({
    message: 'Enter your Toggl API token:',
    validate: (input: string) => {
      const trimmed = input.trim()
      if (trimmed.length === 0) {
        return 'API token cannot be empty'
      }
      if (trimmed.length < 32) {
        return 'API token must be at least 32 characters long'
      }
      return true
    }
  })

  return token.trim()
}

/**
 * Validate API token by testing connection to Toggl API
 */
async function validateApiToken(apiToken: string): Promise<TogglUser> {
  try {
    const client = createTogglClient(apiToken)
    const user: TogglUser = await client.get('/me')

    if (!user || !user.email) {
      throw new Error('Invalid response from Toggl API')
    }

    return user
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response) {
      const status = error.response.status
      if (status === 401) {
        throw new Error('Invalid API token. Please check your token and try again.')
      }
      if (status === 403) {
        throw new Error('Access denied. Please check your API token permissions.')
      }
      if (status >= 500) {
        throw new Error('Toggl API is currently unavailable. Please try again later.')
      }
    }

    if (error instanceof Error) {
      throw new Error(`API validation failed: ${error.message}`)
    }

    throw new Error('Unknown error occurred during API validation')
  }
}