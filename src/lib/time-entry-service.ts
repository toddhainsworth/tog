import type { TogglClient } from './toggl-client.js'
import type { Project, Task, TimeEntry } from './validation.js'

import { ProjectService } from './project-service.js'
import { TaskService } from './task-service.js'
import { WorkspaceService } from './workspace-service.js'

export interface LoggingContext {
  debug?: (message: string, data?: Record<string, unknown>) => void
  warn?: (message: string) => void
}

export interface TimeEntryCreationOptions {
  billable?: boolean
  description: string
  duration?: number
  project?: Project
  start?: string
  stop?: string
  task?: Task
  workspaceId: number
}

export interface TimeEntryCreationResult {
  error?: Error
  success: boolean
  timeEntry?: TimeEntry
}

export interface TimeEntrySearchOptions {
  description?: string
  endDate?: string
  pageSize?: number
  startDate?: string
  workspaceId: number
}

export interface TimeEntryUpdateOptions {
  billable?: boolean
  description?: string
  duration?: number
  projectId?: null | number
  start?: string
  stop?: string
  taskId?: null | number
}

export class TimeEntryService {
  private readonly projectService: ProjectService
  private readonly taskService: TaskService

  constructor(
    private readonly client: TogglClient,
    private readonly context?: LoggingContext,
    projectService?: ProjectService,
    taskService?: TaskService
  ) {
    this.projectService = projectService || new ProjectService(client, context)
    this.taskService = taskService || new TaskService(client, context, this.projectService)
  }

  /**
   * Checks if there is currently a running timer.
   */
  async checkForRunningTimer(): Promise<{
    currentEntry?: null | TimeEntry
    error?: string
    hasRunningTimer: boolean
  }> {
    const result = await this.getCurrentTimeEntry()

    if (result.error) {
      return {
        error: result.error,
        hasRunningTimer: false
      }
    }

    return {
      currentEntry: result.timeEntry,
      hasRunningTimer: Boolean(result.timeEntry && !result.timeEntry.stop)
    }
  }

  /**
   * Creates a new time entry with comprehensive validation.
   */
  async createTimeEntry(options: TimeEntryCreationOptions): Promise<TimeEntryCreationResult> {
    const { billable, description, duration, project, start, stop, task, workspaceId } = options

    try {
      this.context?.debug?.('Creating time entry', {
        hasDescription: Boolean(description),
        hasProject: Boolean(project),
        hasTask: Boolean(task),
        workspaceId
      })

      // Validate workspace access
      const workspaceResult = await WorkspaceService.validateWorkspace(this.client, workspaceId, this.context)
      if (!workspaceResult.success) {
        return {
          error: new Error(workspaceResult.error || 'Invalid workspace'),
          success: false
        }
      }

      // Validate description
      const descriptionValidation = this.validateDescription(description)
      if (!descriptionValidation.isValid) {
        return {
          error: new Error(descriptionValidation.error || 'Invalid description'),
          success: false
        }
      }

      // Validate project-task relationship
      const relationshipValidation = TaskService.validateProjectTaskRelationship(project, task)
      if (!relationshipValidation.isValid) {
        return {
          error: new Error(relationshipValidation.error || 'Invalid project-task relationship'),
          success: false
        }
      }

      // Prepare time entry data
      const timeEntryData = {
        billable,
        created_with: 'tog-cli',
        description: description.trim(),
        duration: duration ?? -1, // -1 indicates a running timer
        start: start || new Date().toISOString(),
        stop,
        workspace_id: workspaceId,
        ...(task && { task_id: task.id }),
        ...(project && { project_id: project.id })
      }

      const timeEntry = await this.client.createTimeEntry(workspaceId, timeEntryData)

      this.context?.debug?.('Time entry created successfully', {
        entryId: timeEntry.id,
        projectId: timeEntry.project_id,
        taskId: timeEntry.task_id
      })

      return {
        success: true,
        timeEntry
      }

    } catch (error) {
      const convertedError = error instanceof Error
        ? error
        : new Error(String(error) || 'Unknown error occurred during time entry creation')

      this.context?.debug?.('Time entry creation failed', {
        error: convertedError.message,
        workspaceId
      })

      return {
        error: convertedError,
        success: false
      }
    }
  }

