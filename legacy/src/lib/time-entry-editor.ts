import type { Project, Task, TimeEntry } from './validation.js'

import { ProjectService } from './project-service.js'
import { promptForDescription, promptForOptionalDescription, promptForTaskSelection } from './prompts.js'
import { TaskService } from './task-service.js'
import { TimeEntryService } from './time-entry-service.js'

export interface LoggingContext {
  debug?: (message: string, data?: Record<string, unknown>) => void
  warn?: (message: string) => void
}

export interface EditFlags {
  clear?: boolean
  description?: string
  project?: string
  task?: string
}

export interface EditUpdates {
  description?: string
  project_id?: null | number
  task_id?: null | number
}

export interface EditResult {
  error?: string
  success: boolean
  timeEntry?: TimeEntry
  updates?: EditUpdates
}

export interface TimeEntryEditorOptions {
  currentEntry: TimeEntry
  flags: EditFlags
  projects: Project[]
  tasks: Task[]
}

export class TimeEntryEditor {
  constructor(
    private readonly timeEntryService: TimeEntryService,
    private readonly context?: LoggingContext
  ) {}

  /**
   * Executes the complete edit workflow.
   */
  async executeUpdate(options: TimeEntryEditorOptions): Promise<EditResult> {
    const { currentEntry, flags, projects, tasks } = options

    try {
      this.context?.debug?.('Starting time entry edit workflow', {
        entryId: currentEntry.id,
        hasFlags: Object.keys(flags).length > 0,
        workspaceId: currentEntry.workspace_id
      })

      // Validate the current entry
      const validationResult = this.validateCurrentEntry(currentEntry)
      if (!validationResult.success) {
        return {
          error: validationResult.error,
          success: false
        }
      }

      // Gather all updates from flags and interactive prompts
      const updates = await this.gatherUpdates(flags, currentEntry, projects, tasks)
      if (!updates) {
        return {
          error: 'No updates to apply',
          success: false
        }
      }

      // Validate the updates
      const updateValidation = this.validateUpdates(updates, projects, tasks)
      if (!updateValidation.success) {
        return {
          error: updateValidation.error,
          success: false
        }
      }

      // Apply the updates
      const updateResult = await this.timeEntryService.updateTimeEntry(
        currentEntry.workspace_id,
        currentEntry.id,
        {
          description: updates.description,
          projectId: updates.project_id,
          taskId: updates.task_id
        }
      )

      if (updateResult.timeEntry) {
        this.context?.debug?.('Time entry edit completed successfully', {
          entryId: currentEntry.id,
          updates: Object.keys(updates)
        })

        return {
          success: true,
          timeEntry: updateResult.timeEntry,
          updates
        }
      }

      return {
        error: updateResult.error || 'Failed to update time entry',
        success: false
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.context?.debug?.('Time entry edit workflow failed', {
        entryId: currentEntry.id,
        error: errorMessage
      })

      return {
        error: `Edit workflow failed: ${errorMessage}`,
        success: false
      }
    }
  }

  /**
   * Gathers all updates from flags and interactive prompts.
   */
  async gatherUpdates(
    flags: EditFlags,
    currentEntry: TimeEntry,
    projects: Project[],
    tasks: Task[]
  ): Promise<EditUpdates | null> {
    const updates: EditUpdates = {}

    // Handle clear flag first (overrides other flags)
    if (flags.clear) {
      this.context?.debug?.('Processing clear flag')
      return {
        project_id: null,
        task_id: null
      }
    }

    // Process description flag/prompt
    const descriptionUpdate = await this.processDescriptionInput(flags, currentEntry)
    if (descriptionUpdate !== undefined) {
      updates.description = descriptionUpdate
    }

    // Process project flag
    const projectResult = await this.processProjectInput(flags, projects)
    if (projectResult.error) {
      throw new Error(projectResult.error)
    }

    if (projectResult.projectId !== undefined) {
      updates.project_id = projectResult.projectId
    }

    // Process task flag
    const taskResult = await this.processTaskInput(flags, tasks, projects, updates.project_id)
    if (taskResult.error) {
      throw new Error(taskResult.error)
    }

    if (taskResult.taskId !== undefined) {
      updates.task_id = taskResult.taskId
    }

    // Handle interactive mode if no flags provided
    if (!flags.clear && !flags.project && !flags.task && !flags.description) {
      const interactiveUpdates = await this.processInteractiveEditing(currentEntry, tasks, projects)
      if (interactiveUpdates) {
        Object.assign(updates, interactiveUpdates)
      }
    }

    // Return null if no changes were made
    if (Object.keys(updates).length === 0) {
      this.context?.debug?.('No updates gathered')
      return null
    }

    this.context?.debug?.('Updates gathered successfully', {
      updateFields: Object.keys(updates)
    })

    return updates
  }

  /**
   * Processes description input from flags.
   */
  private async processDescriptionInput(
    flags: EditFlags,
    _currentEntry: TimeEntry
  ): Promise<string | undefined> {
    if (flags.description !== undefined) {
      return flags.description
    }

    // No interactive prompting for description here - handled in processInteractiveEditing
    return undefined
  }

  /**
   * Handles interactive editing flow with optional description and project/task changes.
   */
  private async processInteractiveEditing(
    currentEntry: TimeEntry,
    tasks: Task[],
    projects: Project[]
  ): Promise<EditUpdates | null> {
    const updates: EditUpdates = {}

    try {
      // First, optionally prompt for description change
      const currentDescription = currentEntry.description || 'Untitled'
      const newDescription = await promptForOptionalDescription(
        `Enter new description (current: "${currentDescription}", or press Enter to skip)`
      )

      if (newDescription !== null) {
        updates.description = newDescription
      }

      // Then, optionally prompt for project/task selection
      try {
        const selectedChoice = await promptForTaskSelection(tasks, projects)
        updates.project_id = selectedChoice.project_id || null
        updates.task_id = selectedChoice.task_id || null
      } catch {
        // User cancelled project/task selection - that's OK, they might only want description change
        this.context?.debug?.('User skipped project/task selection')
      }

      return Object.keys(updates).length > 0 ? updates : null
    } catch {
      // User cancelled entirely - return empty updates to indicate no changes
      return {}
    }
  }

  /**
   * Processes project input from flags.
   */
  private async processProjectInput(
    flags: EditFlags,
    projects: Project[]
  ): Promise<{ error?: string; projectId?: null | number }> {
    if (flags.project === undefined || flags.clear) {
      return {}
    }

    if (flags.project.toLowerCase() === 'none') {
      return { projectId: null }
    }

    try {
      const selectedProject = ProjectService.findProjectByNameOrId(projects, flags.project)
      if (!selectedProject) {
        return {
          error: `Project "${flags.project}" not found`
        }
      }

      return { projectId: selectedProject.id }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Processes task input from flags.
   */
  private async processTaskInput(
    flags: EditFlags,
    tasks: Task[],
    projects: Project[],
    projectId?: null | number
  ): Promise<{ error?: string; taskId?: null | number }> {
    if (flags.task === undefined || flags.clear) {
      return {}
    }

    if (flags.task.toLowerCase() === 'none') {
      return { taskId: null }
    }

    try {
      const effectiveProjectId = projectId === null ? undefined : projectId
      const selectedTask = TaskService.findTaskByNameOrId(tasks, flags.task, effectiveProjectId)

      if (!selectedTask) {
        const projectContext = effectiveProjectId
          ? ` in project "${projects.find(p => p.id === effectiveProjectId)?.name || effectiveProjectId}"`
          : ''
        return {
          error: `Task "${flags.task}"${projectContext} not found`
        }
      }

      return { taskId: selectedTask.id }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Prompts for a new description.
   */
  private async promptForNewDescription(currentDescription?: string): Promise<string> {
    const message = currentDescription
      ? `Enter new description (current: "${currentDescription}")`
      : 'Enter new description'

    return promptForDescription(message)
  }

  /**
   * Validates the current time entry.
   */
  private validateCurrentEntry(currentEntry: TimeEntry): { error?: string; success: boolean } {
    if (!currentEntry.workspace_id || !currentEntry.id) {
      return {
        error: 'Current time entry missing required workspace_id or id',
        success: false
      }
    }

    return { success: true }
  }

  /**
   * Validates the gathered updates.
   */
  private validateUpdates(
    updates: EditUpdates,
    projects: Project[],
    tasks: Task[]
  ): { error?: string; success: boolean } {
    // Validate project-task relationship if both are being set
    if (updates.project_id && updates.task_id) {
      const task = tasks.find(t => t.id === updates.task_id)
      if (task && task.project_id !== updates.project_id) {
        return {
          error: `Task "${task.name}" does not belong to the selected project`,
          success: false
        }
      }
    }

    // Validate task belongs to a project if task is set but project is being cleared
    if (updates.project_id === null && updates.task_id && updates.task_id !== null) {
      return {
        error: 'Cannot assign a task without a project',
        success: false
      }
    }

    return { success: true }
  }
}