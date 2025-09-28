import Table from 'cli-table3'
import ora from 'ora'

import {BaseCommand} from '../lib/base-command.js'
import {ProjectService} from '../lib/project-service.js'
import {TaskService} from '../lib/task-service.js'

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
      const tasks = await TaskService.getTasks(client, this.getLoggingContext())
      const projects = await ProjectService.getProjects(client, this.getLoggingContext())

      spinner.succeed()

      if (tasks.length === 0) {
        this.logInfo('No tasks found in this workspace')
        return
      }

      // Create project lookup map using ProjectService
      const projectLookupMap = ProjectService.createProjectLookupMap(projects)

      // Sort tasks using TaskService
      const sortedTasks = TaskService.sortTasksByName(tasks)

      // Create and display table
      const table = new Table({
        colWidths: [8, 40, 25, 8],
        head: ['ID', 'Name', 'Project', 'Active'],
        style: { head: ['cyan'] },
        wordWrap: true,
      })

      for (const task of sortedTasks) {
        const projectName = task.project_id ? projectLookupMap.get(task.project_id) || 'No Project' : 'No Project'
        const activeStatus = task.active ? '✓' : '✗'

        table.push([task.id, task.name, projectName, activeStatus])
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
