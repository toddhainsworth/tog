import type { Project, Task, TimeEntry } from '../lib/validation.js'

import { BaseCommand } from '../lib/base-command.js'
import { promptForDescription, promptForTaskSelection, withSpinner } from '../lib/prompts.js'

export default class Start extends BaseCommand {
  static override description = 'Start a new time tracking timer'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    try {
      // Load config and create client using base class methods
      const config = this.loadConfigOrExit()
      const client = this.getClient()

      let isConnected: boolean
      try {
        isConnected = await withSpinner('Checking API connectivity...', () => client.ping(), {
          log: this.log.bind(this),
          warn: this.warn.bind(this)
        })
      } catch (error) {
        this.handleError(error, 'API validation error')
        return
      }

      if (!isConnected) {
        this.handleError(new Error('Unable to connect to Toggl API. Please check your configuration.'), 'Connection failed')
        return
      }

      // Check if there's already a running timer
      let currentEntry: null | TimeEntry
      try {
        currentEntry = await client.getCurrentTimeEntry()
      } catch (error) {
        this.handleError(error, 'Failed to check current timer')
        return
      }

      if (currentEntry) {
        this.logWarning(`Timer is already running: "${currentEntry.description || 'Untitled'}"`)
        this.log('Use `tog stop` to stop the current timer before starting a new one.')
        return
      }

      // Prompt for timer description
      this.log('Let\'s start a new timer!')
      let description: string
      try {
        description = await promptForDescription()
      } catch (error) {
        this.handleError(error, 'Failed to get timer description')
        return
      }

      // Fetch and display available tasks
      let tasks: Task[]
      let projects: Project[]

      try {
        [tasks, projects] = await withSpinner('Fetching available tasks and projects...', async () => Promise.all([client.getTasks(), client.getProjects()]), {
          log: this.log.bind(this),
          warn: this.warn.bind(this)
        })
      } catch (error) {
        this.handleError(error, 'Failed to fetch tasks/projects')
        return
      }

      if (tasks.length === 0 && projects.length === 0) {
        // No tasks or projects, create simple time entry
        this.logInfo('No tasks or projects found. Creating simple time entry...')

        const timeEntry = await client.createTimeEntry(config.workspaceId, {
          created_with: 'tog-cli',          description,
          duration: -1, // Indicates a running timer
          start: new Date().toISOString(),
          workspace_id: config.workspaceId,        })

        if (timeEntry) {
          this.logSuccess('Timer started successfully!')
          this.log(`Description: "${description}"`)
        } else {
          this.handleError(new Error('Failed to start timer. Please try again.'), 'Timer creation failed')
        }

        return
      }

      // Use enhanced task/project selection
      let selectedChoice: {display: string; project_id?: number; task_id?: number;}
      try {
        selectedChoice = await promptForTaskSelection(tasks, projects)
      } catch (error) {
        this.handleError(error, 'Failed to select task/project')
        return
      }

      this.logSuccess(`Selected: ${selectedChoice.display}`)

      // Create time entry with selected task/project
      const timeEntryData: {
        created_with: string
        description: string
        duration: number
        project_id?: number
        start: string
        task_id?: number
        workspace_id: number
      } = {
        created_with: 'tog-cli',
        description,
        duration: -1, // Indicates a running timer
        start: new Date().toISOString(),
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
        this.logSuccess('Timer started successfully!')
        this.log(`Description: "${description}"`)
        this.log(`Selected: ${selectedChoice.display}`)
      } else {
        this.handleError(new Error('Failed to start timer. Please try again.'), 'Timer creation failed')
      }

    } catch (error) {
      this.handleError(error, 'Failed to start timer')
    }
  }
}
