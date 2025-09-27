import {Flags} from '@oclif/core'

import type { Project, Task, TimeEntry } from '../lib/validation.js'

import { BaseCommand } from '../lib/base-command.js'
import { ProjectService } from '../lib/project-service.js'
import { promptForDescription, promptForTaskSelection } from '../lib/prompts.js'
import { TaskService } from '../lib/task-service.js'
import { TimeEntryService } from '../lib/time-entry-service.js'

export default class Edit extends BaseCommand {
  static override description = 'Edit the currently running timer'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -d "Updated description"',
    '<%= config.bin %> <%= command.id %> -p "New Project"',
    '<%= config.bin %> <%= command.id %> -p none',
    '<%= config.bin %> <%= command.id %> --clear',
    '<%= config.bin %> <%= command.id %> -d "New desc" -p "Project" -t "Task"',
  ]
  static override flags = {
    clear: Flags.boolean({description: 'Clear all project and task assignments'}),
    description: Flags.string({char: 'd', description: 'New timer description'}),
    project: Flags.string({char: 'p', description: 'Project name or ID (use "none" to clear)'}),
    task: Flags.string({char: 't', description: 'Task name or ID (use "none" to clear)'}),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(Edit)
      this.loadConfigOrExit()
      const client = this.getClient()
      const timeEntryService = new TimeEntryService(client, this.getLoggingContext())

      const currentResult = await timeEntryService.getCurrentTimeEntry()
      if (currentResult.error) {
        this.handleError(new Error(currentResult.error), 'Failed to get current timer')
        return
      }

      if (!currentResult.timeEntry) {
        this.logInfo('No timer is currently running.')
        this.log('Start a timer with `tog start` first.')
        return
      }

      const currentEntry = currentResult.timeEntry

      const projects = await ProjectService.getProjects(client, this.getLoggingContext())
      const tasks = await TaskService.getTasks(client, this.getLoggingContext())

      this.showCurrentTimer(currentEntry, projects, tasks)

      const updates = await this.gatherUpdates(flags, currentEntry, projects, tasks)
      if (!updates) return

      await this.applyUpdates({currentEntry, projects, tasks, timeEntryService, updates})
    } catch (error) {
      this.handleError(error, 'Failed to edit timer')
    }
  }

  private async applyUpdates(options: {
    currentEntry: TimeEntry;
    projects: Project[];
    tasks: Task[];
    timeEntryService: TimeEntryService;
    updates: {description?: string; project_id?: null | number; task_id?: null | number};
  }): Promise<void> {
    const {currentEntry, projects, tasks, timeEntryService, updates} = options
    if (!currentEntry.workspace_id || !currentEntry.id) {
      this.handleError(new Error('Current time entry missing required IDs'), 'Timer validation failed')
      return
    }

    const updatePayload: {description?: string; project_id?: null | number; task_id?: null | number} = {}

    if (updates.description !== undefined) {
      updatePayload.description = updates.description
    }

    if (updates.project_id !== undefined) {
      updatePayload.project_id = updates.project_id
    }

    if (updates.task_id !== undefined) {
      updatePayload.task_id = updates.task_id
    }

    const updateResult = await timeEntryService.updateTimeEntry(
      currentEntry.workspace_id,
      currentEntry.id,
      updatePayload
    )

    if (updateResult.timeEntry) {
      this.logSuccess('Timer updated successfully!')
      this.showUpdateSummary(currentEntry, updateResult.timeEntry, projects, tasks)
    } else {
      this.handleError(new Error(updateResult.error || 'Failed to update timer'), 'Timer update failed')
    }
  }


  private async gatherUpdates(
    flags: {clear?: boolean; description?: string; project?: string; task?: string},
    currentEntry: TimeEntry,
    projects: Project[],
    tasks: Task[]
  ): Promise<null | {description?: string; project_id?: null | number; task_id?: null | number}> {
    const updates: {description?: string; project_id?: null | number; task_id?: null | number} = {}

    if (flags.clear) {
      return this.handleClearFlag()
    }

    const descriptionUpdate = await this.handleDescriptionFlag(flags, currentEntry)
    if (descriptionUpdate !== undefined) {
      updates.description = descriptionUpdate
    }

    const projectUpdate = await this.handleProjectFlag(flags, projects)
    if (projectUpdate === null) return null
    if (projectUpdate !== undefined) {
      updates.project_id = projectUpdate
    }

    const taskUpdate = await this.handleTaskFlag(flags, tasks, projects, updates.project_id)
    if (taskUpdate === null) return null
    if (taskUpdate !== undefined) {
      updates.task_id = taskUpdate
    }

    if (!flags.clear && !flags.project && !flags.task && !flags.description) {
      const interactiveUpdates = await this.selectInteractively(currentEntry, tasks, projects)
      if (!interactiveUpdates) return null
      Object.assign(updates, interactiveUpdates)
    }

    if (Object.keys(updates).length === 0) {
      this.logInfo('No changes made.')
      return null
    }

    return updates
  }


  private handleClearFlag(): {project_id: null; task_id: null} {
    this.log('Clearing all project and task assignments')
    return {project_id: null, task_id: null}
  }

  private async handleDescriptionFlag(
    flags: {clear?: boolean; description?: string; project?: string; task?: string},
    currentEntry: TimeEntry
  ): Promise<string | undefined> {
    if (flags.description !== undefined) {
      this.log(`Setting description to: "${flags.description}"`)
      return flags.description
    }

    if (!flags.clear && !flags.project && !flags.task) {
      const newDescription = await this.promptForNewDescription(currentEntry.description)
      if (newDescription !== currentEntry.description) {
        return newDescription
      }
    }

    return undefined
  }

  private async handleProjectFlag(
    flags: {clear?: boolean; project?: string},
    projects: Project[]
  ): Promise<null | number | undefined> {
    if (flags.project === undefined || flags.clear) {
      return undefined
    }

    if (flags.project.toLowerCase() === 'none') {
      this.log('Clearing project assignment')
      return null
    }

    const selectedProject = await this.selectProjectByFlag(projects, flags.project)
    if (!selectedProject) return null
    return selectedProject.id
  }

  private async handleTaskFlag(
    flags: {clear?: boolean; task?: string},
    tasks: Task[],
    projects: Project[],
    projectId?: null | number
  ): Promise<null | number | undefined> {
    if (flags.task === undefined || flags.clear) {
      return undefined
    }

    if (flags.task.toLowerCase() === 'none') {
      this.log('Clearing task assignment')
      return null
    }

    const selectedTask = await this.selectTaskByFlag(tasks, projects, flags.task, projectId)
    if (!selectedTask) return null
    return selectedTask.id
  }

  private async promptForNewDescription(currentDescription?: string): Promise<string> {
    const message = currentDescription ?
      `Enter new description (current: "${currentDescription}")` :
      'Enter new description'

    return promptForDescription(message)
  }

  private async selectInteractively(
    currentEntry: TimeEntry,
    tasks: Task[],
    projects: Project[]
  ): Promise<null | {project_id?: null | number; task_id?: null | number}> {
    this.log('Select new project/task (press Ctrl+C to keep current):')
    try {
      const selectedChoice = await promptForTaskSelection(tasks, projects)
      return {
        project_id: selectedChoice.project_id || null,
        task_id: selectedChoice.task_id || null
      }
    } catch {
      this.log('Keeping current project/task assignments')
      return {}
    }
  }

  private async selectProjectByFlag(projects: Project[], projectFlag: string): Promise<null | Project> {
    try {
      const foundProject = ProjectService.findProjectByNameOrId(projects, projectFlag)
      if (!foundProject) {
        this.handleError(new Error(`Project "${projectFlag}" not found`), 'Project lookup failed')
        return null
      }

      this.log(`Setting project to: ${foundProject.name}`)
      return foundProject
    } catch (error) {
      this.handleError(error, 'Project lookup failed')
      return null
    }
  }

  private async selectTaskByFlag(
    tasks: Task[],
    projects: Project[],
    taskFlag: string,
    projectId?: null | number
  ): Promise<null | Task> {
    try {
      const effectiveProjectId = projectId === null ? undefined : projectId
      const foundTask = TaskService.findTaskByNameOrId(tasks, taskFlag, effectiveProjectId)
      if (!foundTask) {
        const projectContext = effectiveProjectId ?
          ` in project "${projects.find(p => p.id === effectiveProjectId)?.name || effectiveProjectId}"` :
          ''
        this.handleError(new Error(`Task "${taskFlag}"${projectContext} not found`), 'Task lookup failed')
        return null
      }

      this.log(`Setting task to: ${foundTask.name}`)
      return foundTask
    } catch (error) {
      this.handleError(error, 'Task lookup failed')
      return null
    }
  }

  private showCurrentTimer(currentEntry: TimeEntry, projects: Project[], tasks: Task[]): void {
    this.log('\nCurrent timer:')
    this.log(`Description: "${currentEntry.description || 'Untitled'}"`)

    if (currentEntry.project_id) {
      const project = projects.find(p => p.id === currentEntry.project_id)
      this.log(`Project: ${project?.name || `ID ${currentEntry.project_id}`}`)
    } else {
      this.log('Project: None')
    }

    if (currentEntry.task_id) {
      const task = tasks.find(t => t.id === currentEntry.task_id)
      this.log(`Task: ${task?.name || `ID ${currentEntry.task_id}`}`)
    } else {
      this.log('Task: None')
    }

    this.log('')
  }

  private showUpdateSummary(
    originalEntry: TimeEntry,
    updatedEntry: TimeEntry,
    projects: Project[],
    tasks: Task[]
  ): void {
    this.log('\nUpdated timer:')

    if (originalEntry.description !== updatedEntry.description) {
      this.log(`Description: "${originalEntry.description || 'Untitled'}" → "${updatedEntry.description || 'Untitled'}"`)
    }

    if (originalEntry.project_id !== updatedEntry.project_id) {
      const oldProject = originalEntry.project_id ?
        projects.find(p => p.id === originalEntry.project_id)?.name || `ID ${originalEntry.project_id}` :
        'None'
      const newProject = updatedEntry.project_id ?
        projects.find(p => p.id === updatedEntry.project_id)?.name || `ID ${updatedEntry.project_id}` :
        'None'
      this.log(`Project: ${oldProject} → ${newProject}`)
    }

    if (originalEntry.task_id !== updatedEntry.task_id) {
      const oldTask = originalEntry.task_id ?
        tasks.find(t => t.id === originalEntry.task_id)?.name || `ID ${originalEntry.task_id}` :
        'None'
      const newTask = updatedEntry.task_id ?
        tasks.find(t => t.id === updatedEntry.task_id)?.name || `ID ${updatedEntry.task_id}` :
        'None'
      this.log(`Task: ${oldTask} → ${newTask}`)
    }
  }
}