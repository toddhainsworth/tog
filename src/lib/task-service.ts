import type { TogglClient } from './toggl-client.js'
import type { Project, Task } from './validation.js'

import { ProjectService } from './project-service.js'

export interface LoggingContext {
  debug?: (message: string, data?: Record<string, unknown>) => void
  warn?: (message: string) => void
}

export interface TaskSelectionResult {
  error?: string
  project?: Project
  success: boolean
  task?: Task
}

export interface TaskServiceOptions {
  client: TogglClient
  context?: LoggingContext
  projectService?: ProjectService
}

export class TaskService {
  private readonly projectService: ProjectService

  constructor(
    private readonly client: TogglClient,
    private readonly context?: LoggingContext,
    projectService?: ProjectService
  ) {
    this.projectService = projectService || new ProjectService(client, context)
  }

  /**
   * Filters tasks by active status.
   */
  static filterActiveTasks(tasks: Task[]): Task[] {
    return tasks.filter(t => t.active)
  }

  /**
   * Filters tasks by project ID.
   */
  static filterTasksByProject(tasks: Task[], projectId: number): Task[] {
    return tasks.filter(t => t.project_id === projectId)
  }

  /**
   * Finds a task by its ID.
   */
  static findTaskById(tasks: Task[], taskId: number): null | Task {
    return tasks.find(t => t.id === taskId) || null
  }

