import {Flags} from '@oclif/core'

import type { Project, Task, TimeEntry } from '../lib/validation.js'

import { BaseCommand } from '../lib/base-command.js'
import { ProjectService } from '../lib/project-service.js'
import { TaskService } from '../lib/task-service.js'
import { TimeEntryEditor } from '../lib/time-entry-editor.js'
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
      const timeEntryEditor = new TimeEntryEditor(timeEntryService, this.getLoggingContext())

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

      const result = await timeEntryEditor.executeUpdate({
        currentEntry,
        flags,
        projects,
        tasks
      })

      if (result.success && result.timeEntry && result.updates) {
        this.logSuccess('Timer updated successfully!')
        this.showUpdateSummary(currentEntry, result.timeEntry, projects, tasks)
      } else if (result.error) {
        if (result.error === 'No updates to apply') {
          this.logInfo('No changes made.')
        } else {
          this.handleError(new Error(result.error), 'Timer update failed')
        }
      }
    } catch (error) {
      this.handleError(error, 'Failed to edit timer')
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