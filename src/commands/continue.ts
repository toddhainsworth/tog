import type {Project, Task, TimeEntry} from '../lib/validation.js'

import {BaseCommand} from '../lib/base-command.js'
import {withSpinner} from '../lib/prompts.js'

export default class Continue extends BaseCommand {
  static override description = 'Continue the most recent timer with the same settings'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    try {
      const config = this.loadConfigOrExit()
      const client = this.getClient()

      // Check for running timer
      const currentEntry = await client.getCurrentTimeEntry()
      if (currentEntry) {
        this.logWarning(`Timer is already running: "${currentEntry.description || 'Untitled'}"`)
        this.log('Use `tog stop` to stop the current timer before continuing a previous one.')
        return
      }

      // Get most recent timer
      const recentEntry = await withSpinner('Fetching most recent timer...', () =>
        client.getMostRecentTimeEntry(), {
          log: this.log.bind(this),
          warn: this.warn.bind(this),
        })

      if (!recentEntry) {
        this.logInfo('No previous timers found. Use `tog start` to create your first timer!')
        return
      }

      // Check if most recent timer is still running
      if (!recentEntry.stop) {
        this.logWarning('Most recent timer is still running. Use `tog stop` to stop it first.')
        return
      }

      // Get projects and tasks for display purposes
      const [projects, tasks] = await withSpinner('Fetching projects and tasks...', () =>
        Promise.all([client.getProjects(), client.getTasks()]), {
          log: this.log.bind(this),
          warn: this.warn.bind(this),
        })

      // Show details of timer being continued
      await this.showTimerBeingContinued(recentEntry, projects, tasks)

      // Create new timer with same metadata
      await this.createContinuedTimer(recentEntry, config.workspaceId)

    } catch (error) {
      this.handleError(error, 'Failed to continue timer')
    }
  }

  private async createContinuedTimer(originalEntry: TimeEntry, workspaceId: number): Promise<void> {
    const client = this.getClient()

    const timeEntryData = {
      created_with: 'tog-cli',
      description: originalEntry.description || '',
      duration: -1,
      project_id: originalEntry.project_id || undefined,
      start: new Date().toISOString(),
      task_id: originalEntry.task_id || undefined,
      workspace_id: workspaceId,
    }

    const timeEntry = await withSpinner('Creating timer...', () =>
      client.createTimeEntry(workspaceId, timeEntryData), {
        log: this.log.bind(this),
        warn: this.warn.bind(this),
      })

    if (timeEntry) {
      this.logSuccess('Timer continued successfully!')
    } else {
      this.handleError(new Error('Failed to continue timer. Please try again.'), 'Timer creation failed')
    }
  }

  private async showTimerBeingContinued(entry: TimeEntry, projects: Project[], tasks: Task[]): Promise<void> {
    this.log('')
    this.log('📋 Continuing timer:')
    this.log(`Description: "${entry.description || 'No description'}"`)

    if (entry.project_id) {
      const project = projects.find(p => p.id === entry.project_id)
      if (project) {
        this.log(`Project: ${project.name}`)
      }
    }

    if (entry.task_id) {
      const task = tasks.find(t => t.id === entry.task_id)
      if (task) {
        this.log(`Task: ${task.name}`)
      }
    }

    this.log('')
  }
}