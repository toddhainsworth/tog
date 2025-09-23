import {Flags} from '@oclif/core'

import type { Project, Task, TimeEntry } from '../lib/validation.js'

import { BaseCommand } from '../lib/base-command.js'
import { promptForDescription, promptForTaskSelection, withSpinner } from '../lib/prompts.js'

export default class Start extends BaseCommand {
  static override description = 'Start a new time tracking timer'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -d "Working on API integration"',
    '<%= config.bin %> <%= command.id %> -d "Bug fix" -p "Backend Project"',
    '<%= config.bin %> <%= command.id %> -d "Feature work" -p "Frontend" -t "Login system"',
  ]
static override flags = {
    description: Flags.string({char: 'd', description: 'Timer description'}),
    project: Flags.string({char: 'p', description: 'Project name or ID'}),
    task: Flags.string({char: 't', description: 'Task name or ID'}),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(Start)

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

      // Get timer description (from flag or prompt)
      let description: string
      if (flags.description) {
        description = flags.description
        this.log(`Using description: "${description}"`)
      } else {
        this.log('Let\'s start a new timer!')
        try {
          description = await promptForDescription()
        } catch (error) {
          this.handleError(error, 'Failed to get timer description')
          return
        }
      }

      // Fetch available tasks and projects
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

      // Handle project/task selection (from flags or interactive)
      let selectedProject: Project | undefined
      let selectedTask: Task | undefined

      // Project selection
      if (flags.project) {
        try {
          const foundProject = this.findProjectByNameOrId(projects, flags.project)
          if (!foundProject) {
            this.handleError(new Error(`Project "${flags.project}" not found`), 'Project lookup failed')
            return
          }

          selectedProject = foundProject
          this.log(`Using project: ${selectedProject.name}`)
        } catch (error) {
          this.handleError(error, 'Project lookup failed')
          return
        }
      }

      // Task selection
      if (flags.task) {
        try {
          const foundTask = this.findTaskByNameOrId(tasks, flags.task, selectedProject?.id)
          if (!foundTask) {
            const projectContext = selectedProject ? ` in project "${selectedProject.name}"` : ''
            this.handleError(new Error(`Task "${flags.task}"${projectContext} not found`), 'Task lookup failed')
            return
          }

          selectedTask = foundTask
          this.log(`Using task: ${foundTask.name}`)

          // If task is found but no project was specified, use the task's project
          if (!selectedProject && foundTask.project_id) {
            selectedProject = projects.find(p => p.id === foundTask.project_id)
          }
        } catch (error) {
          this.handleError(error, 'Task lookup failed')
          return
        }
      }

      // If no flags provided and we have tasks/projects, use interactive selection
      if (!flags.project && !flags.task && (tasks.length > 0 || projects.length > 0)) {
        try {
          const selectedChoice = await promptForTaskSelection(tasks, projects)
          selectedProject = selectedChoice.project_id ? projects.find(p => p.id === selectedChoice.project_id) : undefined
          selectedTask = selectedChoice.task_id ? tasks.find(t => t.id === selectedChoice.task_id) : undefined
          this.logSuccess(`Selected: ${selectedChoice.display}`)
        } catch (error) {
          this.handleError(error, 'Failed to select task/project')
          return
        }
      }

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

      if (selectedTask) {
        timeEntryData.task_id = selectedTask.id
      }

      if (selectedProject) {
        timeEntryData.project_id = selectedProject.id
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

        if (selectedProject) {
          this.log(`Project: ${selectedProject.name}`)
        }

        if (selectedTask) {
          this.log(`Task: ${selectedTask.name}`)
        }
      } else {
        this.handleError(new Error('Failed to start timer. Please try again.'), 'Timer creation failed')
      }

    } catch (error) {
      this.handleError(error, 'Failed to start timer')
    }
  }

  private findProjectByNameOrId(projects: Project[], input: string): null | Project {
    // Try to parse as ID first
    const id = Number.parseInt(input, 10)
    if (!Number.isNaN(id)) {
      return projects.find(p => p.id === id) || null
    }

    // Case-insensitive name matching
    const lowercaseInput = input.toLowerCase()
    const matches = projects.filter(p =>
      p.name.toLowerCase().includes(lowercaseInput)
    )

    if (matches.length === 0) {
      return null
    }

    if (matches.length === 1) {
      return matches[0]
    }

    // Multiple matches - look for exact match first
    const exactMatch = matches.find(p =>
      p.name.toLowerCase() === lowercaseInput
    )
    if (exactMatch) {
      return exactMatch
    }

    // Multiple partial matches - this is ambiguous
    const names = matches.map(p => p.name).join(', ')
    throw new Error(`Multiple projects match "${input}": ${names}. Please be more specific.`)
  }

  private findTaskByNameOrId(tasks: Task[], input: string, projectId?: number): null | Task {
    // Try to parse as ID first
    const id = Number.parseInt(input, 10)
    if (!Number.isNaN(id)) {
      const task = tasks.find(t => t.id === id)
      // If we have a project constraint, ensure task belongs to that project
      if (task && projectId !== undefined && task.project_id !== projectId) {
        throw new Error(`Task "${task.name}" does not belong to the selected project`)
      }

      return task || null
    }

    // Filter by project if provided
    const relevantTasks = projectId === undefined
      ? tasks
      : tasks.filter(t => t.project_id === projectId)

    // Case-insensitive name matching
    const lowercaseInput = input.toLowerCase()
    const matches = relevantTasks.filter(t =>
      t.name.toLowerCase().includes(lowercaseInput)
    )

    if (matches.length === 0) {
      return null
    }

    if (matches.length === 1) {
      return matches[0]
    }

    // Multiple matches - look for exact match first
    const exactMatch = matches.find(t =>
      t.name.toLowerCase() === lowercaseInput
    )
    if (exactMatch) {
      return exactMatch
    }

    // Multiple partial matches - this is ambiguous
    const names = matches.map(t => t.name).join(', ')
    throw new Error(`Multiple tasks match "${input}": ${names}. Please be more specific.`)
  }
}
