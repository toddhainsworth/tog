import type { TogglConfig } from './config.js'
import type { TogglClient } from './toggl-client.js'
import type { Project, Task } from './validation.js'
import { withSpinner } from './prompts.js'

export interface LoggingContext {
  log: (message: string) => void
  warn?: (message: string) => void
}

export interface TimerCreationOptions {
  client: TogglClient
  config: TogglConfig
  description: string
  selectedProject?: Project
  selectedTask?: Task
}

export interface TimerCreationResult {
  success: boolean
  timeEntry?: any
  error?: Error
}

export class TimerService {
  /**
   * Checks if there is currently a running timer.
   * Returns true if a timer is running (which should block starting a new timer).
   */
  static async checkForRunningTimer(client: TogglClient): Promise<{ hasRunningTimer: boolean; currentEntry?: any }> {
    try {
      const currentEntry = await client.getCurrentTimeEntry()
      return {
        hasRunningTimer: Boolean(currentEntry),
        currentEntry
      }
    } catch (error) {
      throw new Error('Failed to check current timer')
    }
  }

  /**
   * Creates and starts a new timer with the given parameters.
   * Returns the created time entry or throws an error if creation fails.
   */
  static async createTimer(options: TimerCreationOptions, context: LoggingContext): Promise<TimerCreationResult> {
    const { client, config, description, selectedProject, selectedTask } = options

    try {
      const timeEntryData = {
        created_with: 'tog-cli',
        description,
        duration: -1,
        start: new Date().toISOString(),
        workspace_id: config.workspaceId,
        ...(selectedTask && { task_id: selectedTask.id }),
        ...(selectedProject && { project_id: selectedProject.id })
      }

      const timeEntry = await withSpinner('Creating timer...', () =>
        client.createTimeEntry(config.workspaceId, timeEntryData),
        context
      )

      if (timeEntry) {
        return {
          success: true,
          timeEntry
        }
      } else {
        return {
          success: false,
          error: new Error('Failed to start timer. Please try again.')
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred during timer creation')
      }
    }
  }

  /**
   * Fetches both tasks and projects from the Toggl API.
   * Returns null values if the fetch fails.
   */
  static async fetchTasksAndProjects(client: TogglClient, context: LoggingContext): Promise<{
    projects: Project[] | null
    tasks: Task[] | null
  }> {
    try {
      const [tasks, projects] = await withSpinner(
        'Fetching available tasks and projects...',
        async () => Promise.all([client.getTasks(), client.getProjects()]),
        context
      )
      return { projects, tasks }
    } catch (error) {
      throw new Error('Failed to fetch tasks/projects')
    }
  }

  /**
   * Validates timer description input.
   */
  static validateDescription(description: string): { isValid: boolean; error?: string } {
    if (!description || description.trim().length === 0) {
      return {
        isValid: false,
        error: 'Timer description cannot be empty'
      }
    }

    if (description.trim().length > 500) {
      return {
        isValid: false,
        error: 'Timer description cannot exceed 500 characters'
      }
    }

    return { isValid: true }
  }

  /**
   * Validates that the project and task are compatible.
   */
  static validateProjectTaskRelationship(project?: Project, task?: Task): { isValid: boolean; error?: string } {
    if (task && project && task.project_id !== project.id) {
      return {
        isValid: false,
        error: `Task "${task.name}" does not belong to project "${project.name}"`
      }
    }

    return { isValid: true }
  }

  /**
   * Validates workspace configuration.
   */
  static validateWorkspaceConfig(config: TogglConfig): { isValid: boolean; error?: string } {
    if (!config.workspaceId) {
      return {
        isValid: false,
        error: 'Workspace ID is missing from configuration'
      }
    }

    return { isValid: true }
  }

  /**
   * Performs comprehensive validation of all timer creation parameters.
   */
  static validateTimerCreation(options: TimerCreationOptions): { isValid: boolean; error?: string } {
    const { config, description, selectedProject, selectedTask } = options

    // Validate workspace config
    const workspaceValidation = this.validateWorkspaceConfig(config)
    if (!workspaceValidation.isValid) {
      return workspaceValidation
    }

    // Validate description
    const descriptionValidation = this.validateDescription(description)
    if (!descriptionValidation.isValid) {
      return descriptionValidation
    }

    // Validate project/task relationship
    const relationshipValidation = this.validateProjectTaskRelationship(selectedProject, selectedTask)
    if (!relationshipValidation.isValid) {
      return relationshipValidation
    }

    return { isValid: true }
  }
}