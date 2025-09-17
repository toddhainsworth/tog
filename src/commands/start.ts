import { Command } from '@oclif/core'
import * as readline from 'node:readline/promises'

import { loadConfig } from '../lib/config.js'
import { EMOJIS } from '../lib/emojis.js'
import { TogglClient } from '../lib/toggl-client.js'
import { TimerDescriptionSchema } from '../lib/validation.js'

export default class Start extends Command {
  static override description = 'Start a new time tracking timer'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    // Set up interactive prompt for user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    try {
      // Load and validate configuration
      const config = loadConfig()

      if (!config) {
        this.error('No Toggl CLI configuration found. Run `tog init` to set up your API token first.')
        return
      }

      this.log(`${EMOJIS.LOADING} Checking API connectivity...`)

      // Create Toggl client and verify connectivity
      const client = new TogglClient(config.apiToken)

      let isConnected: boolean
      try {
        isConnected = await client.ping()
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
      const description = await rl.question('Enter timer description: ')

      // Validate timer description
      try {
        TimerDescriptionSchema.assert(description.trim())
      } catch (error) {
        this.error(`Invalid timer description: ${error instanceof Error ? error.message : String(error)}`)
        return
      }

      // Fetch and display available tasks
      this.log(`${EMOJIS.LOADING} Fetching available tasks...`)
      let tasks: Awaited<ReturnType<typeof client.getTasks>>
      let projects: Awaited<ReturnType<typeof client.getProjects>>

      try {
        tasks = await client.getTasks()
        projects = await client.getProjects()
      } catch (error) {
        this.error(`Failed to fetch tasks/projects: ${error instanceof Error ? error.message : String(error)}`)
        return
      }

      if (tasks.length === 0 && projects.length === 0) {
        // No tasks or projects, create simple time entry
        this.log(`${EMOJIS.INFO} No tasks or projects found. Creating simple time entry...`)

        const timeEntry = await client.createTimeEntry(config.workspaceId, {
          created_with: 'tog-cli',
          description: description.trim(),
          start: new Date().toISOString(),
          duration: -1, // Indicates a running timer
          workspace_id: config.workspaceId,
        })

        if (timeEntry) {
          this.log(`${EMOJIS.SUCCESS} Timer started successfully!`)
          this.log(`Description: "${description.trim()}"`)
        } else {
          this.error(`${EMOJIS.ERROR} Failed to start timer. Please try again.`)
        }

        return
      }

      // Display selection menu - prioritize tasks if available, fallback to projects
      const taskChoices: Array<{ display: string, id: number, project_id?: number; task_id?: number, }> = []
      let index = 1

      if (tasks.length > 0) {
        // Show tasks with project info
        this.log('\nAvailable tasks:')

        for (const task of tasks) {
          const project = projects.find(p => p.id === task.project_id)
          const projectName = project ? project.name : 'Unknown Project'
          const clientName = project?.client_name ? ` (${project.client_name})` : ''

          taskChoices.push({
            display: `${task.name} - ${projectName}${clientName}`,
            id: index++,
            project_id: task.project_id,
            task_id: task.id
          })

          this.log(`${taskChoices.length}. ${taskChoices.at(-1)?.display}`)
        }

        // Add projects without tasks
        for (const project of projects) {
          const hasTask = tasks.some(t => t.project_id === project.id)
          if (!hasTask) {
            const clientName = project.client_name ? ` (${project.client_name})` : ''

            taskChoices.push({
              display: `${project.name}${clientName}`,
              id: index++,
              project_id: project.id
            })

            this.log(`${taskChoices.length}. ${taskChoices.at(-1)?.display}`)
          }
        }
      } else {
        // No tasks available, show projects as primary options
        this.log('\nNo tasks found. Available projects:')

        for (const project of projects) {
          const clientName = project.client_name ? ` (${project.client_name})` : ''

          taskChoices.push({
            display: `${project.name}${clientName}`,
            id: index++,
            project_id: project.id
          })

          this.log(`${taskChoices.length}. ${taskChoices.at(-1)?.display}`)
        }
      }

      if (taskChoices.length === 0) {
        this.log(`${EMOJIS.INFO} No tasks or projects available. Creating simple time entry...`)

        const timeEntry = await client.createTimeEntry(config.workspaceId, {
          created_with: 'tog-cli',
          description: description.trim(),
          start: new Date().toISOString(),
          duration: -1, // Indicates a running timer
          workspace_id: config.workspaceId,
        })

        if (timeEntry) {
          this.log(`${EMOJIS.SUCCESS} Timer started successfully!`)
          this.log(`Description: "${description.trim()}"`)
        } else {
          this.error(`${EMOJIS.ERROR} Failed to start timer. Please try again.`)
        }

        return
      }

      // Get user selection
      const selectionType = tasks.length > 0 ? 'task/project' : 'project'
      const selection = await rl.question(`\nSelect a ${selectionType} (1-${taskChoices.length}): `)
      const selectedIndex = Number.parseInt(selection, 10) - 1

      if (Number.isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= taskChoices.length) {
        this.error('Invalid selection. Please enter a valid number.')
        return
      }

      const selectedChoice = taskChoices[selectedIndex]

      this.log(`${EMOJIS.SUCCESS} Selected: ${selectedChoice.display}`)
      this.log(`${EMOJIS.LOADING} Creating timer...`)

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
        description: description.trim(),
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

      const timeEntry = await client.createTimeEntry(config.workspaceId, timeEntryData)

      if (timeEntry) {
        this.log(`${EMOJIS.SUCCESS} Timer started successfully!`)
        this.log(`Description: "${description.trim()}"`)
        this.log(`Selected: ${selectedChoice.display}`)
      } else {
        this.error(`${EMOJIS.ERROR} Failed to start timer. Please try again.`)
      }

    } catch (error) {
      this.error(`Failed to start timer: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      rl.close()
    }
  }
}
