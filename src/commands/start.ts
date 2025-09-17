import { Command } from '@oclif/core'

import { loadConfig } from '../lib/config.js'
import { EMOJIS } from '../lib/emojis.js'
import { promptForDescription, promptForTaskSelection, withSpinner } from '../lib/prompts.js'
import { TogglClient } from '../lib/toggl-client.js'

export default class Start extends Command {
  static override description = 'Start a new time tracking timer'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    try {
      // Load and validate configuration
      const config = loadConfig()

      if (!config) {
        this.error('No Toggl CLI configuration found. Run `tog init` to set up your API token first.')
        return
      }

      // Create Toggl client and verify connectivity
      const client = new TogglClient(config.apiToken)

      let isConnected: boolean
      try {
        isConnected = await withSpinner('Checking API connectivity...', () => client.ping(), {
          log: this.log.bind(this),
          warn: this.warn.bind(this)
        })
      } catch (error) {
        this.error(`${EMOJIS.ERROR} API validation error: ${error instanceof Error ? error.message : String(error)}`)
        return
      }

      if (!isConnected) {
        this.error(`${EMOJIS.ERROR} Unable to connect to Toggl API. Please check your configuration.`)
        return
      }

      // Check if there's already a running timer
      let currentEntry: Awaited<ReturnType<typeof client.getCurrentTimeEntry>>
      try {
        currentEntry = await client.getCurrentTimeEntry()
      } catch (error) {
        this.error(`${EMOJIS.ERROR} Failed to check current timer: ${error instanceof Error ? error.message : String(error)}`)
        return
      }

      if (currentEntry) {
        this.log(`${EMOJIS.WARNING} Timer is already running: "${currentEntry.description || 'Untitled'}"`)
        this.log('Use `tog stop` to stop the current timer before starting a new one.')
        return
      }

      // Prompt for timer description
      this.log('Let\'s start a new timer!')
      let description: string
      try {
        description = await promptForDescription()
      } catch (error) {
        this.error(`Failed to get timer description: ${error instanceof Error ? error.message : String(error)}`)
        return
      }

      // Fetch and display available tasks
      let tasks: Awaited<ReturnType<typeof client.getTasks>>
      let projects: Awaited<ReturnType<typeof client.getProjects>>

      try {
        [tasks, projects] = await withSpinner('Fetching available tasks and projects...', async () => {
          return await Promise.all([client.getTasks(), client.getProjects()])
        }, {
          log: this.log.bind(this),
          warn: this.warn.bind(this)
        })
      } catch (error) {
        this.error(`Failed to fetch tasks/projects: ${error instanceof Error ? error.message : String(error)}`)
        return
      }

      if (tasks.length === 0 && projects.length === 0) {
        // No tasks or projects, create simple time entry
        this.log(`${EMOJIS.INFO} No tasks or projects found. Creating simple time entry...`)

        const timeEntry = await client.createTimeEntry(config.workspaceId, {
          created_with: 'tog-cli',
          description: description,
          start: new Date().toISOString(),
          duration: -1, // Indicates a running timer
          workspace_id: config.workspaceId,
        })

        if (timeEntry) {
          this.log(`${EMOJIS.SUCCESS} Timer started successfully!`)
          this.log(`Description: "${description}"`)
        } else {
          this.error(`${EMOJIS.ERROR} Failed to start timer. Please try again.`)
        }

        return
      }

      // Use enhanced task/project selection
      let selectedChoice: {task_id?: number; project_id?: number; display: string}
      try {
        selectedChoice = await promptForTaskSelection(tasks, projects)
      } catch (error) {
        this.error(`Failed to select task/project: ${error instanceof Error ? error.message : String(error)}`)
        return
      }

      this.log(`${EMOJIS.SUCCESS} Selected: ${selectedChoice.display}`)

      // Create time entry with selected task/project
      const timeEntryData: {
        created_with: string
        description: string
        start: string
        duration: number
        workspace_id: number
        task_id?: number
        project_id?: number
      } = {
        created_with: 'tog-cli',
        description: description,
        start: new Date().toISOString(),
        duration: -1, // Indicates a running timer
        workspace_id: config.workspaceId,
      }

      if (selectedChoice.task_id) {
        timeEntryData.task_id = selectedChoice.task_id
      }

      if (selectedChoice.project_id) {
        timeEntryData.project_id = selectedChoice.project_id
      }

      const timeEntry = await withSpinner('Creating timer...', () =>
        client.createTimeEntry(config.workspaceId, timeEntryData)
      , {
        log: this.log.bind(this),
        warn: this.warn.bind(this)
      })

      if (timeEntry) {
        this.log(`${EMOJIS.SUCCESS} Timer started successfully!`)
        this.log(`Description: "${description}"`)
        this.log(`Selected: ${selectedChoice.display}`)
      } else {
        this.error(`${EMOJIS.ERROR} Failed to start timer. Please try again.`)
      }

    } catch (error) {
      this.error(`Failed to start timer: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