  /**
   * Finds a task by name (case-insensitive partial match) or exact ID.
   * Optionally filters by project ID to ensure task belongs to the specified project.
   * Supports exact matches taking precedence over partial matches.
   */
  static findTaskByNameOrId(tasks: Task[], input: string, projectId?: number): null | Task {
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

  /**
   * Gets tasks that have no project assignment (orphaned tasks).
   */
  static getOrphanedTasks(tasks: Task[]): Task[] {
    return tasks.filter(t => !t.project_id)
  }

  /**
   * Static method to fetch all tasks for the authenticated user.
   * Returns empty array on error.
   */
  static async getTasks(client: TogglClient, context?: LoggingContext): Promise<Task[]> {
    try {
      context?.debug?.('Fetching user tasks')
      const tasks = await client.getTasks()
      context?.debug?.('Tasks fetched successfully', { count: tasks.length })
      return tasks
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      context?.debug?.('Failed to fetch tasks', { error: errorMessage })
      context?.warn?.('Failed to fetch tasks')
      return []
    }
  }

  /**
   * Sorts tasks alphabetically by name.
   */
  static sortTasksByName(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Validates project-task relationship compatibility.
   */
  static validateProjectTaskRelationship(project?: Project, task?: Task): {
    error?: string
    isValid: boolean
  } {
    if (task && project && task.project_id !== project.id) {
      return {
        error: `Task "${task.name}" does not belong to project "${project.name}"`,
        isValid: false
      }
    }

    return { isValid: true }
  }

  /**
   * Instance method to find task by name or ID.
   */
  async findTaskByNameOrId(input: string, projectId?: number): Promise<null | Task> {
    const tasks = await this.getTasks()
    return TaskService.findTaskByNameOrId(tasks, input, projectId)
  }

  /**
   * Instance method to fetch tasks with automatic error handling.
   */
  async getTasks(): Promise<Task[]> {
    return TaskService.getTasks(this.client, this.context)
  }

  /**
   * Gets tasks and projects together for efficient selection operations.
   */
  async getTasksAndProjects(): Promise<{
    error?: string
    projects: Project[]
    tasks: Task[]
  }> {
    try {
      this.context?.debug?.('Fetching tasks and projects together')

      const [tasks, projects] = await Promise.all([
        this.getTasks(),
        this.projectService.getProjects()
      ])

      this.context?.debug?.('Tasks and projects fetched successfully', {
        projectCount: projects.length,
        taskCount: tasks.length
      })

      return { projects, tasks }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.context?.debug?.('Failed to fetch tasks and projects', { error: errorMessage })
      return {
        error: `Failed to fetch tasks and projects: ${errorMessage}`,
        projects: [],
        tasks: []
      }
    }
  }

  /**
   * Gets tasks for a specific project with validation.
   */
  async getTasksForProject(projectId: number): Promise<{
    error?: string
    project?: Project
    tasks: Task[]
  }> {
    // Validate project exists and user has access
    const projectResult = await this.projectService.validateProject(projectId)

    if (!projectResult.success) {
      return {
        error: projectResult.error,
        tasks: []
      }
    }

    const allTasks = await this.getTasks()
    const projectTasks = TaskService.filterTasksByProject(allTasks, projectId)

    return {
      project: projectResult.project,
      tasks: projectTasks
    }
  }

  /**
   * Gets task statistics for reporting.
   */
  async getTaskStats(): Promise<{
    active: number
    byProject: Record<number, number>
    inactive: number
    orphaned: number
    total: number
  }> {
    const tasks = await this.getTasks()
    const active = TaskService.filterActiveTasks(tasks).length
    const inactive = tasks.length - active
    const orphaned = TaskService.getOrphanedTasks(tasks).length

    const byProject: Record<number, number> = {}

    for (const task of tasks) {
      if (task.project_id) {
        byProject[task.project_id] = (byProject[task.project_id] || 0) + 1
      }
    }

    return {
      active,
      byProject,
      inactive,
      orphaned,
      total: tasks.length
    }
  }

  /**
   * Selects a task based on name or ID input.
   * Includes comprehensive validation and project relationship handling.
   */
  async selectTask(input: string, projectId?: number): Promise<TaskSelectionResult> {
    try {
      this.context?.debug?.('Selecting task', { input, projectId })

      const tasks = await this.getTasks()
      const task = TaskService.findTaskByNameOrId(tasks, input, projectId)

      if (!task) {
        const projectContext = projectId ? ` in project ${projectId}` : ''
        return {
          error: `Task "${input}"${projectContext} not found`,
          success: false
        }
      }

      // Get associated project
      let project: Project | undefined
      if (task.project_id) {
        const projectResult = await this.projectService.validateProject(task.project_id)
        if (projectResult.success) {
          project = projectResult.project
        }
      }

      // Auto-select project if task has one but no project was specified
      if (!projectId && task.project_id && project) {
        this.context?.debug?.('Auto-selected project from task', {
          projectId: project.id,
          projectName: project.name
        })
      }

      this.context?.debug?.('Task selection successful', {
        projectId: task.project_id,
        taskId: task.id,
        taskName: task.name
      })

      return {
        project,
        success: true,
        task
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.context?.debug?.('Task selection failed', { error: errorMessage, input })
      return {
        error: errorMessage,
        success: false
      }
    }
  }

  /**
   * Validates task access and project membership.
   */
  async validateTask(taskId: number, projectId?: number): Promise<TaskSelectionResult> {
    if (!taskId || taskId <= 0) {
      return {
        error: 'Invalid task ID provided',
        success: false
      }
    }

    try {
      const tasks = await this.getTasks()
      const task = TaskService.findTaskById(tasks, taskId)

      if (!task) {
        return {
          error: `Task with ID ${taskId} not found or not accessible`,
          success: false
        }
      }

      // Validate project membership if specified
      if (projectId && task.project_id !== projectId) {
        return {
          error: `Task "${task.name}" does not belong to the specified project`,
          success: false
        }
      }

      // Get associated project if task has one
      let project: Project | undefined
      if (task.project_id) {
        const projectResult = await this.projectService.validateProject(task.project_id)
        if (projectResult.success) {
          project = projectResult.project
        }
      }

      this.context?.debug?.('Task validation successful', {
        projectId: task.project_id,
        taskId,
        taskName: task.name
      })

      return {
        project,
        success: true,
        task
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.context?.debug?.('Task validation failed', { error: errorMessage, taskId })
      return {
        error: `Failed to validate task: ${errorMessage}`,
        success: false
      }
    }
  }
};