import axios, {type AxiosInstance} from 'axios'

import {createApiErrorFromAxios, TogglValidationError} from './errors.js'
import {
  type Client,
  ClientsArraySchema,
  type Project,
  ProjectsArraySchema,
  type Task,
  TasksArraySchema,
  type TimeEntry,
  TimeEntrySchema,
  UserSchema,
  type Workspace,
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

  async createTimeEntry(workspaceId: number, timeEntry: TimeEntryPayload): Promise<TimeEntry> {
    try {
      const response = await this.client.post(`/workspaces/${workspaceId}/time_entries?meta=true`, timeEntry)
      return TimeEntrySchema.assert(response.data)
    } catch (error) {
      if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
        throw TogglValidationError.invalidResponse(error.message)
      }

      throw createApiErrorFromAxios(error, `/workspaces/${workspaceId}/time_entries`)
    }
  }

  async getClients(): Promise<Client[]> {
    try {
      const response = await this.client.get('/me/clients')
      const data = response.data || []
      return ClientsArraySchema.assert(data)
    } catch (error) {
      if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
        throw TogglValidationError.invalidResponse(error.message)
      }

      throw createApiErrorFromAxios(error, '/me/clients')
    }
  }

  async getCurrentTimeEntry(): Promise<null | TimeEntry> {
    try {
      const {data} = await this.client.get('/me/time_entries/current')
      return data ? TimeEntrySchema.assert(data) : null
    } catch (error) {
      if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
        throw TogglValidationError.invalidResponse(error.message)
      }

      throw createApiErrorFromAxios(error, '/me/time_entries/current')
    }
  }

  async getProjects(): Promise<Project[]> {
    try {
      const response = await this.client.get('/me/projects')
      const data = response.data || []
      return ProjectsArraySchema.assert(data)
    } catch (error) {
      if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
        throw TogglValidationError.invalidResponse(error.message)
      }

      throw createApiErrorFromAxios(error, '/me/projects')
    }
  }

  async getTasks(): Promise<Task[]> {
    try {
      const response = await this.client.get('/me/tasks?meta=true')
      return TasksArraySchema.assert(response.data)
    } catch (error) {
      if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
        throw TogglValidationError.invalidResponse(error.message)
      }

      throw createApiErrorFromAxios(error, '/me/tasks')
    }
  }

  async getWorkspaces(): Promise<Workspace[]> {
    try {
      const response = await this.client.get('/me/workspaces')
      const data = response.data || []
      return WorkspacesArraySchema.assert(data)
    } catch (error) {
      if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
        throw TogglValidationError.invalidResponse(error.message)
      }

      throw createApiErrorFromAxios(error, '/me/workspaces')
    }
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.client.get('/me')
      const validatedUser = UserSchema.assert(response.data)
      return validatedUser.id > 0
    } catch {
      // For ping, we want to return false rather than throw
      // This is used for connectivity testing
      return false
    }
  }

  async stopTimeEntry(workspaceId: number, timeEntryId: number): Promise<boolean> {
    try {
      await this.client.patch(`/workspaces/${workspaceId}/time_entries/${timeEntryId}/stop`)
      return true
    } catch {
      // For stop operations, return false to indicate failure
      // The caller can decide how to handle this
      return false
    }
  }
}
