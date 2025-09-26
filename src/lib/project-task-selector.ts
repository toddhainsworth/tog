import type { Project, Task } from './validation.js'

import { promptForTaskSelection } from './prompts.js'

export interface ProjectTaskSelectionResult {
  selectedProject?: Project
  selectedTask?: Task
}

export class ProjectTaskSelector {
  constructor(
    private readonly projects: Project[],
    private readonly tasks: Task[]
  ) {}

  /**
   * Finds a project by its ID.
   */
  findProjectById(projectId: number): Project | undefined {
    return this.projects.find(p => p.id === projectId)
  }

  /**
   * Finds a project by name (case-insensitive partial match) or exact ID.
   * Supports exact matches taking precedence over partial matches.
   * Throws error if multiple partial matches are found without an exact match.
   */
  findProjectByNameOrId(input: string): null | Project {
    // Try to parse as ID first
    const id = Number.parseInt(input, 10)
    if (!Number.isNaN(id)) {
      return this.projects.find(p => p.id === id) || null
    }

    // Case-insensitive name matching
    const lowercaseInput = input.toLowerCase()
    const matches = this.projects.filter(p =>
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

  /**
   * Finds a task by name (case-insensitive partial match) or exact ID.
   * Optionally filters by project ID to ensure task belongs to the specified project.
   * Supports exact matches taking precedence over partial matches.
   */
  findTaskByNameOrId(input: string, projectId?: number): null | Task {
    // Try to parse as ID first
    const id = Number.parseInt(input, 10)
    if (!Number.isNaN(id)) {
      const task = this.tasks.find(t => t.id === id)
      // If we have a project constraint, ensure task belongs to that project
      if (task && projectId !== undefined && task.project_id !== projectId) {
        throw new Error(`Task "${task.name}" does not belong to the selected project`)
      }

      return task || null
    }

    // Filter by project if provided
    const relevantTasks = projectId === undefined
      ? this.tasks
      : this.tasks.filter(t => t.project_id === projectId)

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
   * Handles interactive selection of project and task using prompts.
   * Returns null if user cancels or if an error occurs.
   */
  async selectInteractively(): Promise<null | { project?: Project; task?: Task }> {
    const selectedChoice = await promptForTaskSelection(this.tasks, this.projects)
    const selectedProject = selectedChoice.project_id
      ? this.projects.find(p => p.id === selectedChoice.project_id)
      : undefined
    const selectedTask = selectedChoice.task_id
      ? this.tasks.find(t => t.id === selectedChoice.task_id)
      : undefined

    return { project: selectedProject, task: selectedTask }
  }

  /**
   * Main method to handle project and task selection based on flags or interactive prompts.
   * Handles the complete flow of project/task selection logic.
   */
  async selectProjectAndTask(flags: { project?: string; task?: string }): Promise<ProjectTaskSelectionResult> {
    let selectedProject: Project | undefined
    let selectedTask: Task | undefined

    // Project selection
    if (flags.project) {
      try {
        const result = await this.selectProjectByFlag(flags.project)
        if (!result) return {}
        selectedProject = result
      } catch {
        return {}
      }
    }

    // Task selection
    if (flags.task) {
      try {
        const result = await this.selectTaskByFlag(flags.task, selectedProject)
        if (!result) return {}
        selectedTask = result.task
        selectedProject = result.project || selectedProject
      } catch {
        return {}
      }
    }

    // Interactive selection if no flags
    if (!flags.project && !flags.task && (this.tasks.length > 0 || this.projects.length > 0)) {
      const result = await this.selectInteractively()
      if (!result) return {}
      selectedProject = result.project
      selectedTask = result.task
    }

    if (!selectedProject && !selectedTask) {
      return {}
    }
    return { selectedProject, selectedTask }
  }

  /**
   * Selects a project based on a flag input (name or ID).
   * Returns null if project is not found or if an error occurs.
   */
  async selectProjectByFlag(projectFlag: string): Promise<null | Project> {
    const foundProject = this.findProjectByNameOrId(projectFlag)
    if (!foundProject) {
      throw new Error(`Project "${projectFlag}" not found`)
    }

    return foundProject
  }

  /**
   * Selects a task based on a flag input (name or ID).
   * Optionally constrains the search to a specific project.
   * Returns both the task and its associated project.
   */
  async selectTaskByFlag(taskFlag: string, selectedProject?: Project): Promise<null | { project?: Project; task: Task }> {
    const foundTask = this.findTaskByNameOrId(taskFlag, selectedProject?.id)
    if (!foundTask) {
      const projectContext = selectedProject ? ` in project "${selectedProject.name}"` : ''
      throw new Error(`Task "${taskFlag}"${projectContext} not found`)
    }

    // Auto-select project if task has one but no project was specified
    let taskProject = selectedProject
    if (!taskProject && foundTask.project_id) {
      taskProject = this.findProjectById(foundTask.project_id)
    }

    return { project: taskProject, task: foundTask }
  }
}