  /**
   * Gets the currently running time entry.
   */
  async getCurrentTimeEntry(): Promise<{
    error?: string
    timeEntry?: null | TimeEntry
  }> {
    try {
      this.context?.debug?.('Fetching current time entry')
      const timeEntry = await this.client.getCurrentTimeEntry()

      this.context?.debug?.('Current time entry fetched', {
        hasEntry: Boolean(timeEntry),
        isRunning: timeEntry ? !timeEntry.stop : false
      })

      return { timeEntry }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.context?.debug?.('Failed to fetch current time entry', { error: errorMessage })
      return {
        error: `Failed to get current time entry: ${errorMessage}`,
        timeEntry: null
      }
    }
  }

  /**
   * Gets the most recent time entry.
   */
  async getMostRecentTimeEntry(): Promise<{
    error?: string
    timeEntry?: null | TimeEntry
  }> {
    try {
      this.context?.debug?.('Fetching most recent time entry')
      const timeEntry = await this.client.getMostRecentTimeEntry()

      this.context?.debug?.('Most recent time entry fetched', {
        hasEntry: Boolean(timeEntry)
      })

      return { timeEntry }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.context?.debug?.('Failed to fetch most recent time entry', { error: errorMessage })
      return {
        error: `Failed to get most recent time entry: ${errorMessage}`,
        timeEntry: null
      }
    }
  }

  /**
   * Gets time entries for a date range.
   */
  async getTimeEntries(startDate: string, endDate: string): Promise<{
    error?: string
    timeEntries: TimeEntry[]
  }> {
    try {
      this.context?.debug?.('Fetching time entries', { endDate, startDate })
      const timeEntries = await this.client.getTimeEntries(startDate, endDate)

      this.context?.debug?.('Time entries fetched successfully', {
        count: timeEntries.length,
        endDate,
        startDate
      })

      return { timeEntries }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.context?.debug?.('Failed to fetch time entries', {
        endDate,
        error: errorMessage,
        startDate
      })
      return {
        error: `Failed to get time entries: ${errorMessage}`,
        timeEntries: []
      }
    }
  }

  /**
   * Gets time entry statistics for reporting.
   */
  async getTimeEntryStats(startDate: string, endDate: string): Promise<{
    byProject: Record<string, { count: number; duration: number }>
    error?: string
    runningEntries: number
    totalDuration: number
    totalEntries: number
  }> {
    const result = await this.getTimeEntries(startDate, endDate)

    if (result.error) {
      return {
        byProject: {},
        error: result.error,
        runningEntries: 0,
        totalDuration: 0,
        totalEntries: 0
      }
    }

    const { timeEntries } = result
    const totalEntries = timeEntries.length
    const totalDuration = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const runningEntries = timeEntries.filter(entry => !entry.stop).length

    const byProject: Record<string, { count: number; duration: number }> = {}

    for (const entry of timeEntries) {
      const projectKey = entry.project_id ? `Project ${entry.project_id}` : 'No Project'
      if (!byProject[projectKey]) {
        byProject[projectKey] = { count: 0, duration: 0 }
      }

      byProject[projectKey].count++
      byProject[projectKey].duration += entry.duration || 0
    }

    return {
      byProject,
      runningEntries,
      totalDuration,
      totalEntries
    }
  }

