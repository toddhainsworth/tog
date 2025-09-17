import axios, {type AxiosInstance} from 'axios'

import {
  ProjectsArraySchema,
  TasksArraySchema,
  TimeEntrySchema,
  UserSchema,
  WorkspacesArraySchema,
} from './validation.js'

interface TimeEntryPayload {
  billable?: boolean
  created_with: string
  description?: string
  duration?: number
  project_id?: number
  start: string
  stop?: string
  task_id?: number
  workspace_id?: number
}

export class TogglClient {
  private client: AxiosInstance

  constructor(apiToken: string) {
    this.client = axios.create({
      baseURL: 'https://api.track.toggl.com/api/v9',
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`, 'utf8').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })
  }

  ping(): Promise<boolean> {
    return this.client
      .get('/me')
      .then((response) => {
        const validatedUser = UserSchema.assert(response.data)
        return validatedUser.id > 0
      })
      .catch(() => false)
  }

  getCurrentTimeEntry(): Promise<any | null> {
    return this.client
      .get('/me/time_entries/current')
      .then((resp) => resp.data)
      .then((data) => data ? TimeEntrySchema.assert(data) : null)
  }

  stopTimeEntry(workspaceId: number, timeEntryId: number): Promise<boolean> {
    return this.client
      .patch(`/workspaces/${workspaceId}/time_entries/${timeEntryId}/stop`)
      .then(() => true)
      .catch(() => false)
  }

  getTasks(): Promise<any[]> {
    return this.client
      .get('/me/tasks?meta=true')
      .then((resp) => resp.data)
      .then(TasksArraySchema.assert)
  }

  getProjects(): Promise<any[]> {
    return this.client
      .get('/me/projects')
      .then((resp) => resp.data || [])
      .then(ProjectsArraySchema.assert)
  }

  getWorkspaces(): Promise<any[]> {
    return this.client
      .get('/me/workspaces')
      .then((resp) => resp.data || [])
      .then(WorkspacesArraySchema.assert)
  }

  createTimeEntry(workspaceId: number, timeEntry: TimeEntryPayload): Promise<any | null> {
    return this.client
      .post(`/workspaces/${workspaceId}/time_entries?meta=true`, timeEntry)
      .then((resp) => resp.data)
      .then(TimeEntrySchema.assert)
  }
}
