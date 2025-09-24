import {Flags} from '@oclif/core'

import type { TogglConfig } from '../lib/config.js'
import type { TogglClient } from '../lib/toggl-client.js'
import type { Project, Task } from '../lib/validation.js'

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
      const config = this.loadConfigOrExit()
      const client = this.getClient()

      // Check for running timer
      if (await this.checkForRunningTimer(client)) return

      // Get timer description
      const description = await this.getTimerDescription(flags)
      if (!description) return

      // Get available data
      const result = await this.fetchTasksAndProjects(client)
      if (!result.tasks || !result.projects) return
      const {projects, tasks} = result

      // Handle project/task selection
      const {selectedProject, selectedTask} = await this.selectProjectAndTask(flags, tasks, projects)

      // Create and start timer
      await this.createTimer({client, config, description, selectedProject, selectedTask})

    } catch (error) {
      this.handleError(error, 'Failed to start timer')
    }
  }


  private async checkForRunningTimer(client: TogglClient): Promise<boolean> {
    try {
      const currentEntry = await client.getCurrentTimeEntry()
      if (currentEntry) {
        this.logWarning(`Timer is already running: "${currentEntry.description || 'Untitled'}"`)
        this.log('Use `tog stop` to stop the current timer before starting a new one.')
        return true
      }

      return false
    } catch (error) {
      this.handleError(error, 'Failed to check current timer')
      return true // Return true to stop execution
    }
  }

  private async createTimer(options: {
    client: TogglClient;
    config: TogglConfig;
    description: string;
    selectedProject?: Project;
    selectedTask?: Task;
  }): Promise<void> {
    const {client, config, description, selectedProject, selectedTask} = options
    const timeEntryData = {
      created_with: 'tog-cli',
      description,
      duration: -1,
      start: new Date().toISOString(),
      workspace_id: config.workspaceId,
      ...(selectedTask && {task_id: selectedTask.id}),
      ...(selectedProject && {project_id: selectedProject.id})
    }

    const timeEntry = await withSpinner('Creating timer...', () =>
      client.createTimeEntry(config.workspaceId, timeEntryData), {
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
  }

  private async fetchTasksAndProjects(client: TogglClient): Promise<{projects: null | Project[]; tasks: null | Task[],}> {
    try {
      const [tasks, projects] = await withSpinner('Fetching available tasks and projects...',
        async () => Promise.all([client.getTasks(), client.getProjects()]), {
          log: this.log.bind(this),
          warn: this.warn.bind(this)
        })
      return {projects, tasks}
    } catch (error) {
      this.handleError(error, 'Failed to fetch tasks/projects')
      return {projects: null, tasks: null}
    }
  }

  private findProjectById(projects: Project[], projectId: number): Project | undefined {
    return projects.find(p => p.id === projectId)
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
      return matches[0] ?? null
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
      return matches[0] ?? null
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

  private async getTimerDescription(flags: {description?: string}): Promise<null | string> {
    if (flags.description) {
      this.log(`Using description: "${flags.description}"`)
      return flags.description
    }

    this.log('Let\'s start a new timer!')
    try {
      return await promptForDescription()
    } catch (error) {
      this.handleError(error, 'Failed to get timer description')
      return null
    }
  }

  private async selectInteractively(tasks: Task[], projects: Project[]): Promise<null | {project?: Project, task?: Task}> {
    try {
      const selectedChoice = await promptForTaskSelection(tasks, projects)
      const selectedProject = selectedChoice.project_id ? projects.find(p => p.id === selectedChoice.project_id) : undefined
      const selectedTask = selectedChoice.task_id ? tasks.find(t => t.id === selectedChoice.task_id) : undefined

      this.logSuccess(`Selected: ${selectedChoice.display}`)
      return {project: selectedProject, task: selectedTask}
    } catch (error) {
      this.handleError(error, 'Failed to select task/project')
      return null
    }
  }

  private async selectProjectAndTask(flags: {project?: string, task?: string}, tasks: Task[], projects: Project[]): Promise<{selectedProject?: Project, selectedTask?: Task}> {
    let selectedProject: Project | undefined
    let selectedTask: Task | undefined

    // Project selection
    if (flags.project) {
      const result = await this.selectProjectByFlag(projects, flags.project)
      if (!result) return {}
      selectedProject = result
    }

    // Task selection
    if (flags.task) {
      const result = await this.selectTaskByFlag(tasks, projects, flags.task, selectedProject)
      if (!result) return {}
      selectedTask = result.task
      selectedProject = result.project || selectedProject
    }

    // Interactive selection if no flags
    if (!flags.project && !flags.task && (tasks.length > 0 || projects.length > 0)) {
      const result = await this.selectInteractively(tasks, projects)
      if (!result) return {}
      selectedProject = result.project
      selectedTask = result.task
    }

    return {selectedProject, selectedTask}
  }

  private async selectProjectByFlag(projects: Project[], projectFlag: string): Promise<null | Project> {
    try {
      const foundProject = this.findProjectByNameOrId(projects, projectFlag)
      if (!foundProject) {
        this.handleError(new Error(`Project "${projectFlag}" not found`), 'Project lookup failed')
        return null
      }

      this.log(`Using project: ${foundProject.name}`)
      return foundProject
    } catch (error) {
      this.handleError(error, 'Project lookup failed')
      return null
    }
  }

  private async selectTaskByFlag(tasks: Task[], projects: Project[], taskFlag: string, selectedProject?: Project): Promise<null | {project?: Project; task: Task,}> {
    try {
      const foundTask = this.findTaskByNameOrId(tasks, taskFlag, selectedProject?.id)
      if (!foundTask) {
        const projectContext = selectedProject ? ` in project "${selectedProject.name}"` : ''
        this.handleError(new Error(`Task "${taskFlag}"${projectContext} not found`), 'Task lookup failed')
        return null
      }

      this.log(`Using task: ${foundTask.name}`)

      // Auto-select project if task has one but no project was specified
      let taskProject = selectedProject
      if (!taskProject && foundTask.project_id) {
        taskProject = this.findProjectById(projects, foundTask.project_id)
      }

      return {project: taskProject, task: foundTask}
    } catch (error) {
      this.handleError(error, 'Task lookup failed')
      return null
    }
  }
}