  /**
   * Searches time entries using the Reports API.
   */
  async searchTimeEntries(options: TimeEntrySearchOptions): Promise<{
    error?: string
    timeEntries: TimeEntry[]
  }> {
    const { description, endDate, pageSize, startDate, workspaceId } = options

    try {
      this.context?.debug?.('Searching time entries', {
        endDate,
        hasDescription: Boolean(description),
        pageSize,
        startDate,
        workspaceId
      })

      // Validate workspace access
      const workspaceResult = await WorkspaceService.validateWorkspace(this.client, workspaceId, this.context)
      if (!workspaceResult.success) {
        return {
          error: workspaceResult.error || 'Invalid workspace',
          timeEntries: []
        }
      }

      const searchParams = {
        description,
        end_date: endDate,
        page_size: pageSize,
        start_date: startDate
      }

      const timeEntries = await this.client.searchTimeEntries(workspaceId, searchParams)

      this.context?.debug?.('Time entry search completed', {
        count: timeEntries.length,
        workspaceId
      })

      return { timeEntries }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.context?.debug?.('Time entry search failed', {
        error: errorMessage,
        workspaceId
      })
      return {
        error: `Failed to search time entries: ${errorMessage}`,
        timeEntries: []
      }
    }
  }

  /**
   * Stops a running time entry.
   */
  async stopTimeEntry(workspaceId: number, timeEntryId: number): Promise<{
    error?: string
    success: boolean
  }> {
    try {
      this.context?.debug?.('Stopping time entry', { timeEntryId, workspaceId })

      // Validate workspace access
      const workspaceResult = await WorkspaceService.validateWorkspace(this.client, workspaceId, this.context)
      if (!workspaceResult.success) {
        return {
          error: workspaceResult.error || 'Invalid workspace',
          success: false
        }
      }

      const stopped = await this.client.stopTimeEntry(workspaceId, timeEntryId)

      if (stopped) {
        this.context?.debug?.('Time entry stopped successfully', { timeEntryId })
        return { success: true }
      }
 
        this.context?.debug?.('Failed to stop time entry', { timeEntryId })
        return {
          error: 'Failed to stop time entry',
          success: false
        }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.context?.debug?.('Time entry stop failed', {
        error: errorMessage,
        timeEntryId,
        workspaceId
      })
      return {
        error: `Failed to stop time entry: ${errorMessage}`,
        success: false
      }
    }
  }

  /**
   * Updates an existing time entry.
   */
  async updateTimeEntry(
    workspaceId: number,
    timeEntryId: number,
    updates: TimeEntryUpdateOptions
  ): Promise<{
    error?: string
    timeEntry?: TimeEntry
  }> {
    try {
      this.context?.debug?.('Updating time entry', {
        timeEntryId,
        updates: Object.keys(updates),
        workspaceId
      })

      // Validate workspace access
      const workspaceResult = await WorkspaceService.validateWorkspace(this.client, workspaceId, this.context)
      if (!workspaceResult.success) {
        return {
          error: workspaceResult.error || 'Invalid workspace'
        }
      }

      // Validate description if provided
      if (updates.description !== undefined) {
        const descriptionValidation = this.validateDescription(updates.description)
        if (!descriptionValidation.isValid) {
          return {
            error: descriptionValidation.error || 'Invalid description'
          }
        }
      }

      // Prepare update payload
      const updatePayload = {
        ...(updates.billable !== undefined && { billable: updates.billable }),
        ...(updates.description !== undefined && { description: updates.description.trim() }),
        ...(updates.duration !== undefined && { duration: updates.duration }),
        ...(updates.projectId !== undefined && { project_id: updates.projectId }),
        ...(updates.start !== undefined && { start: updates.start }),
        ...(updates.stop !== undefined && { stop: updates.stop }),
        ...(updates.taskId !== undefined && { task_id: updates.taskId })
      }

      const timeEntry = await this.client.updateTimeEntry(workspaceId, timeEntryId, updatePayload)

      this.context?.debug?.('Time entry updated successfully', {
        entryId: timeEntry.id,
        projectId: timeEntry.project_id,
        taskId: timeEntry.task_id
      })

      return { timeEntry }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.context?.debug?.('Time entry update failed', {
        error: errorMessage,
        timeEntryId,
        workspaceId
      })
      return {
        error: `Failed to update time entry: ${errorMessage}`
      }
    }
  }

  /**
   * Validates timer description input.
   */
  validateDescription(description: string): { error?: string; isValid: boolean } {
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
  }
};