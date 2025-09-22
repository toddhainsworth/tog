import Table from 'cli-table3'
import ora from 'ora'

import {BaseCommand} from '../lib/base-command.js'

export default class Tasks extends BaseCommand {
  static override description = 'List all tasks in the workspace'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    this.loadConfigOrExit()
    const client = this.getClient()
    const spinner = ora('Fetching tasks...').start()

    try {
      const tasks = await client.getTasks()
      const projects = await client.getProjects()

      spinner.succeed()

      if (tasks.length === 0) {
        this.logInfo('No tasks found in this workspace')
        return
      }

      // Create project lookup map
      const projectMap = new Map(projects.map(p => [p.id, p.name]))

      // Sort tasks alphabetically by name
      const sortedTasks = [...tasks].sort((a, b) => a.name.localeCompare(b.name))

      // Create and display table
      const table = new Table({
        colWidths: [40, 25, 8, 8],
        head: ['Name', 'Project', 'Active', 'ID'],
        style: { head: ['cyan'] },
        wordWrap: true,
      })

      for (const task of sortedTasks) {
        const projectName = projectMap.get(task.project_id) || 'No Project'
        const activeStatus = task.active ? '✓' : '✗'

        table.push([task.name, projectName, activeStatus, task.id])
      }

      this.log('')
      this.log(table.toString())
      this.log('')

    } catch (error) {
      spinner.fail('Failed to fetch tasks')
      this.handleError(error, 'Error fetching tasks')
    }
  }
}
