import Table from 'cli-table3'
import ora from 'ora'

import {BaseCommand} from '../lib/base-command.js'

export default class Projects extends BaseCommand {
  static override description = 'List all projects in the workspace'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    this.loadConfigOrExit()
    const client = this.getClient()
    const spinner = ora('Fetching projects...').start()

    try {
      const projects = await client.getProjects()
      const clients = await client.getClients()

      spinner.succeed()

      if (projects.length === 0) {
        this.logInfo('No projects found in this workspace')
        return
      }

      // Create client lookup map
      const clientMap = new Map(clients.map(c => [c.id, c.name]))

      // Sort projects alphabetically by name
      const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name))

      // Create and display table
      const table = new Table({
        colWidths: [8, 40, 25, 8],
        head: ['ID', 'Name', 'Client', 'Active'],
        style: { head: ['cyan'] },
        wordWrap: true,
      })

      for (const project of sortedProjects) {
        const clientName = project.client_name || clientMap.get(project.workspace_id) || 'No Client'
        const activeStatus = project.active ? '✓' : '✗'

        table.push([project.id, project.name, clientName, activeStatus])
      }

      this.log('')
      this.log(table.toString())
      this.log('')

    } catch (error) {
      spinner.fail('Failed to fetch projects')
      this.handleError(error, 'Error fetching projects')
    }
  }
}
