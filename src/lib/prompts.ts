import inquirer from 'inquirer'

import {EMOJIS} from './emojis.js'

// Enhanced prompt utilities for consistent CLI UX

export interface TaskChoice {
  value: {
    task_id?: number
    project_id?: number
    display: string
  }
  name: string
  short?: string
}

export interface PromptConfig {
  message: string
  choices?: TaskChoice[]
  validate?: (input: string) => boolean | string
  default?: string
}

export async function promptForDescription(message: string = 'Enter timer description'): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: `${EMOJIS.INFO} ${message}:`,
      validate: (input: string) => {
        const trimmed = input.trim()
        if (trimmed.length === 0) {
          return 'Description cannot be empty'
        }
        if (trimmed.length > 200) {
          return 'Description must be 200 characters or less'
        }
        return true
      },
      transformer: (input: string) => {
        const trimmed = input.trim()
        const remaining = 200 - trimmed.length
        return remaining < 20 ? `${trimmed} (${remaining} chars left)` : trimmed
      }
    }
  ])

  return answers.description.trim()
}

export async function promptForTaskSelection(
  tasks: Array<{
    id: number
    name: string
    project_id: number
    project_name?: string
    client_name?: string
  }>,
  projects: Array<{
    id: number
    name: string
    client_name?: string
  }>
): Promise<{task_id?: number; project_id?: number; display: string}> {
  const choices: TaskChoice[] = []

  // Add tasks first (with project context)
  if (tasks.length > 0) {
    for (const task of tasks) {
      const project = projects.find(p => p.id === task.project_id)
      const projectName = project?.name || task.project_name || 'Unknown Project'
      const clientName = project?.client_name || task.client_name || ''
      const clientSuffix = clientName ? ` (${clientName})` : ''
      const displayName = `📋 ${task.name} - ${projectName}${clientSuffix}`

      choices.push({
        name: displayName,
        short: task.name,
        value: {
          task_id: task.id,
          project_id: task.project_id,
          display: displayName
        }
      })
    }
  }

  // Add projects without tasks
  const projectsWithoutTasks = projects.filter(p =>
    !tasks.some(t => t.project_id === p.id)
  )

  for (const project of projectsWithoutTasks) {
    const clientSuffix = project.client_name ? ` (${project.client_name})` : ''
    const displayName = `📁 ${project.name}${clientSuffix}`

    choices.push({
      name: displayName,
      short: project.name,
      value: {
        project_id: project.id,
        display: displayName
      }
    })
  }

  if (choices.length === 0) {
    throw new Error('No tasks or projects available for selection')
  }

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: `${EMOJIS.LOADING} Select a ${tasks.length > 0 ? 'task or project' : 'project'}:`,
      choices,
      pageSize: Math.min(15, choices.length),
      loop: false
    }
  ])

  return answer.selection
}

export async function promptForConfirmation(
  message: string,
  defaultValue: boolean = false
): Promise<boolean> {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `${EMOJIS.WARNING} ${message}`,
      default: defaultValue
    }
  ])

  return answer.confirmed
}

export async function promptForWorkspaceSelection(
  workspaces: Array<{id: number; name: string}>
): Promise<number> {
  if (workspaces.length === 0) {
    throw new Error('No workspaces available for selection')
  }

  if (workspaces.length === 1) {
    return workspaces[0].id
  }

  const choices = workspaces.map(workspace => ({
    name: workspace.name,
    value: workspace.id,
    short: workspace.name
  }))

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'workspaceId',
      message: `${EMOJIS.LOADING} Select default workspace:`,
      choices,
      pageSize: Math.min(10, choices.length),
      loop: false
    }
  ])

  return answer.workspaceId
}