import {Flags} from '@oclif/core'
import Table from 'cli-table3'
import ora from 'ora'

import type {TogglClient} from '../lib/toggl-client.js'
import type {Client, Project, Task} from '../lib/validation.js'

import {BaseCommand} from '../lib/base-command.js'

export default class Clients extends BaseCommand {
  static override description = 'List all clients in the workspace'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --tree',
  ]
  static override flags = {
    tree: Flags.boolean({
      description: 'Display clients in hierarchical tree format with projects and tasks',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Clients)
    this.loadConfigOrExit()
    const client = this.getClient()
    const spinner = ora('Fetching clients...').start()

    try {
      const clients = await client.getClients()
      const projects = await client.getProjects()

      spinner.succeed()

      if (clients.length === 0) {
        this.logInfo('No clients found in this workspace')
        return
      }

      if (flags.tree) {
        await this.displayTreeView(clients, projects, client)
      } else {
        this.displayTableView(clients, projects)
      }

    } catch (error) {
      spinner.fail('Failed to fetch clients')
      this.handleError(error, 'Error fetching clients')
    }
  }

  private displayClientsTree(clients: Client[], clientProjectMap: Map<string, Project[]>, projectTaskMap: Map<number, Task[]>): void {
    const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name))

    this.log('')

    for (const clientItem of sortedClients) {
      const clientProjects = (clientProjectMap.get(clientItem.name) || [])
        .sort((a, b) => a.name.localeCompare(b.name))

      this.log(`📁 ${clientItem.name}`)

      if (clientProjects.length === 0) {
        continue
      }

      this.displayProjectsWithTasks(clientProjects, projectTaskMap)
      this.log('')
    }
  }

  private displayOrphanedEntities(orphanedProjects: Project[], orphanedTasks: Task[], projectTaskMap: Map<number, Task[]>): void {
    if (orphanedProjects.length === 0 && orphanedTasks.length === 0) {
      return
    }

    this.log('📁 No Client')

    const sortedOrphanedProjects = orphanedProjects.sort((a, b) => a.name.localeCompare(b.name))

    for (let i = 0; i < sortedOrphanedProjects.length; i++) {
      const project = sortedOrphanedProjects[i]
      if (!project) continue
      const isLastProject = i === sortedOrphanedProjects.length - 1 && orphanedTasks.length === 0
      const projectPrefix = isLastProject ? '└── ' : '├── '

      this.log(`${projectPrefix}📋 ${project.name}`)

      const projectTasks = (projectTaskMap.get(project.id) || [])
        .sort((a, b) => a.name.localeCompare(b.name))

      for (let j = 0; j < projectTasks.length; j++) {
        const task = projectTasks[j]
        if (!task) continue
        const isLastTask = j === projectTasks.length - 1
        const taskPrefix = isLastProject
          ? (isLastTask ? '    └── ' : '    ├── ')
          : (isLastTask ? '│   └── ' : '│   ├── ')

        this.log(`${taskPrefix}📝 ${task.name}`)
      }
    }

    const sortedOrphanedTasks = orphanedTasks.sort((a, b) => a.name.localeCompare(b.name))
    for (let i = 0; i < sortedOrphanedTasks.length; i++) {
      const task = sortedOrphanedTasks[i]
      if (!task) continue
      const isLastTask = i === sortedOrphanedTasks.length - 1
      const taskPrefix = isLastTask ? '└── ' : '├── '

      this.log(`${taskPrefix}📝 ${task.name}`)
    }

    this.log('')
  }

  private displayProjectsWithTasks(projects: Project[], projectTaskMap: Map<number, Task[]>): void {
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]
      if (!project) continue
      const isLastProject = i === projects.length - 1
      const projectPrefix = isLastProject ? '└── ' : '├── '

      this.log(`${projectPrefix}📋 ${project.name}`)

      const projectTasks = (projectTaskMap.get(project.id) || [])
        .sort((a, b) => a.name.localeCompare(b.name))

      for (let j = 0; j < projectTasks.length; j++) {
        const task = projectTasks[j]
        if (!task) continue
        const isLastTask = j === projectTasks.length - 1
        const taskPrefix = isLastProject
          ? (isLastTask ? '    └── ' : '    ├── ')
          : (isLastTask ? '│   └── ' : '│   ├── ')

        this.log(`${taskPrefix}📝 ${task.name}`)
      }
    }
  }

  private displayTableView(clients: Client[], projects: Project[]): void {
    // Create project count map
    const projectCounts = new Map<number, number>()
    for (const project of projects) {
      if (project.client_name) {
        // Find client by name since projects have client_name
        const matchingClient = clients.find(c => c.name === project.client_name)
        if (matchingClient) {
          projectCounts.set(matchingClient.id, (projectCounts.get(matchingClient.id) || 0) + 1)
        }
      }
    }

    // Sort clients alphabetically by name
    const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name))

    // Create and display table
    const table = new Table({
      colWidths: [8, 40, 15],
      head: ['ID', 'Name', 'Project Count'],
      style: { head: ['cyan'] },
      wordWrap: true,
    })

    for (const clientItem of sortedClients) {
      const projectCount = projectCounts.get(clientItem.id) || 0
      table.push([clientItem.id, clientItem.name, projectCount])
    }

    this.log('')
    this.log(table.toString())
    this.log('')
  }

  private async displayTreeView(clients: Client[], projects: Project[], client: TogglClient): Promise<void> {
    const tasks = await client.getTasks()
    const {clientProjectMap, orphanedProjects, orphanedTasks, projectTaskMap} = this.organizeTreeData(projects, tasks)

    this.displayClientsTree(clients, clientProjectMap, projectTaskMap)
    this.displayOrphanedEntities(orphanedProjects, orphanedTasks, projectTaskMap)
  }

  private organizeTreeData(projects: Project[], tasks: Task[]) {
    const clientProjectMap = new Map<string, Project[]>()
    const orphanedProjects: Project[] = []
    const projectTaskMap = new Map<number, Task[]>()
    const orphanedTasks: Task[] = []

    for (const project of projects) {
      if (project.client_name) {
        if (!clientProjectMap.has(project.client_name)) {
          clientProjectMap.set(project.client_name, [])
        }

        const projectList = clientProjectMap.get(project.client_name)
        if (projectList) {
          projectList.push(project)
        }
      } else {
        orphanedProjects.push(project)
      }
    }

    for (const task of tasks) {
      if (task.project_id) {
        if (!projectTaskMap.has(task.project_id)) {
          projectTaskMap.set(task.project_id, [])
        }

        const taskList = projectTaskMap.get(task.project_id)
        if (taskList) {
          taskList.push(task)
        }
      } else {
        orphanedTasks.push(task)
      }
    }

    return {clientProjectMap, orphanedProjects, orphanedTasks, projectTaskMap}
  }
}
