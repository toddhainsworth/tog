import type {Project, Task} from '../lib/validation.js'

import {BaseCommand} from '../lib/base-command.js'
import {promptForTimerSelection, withSpinner} from '../lib/prompts.js'
import {type TimerOption, TimerSelectionService} from '../lib/timer-selection-service.js'

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

      // Get projects and tasks for context
      const [projects, tasks] = await withSpinner('Loading timer options...', () =>
        Promise.all([client.getProjects(), client.getTasks()]), {
          log: this.log.bind(this),
          warn: this.warn.bind(this),
        })

      // Initialize timer selection service
      const selectionService = new TimerSelectionService(client, projects, tasks)

      // Get timer options with favorites and recent timers
      const timerOptions = await withSpinner('Fetching favorites and recent timers...', () =>
        selectionService.getTimerOptions(), {
          log: this.log.bind(this),
          warn: this.warn.bind(this),
        })

      // Handle different scenarios
      if (selectionService.hasNoOptions(timerOptions)) {
        this.logInfo('No previous timers found. Use `tog start` to create your first timer!')
        return
      }

      let selectedOption: TimerOption

      if (selectionService.hasSingleOption(timerOptions)) {
        // Auto-continue single option (backward compatibility)
        const [singleOption] = timerOptions
        if (!singleOption) {
          throw new Error('Timer option unexpectedly missing')
        }

        selectedOption = singleOption
      } else {
        // Multiple options - let user select using progressive disclosure UX pattern
        const hasFavorites = timerOptions.some(opt => opt.isFavorite)
        const hasRecent = timerOptions.some(opt => !opt.isFavorite)

        /**
         * Progressive Disclosure UX Pattern:
         * - Show favorites first (most likely choices)
         * - Provide option to see recent timers if user wants more options
         * - This reduces cognitive load while maintaining full functionality
         */
        selectedOption = await this.selectTimerWithProgressiveDisclosure(
          timerOptions,
          hasFavorites,
          hasRecent
        )
      }

      // Show details of timer being continued
      await this.showTimerBeingContinued(selectedOption, projects, tasks)

      // Create new timer with selected metadata
      await this.createContinuedTimer(selectedOption, config.workspaceId)

    } catch (error) {
      this.handleError(error, 'Failed to continue timer')
    }
  }

  private async createContinuedTimer(timerOption: TimerOption, workspaceId: number): Promise<void> {
    const client = this.getClient()

    const timeEntryData = {
      created_with: 'tog-cli',
      description: timerOption.description || '',
      duration: -1,
      project_id: timerOption.project_id || undefined,
      start: new Date().toISOString(),
      task_id: timerOption.task_id || undefined,
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

  private async selectTimerWithProgressiveDisclosure(
    timerOptions: TimerOption[],
    hasFavorites: boolean,
    hasRecent: boolean
  ): Promise<TimerOption> {
    if (hasFavorites && hasRecent) {
      const favoriteOptions = timerOptions.filter(opt => opt.isFavorite)
      const result = await promptForTimerSelection(favoriteOptions, true)

      if (result === 'show-recent') {
        // User wants to see recent timers instead
        const recentOptions = timerOptions.filter(opt => !opt.isFavorite)
        const recentResult = await promptForTimerSelection(recentOptions, false)

        if (recentResult === 'show-recent') {
          throw new Error('Unexpected show-recent response from recent timers selection')
        }

        return recentResult
      }

      return result
    }

    // Only one type available, show them all
    const result = await promptForTimerSelection(timerOptions, false)

    if (result === 'show-recent') {
      throw new Error('Unexpected show-recent response when no favorites available')
    }

    return result
  }

  private async showTimerBeingContinued(option: TimerOption, projects: Project[], tasks: Task[]): Promise<void> {
    this.log('')
    this.log('📋 Continuing timer:')
    this.log(`Description: "${option.description || 'No description'}"`)

    if (option.project_id) {
      const project = projects.find(p => p.id === option.project_id)
      if (project) {
        this.log(`Project: ${project.name}`)
      }
    }

    if (option.task_id) {
      const task = tasks.find(t => t.id === option.task_id)
      if (task) {
        this.log(`Task: ${task.name}`)
      }
    }

    if (option.isFavorite) {
      this.log('Type: ⭐ Favorite')
    } else if (option.lastUsed) {
      this.log(`Last used: ${option.lastUsed}`)
    }

    this.log('')
  }
}