import type { TogglConfig } from './config.js'
import type { TogglClient } from './toggl-client.js'
import type { Project, Task, TimeEntry } from './validation.js'

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
  error?: Error
  success: boolean
  timeEntry?: TimeEntry
}

export const TimerService = {
  /**
   * Checks if there is currently a running timer.
   * Returns true if a timer is running (which should block starting a new timer).
   */
  async checkForRunningTimer(client: TogglClient): Promise<{ currentEntry?: null | TimeEntry; hasRunningTimer: boolean; }> {
    try {
      const currentEntry = await client.getCurrentTimeEntry()
      return {
        currentEntry,
        hasRunningTimer: Boolean(currentEntry)
      }
    } catch {
      throw new Error('Failed to check current timer')
    }
  },

  /**
   * Creates and starts a new timer with the given parameters.
   * Returns the created time entry or throws an error if creation fails.
   */
  async createTimer(options: TimerCreationOptions, context: LoggingContext): Promise<TimerCreationResult> {
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
      }
 
        return {
          error: new Error('Failed to start timer. Please try again.'),
          success: false
        }
      
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Unknown error occurred during timer creation'),
        success: false
      }
    }
  },

  /**
   * Fetches both tasks and projects from the Toggl API.
   * Returns null values if the fetch fails.
   */
  async fetchTasksAndProjects(client: TogglClient, context: LoggingContext): Promise<{
    projects: null | Project[]
    tasks: null | Task[]
  }> {
    try {
      const [tasks, projects] = await withSpinner(
        'Fetching available tasks and projects...',
        async () => Promise.all([client.getTasks(), client.getProjects()]),
        context
      )
      return { projects, tasks }
    } catch {
      throw new Error('Failed to fetch tasks/projects')
    }
  },

  /**
   * Validates timer description input.
   */
  validateDescription(description: string): { error?: string; isValid: boolean; } {
    if (!description || description.trim().length === 0) {
      return {
        error: 'Timer description cannot be empty',
        isValid: false
      }
    }

    if (description.trim().length > 500) {
      return {
        error: 'Timer description cannot exceed 500 characters',
        isValid: false
      }
    }

    return { isValid: true }
  },

  /**
   * Validates that the project and task are compatible.
   */
  validateProjectTaskRelationship(project?: Project, task?: Task): { error?: string; isValid: boolean; } {
    if (task && project && task.project_id !== project.id) {
      return {
        error: `Task "${task.name}" does not belong to project "${project.name}"`,
        isValid: false
      }
    }

    return { isValid: true }
  },

  /**
   * Performs comprehensive validation of all timer creation parameters.
   */
  validateTimerCreation(options: TimerCreationOptions): { error?: string; isValid: boolean; } {
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
  },

  /**
   * Validates workspace configuration.
   */
  validateWorkspaceConfig(config: TogglConfig): { error?: string; isValid: boolean; } {
    if (!config.workspaceId) {
      return {
        error: 'Workspace ID is missing from configuration',
        isValid: false
      }
    }

    return { isValid: true }
  },
};