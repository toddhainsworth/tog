import {Command} from '@oclif/core'
import ora from 'ora'

import {loadConfig} from '../lib/config.js'
import {EMOJIS} from '../lib/emojis.js'
import {calculateElapsedSeconds, formatDuration, formatStartTime} from '../lib/time-utils.js'
import {TogglClient} from '../lib/toggl-client.js'

export default class Current extends Command {
  static override description = 'Show currently running timer'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    const config = loadConfig()
    if (!config) {
      this.error('No configuration found. Please run "tog init" first.')
    }

    const client = new TogglClient(config.apiToken)
    const spinner = ora('Fetching current timer status...').start()

    try {
      const timeEntry = await client.getCurrentTimeEntry()

      if (!timeEntry) {
        spinner.succeed(`${EMOJIS.INFO} No timer currently running`)
        return
      }

      const elapsedSeconds = calculateElapsedSeconds(timeEntry.start)
      const elapsedTime = formatDuration(elapsedSeconds)
      const startTime = formatStartTime(timeEntry.start)

      spinner.succeed(`${EMOJIS.SUCCESS} Timer is running`)

      this.log('')
      this.log(`${EMOJIS.LOADING} Description: ${timeEntry.description || 'No description'}`)
      this.log(`${EMOJIS.INFO} Elapsed time: ${elapsedTime}`)
      this.log(`${EMOJIS.INFO} Started at: ${startTime}`)

      if (timeEntry.project_id) {
        try {
          const projects = await client.getProjects()
          const project = projects.find(p => p.id === timeEntry.project_id)
          if (project) {
            this.log(`${EMOJIS.INFO} Project: ${project.name}`)
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
            this.log(`${EMOJIS.INFO} Task: ${task.name}`)
          }
        } catch {
          // Silently ignore task lookup errors
        }
      }

    } catch (error) {
      spinner.fail(`${EMOJIS.ERROR} Failed to fetch timer status`)
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.error(`Error: ${message}`)
    }
  }
}
