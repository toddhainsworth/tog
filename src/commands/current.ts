import ora from 'ora'

import {BaseCommand} from '../lib/base-command.js'
import {calculateElapsedSeconds, formatDuration, formatStartTime} from '../lib/time-utils.js'

export default class Current extends BaseCommand {
  static override description = 'Show currently running timer'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    this.loadConfigOrExit()
    const client = this.getClient()
    const spinner = ora('Fetching current timer status...').start()

    try {
      const timeEntry = await client.getCurrentTimeEntry()

      if (!timeEntry) {
        spinner.succeed()
        this.logInfo('No timer currently running')
        return
      }

      const elapsedSeconds = calculateElapsedSeconds(timeEntry.start)
      const elapsedTime = formatDuration(elapsedSeconds)
      const startTime = formatStartTime(timeEntry.start)

      spinner.succeed('Timer is running')

      this.log('')
      this.log(`📝 Description: ${timeEntry.description || 'No description'}`)
      this.logInfo(`Elapsed time: ${elapsedTime}`)
      this.logInfo(`Started at: ${startTime}`)

      if (timeEntry.project_id) {
        try {
          const projects = await client.getProjects()
          const project = projects.find(p => p.id === timeEntry.project_id)
          if (project) {
            this.logInfo(`Project: ${project.name}`)
          }
        } catch {
          // Silently ignore project lookup errors
        }
      }

      if (timeEntry.task_id) {
        try {
          const tasks = await client.getTasks()
          const task = tasks.find(t => t.id === timeEntry.task_id)
          if (task) {
            this.logInfo(`Task: ${task.name}`)
          }
        } catch {
          // Silently ignore task lookup errors
        }
      }

    } catch (error) {
      spinner.fail('Failed to fetch timer status')
      this.handleError(error, 'Error fetching timer status')
    }
  }
}
