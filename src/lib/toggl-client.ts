import axios, {type AxiosInstance} from 'axios'
import dayjs from 'dayjs'

import {createApiErrorFromAxios, TogglValidationError} from './errors.js'
import {
  type Client,
  ClientsArraySchema,
  type Project,
  ProjectsArraySchema,
  ReportsSearchResponseSchema,
  type Task,
  TasksArraySchema,
  TimeEntriesArraySchema,
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
  project_id?: null | number
  start: string
  stop?: string
  task_id?: null | number
  workspace_id?: number
}

interface SearchTimeEntriesPayload {
  description?: string
  end_date?: string
  page_size?: number
  start_date?: string
}


export class TogglClient {
  private client: AxiosInstance
  private reportsClient: AxiosInstance

  constructor(apiToken: string) {
    this.client = axios.create({
      baseURL: 'https://api.track.toggl.com/api/v9',
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`, 'utf8').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    this.reportsClient = axios.create({
      baseURL: 'https://api.track.toggl.com/reports/api/v3',
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

  async getMostRecentTimeEntry(): Promise<null | TimeEntry> {
    try {
      const response = await this.client.get('/me/time_entries', {
        params: {
          page_size: 1,
        },
      })
      const data = response.data || []
      const entries = TimeEntriesArraySchema.assert(data)
      return entries.length > 0 ? entries[0] : null
    } catch (error) {
      if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
        throw TogglValidationError.invalidResponse(error.message)
      }

      throw createApiErrorFromAxios(error, '/me/time_entries')
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

  async getTimeEntries(startDate: string, endDate: string): Promise<TimeEntry[]> {
    try {
      const response = await this.client.get('/me/time_entries', {
        params: {
          end_date: endDate,
          start_date: startDate,
        },
      })
      const data = response.data || []
      return TimeEntriesArraySchema.assert(data)
    } catch (error) {
      if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
        throw TogglValidationError.invalidResponse(error.message)
      }

      throw createApiErrorFromAxios(error, '/me/time_entries')
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

  async searchTimeEntries(workspaceId: number, searchParams: SearchTimeEntriesPayload): Promise<TimeEntry[]> {
    try {
      // The Reports API v3 expects dates in YYYY-MM-DD format, not ISO strings
      const formattedParams = {
        ...searchParams,
        end_date: searchParams.end_date ? dayjs(searchParams.end_date).format('YYYY-MM-DD') : undefined,
        start_date: searchParams.start_date ? dayjs(searchParams.start_date).format('YYYY-MM-DD') : undefined,
      }

      const response = await this.reportsClient.post(`/workspace/${workspaceId}/search/time_entries`, formattedParams)

      // Validate the response structure
      const validatedGroups = ReportsSearchResponseSchema.assert(response.data || [])

      // Extract and convert to standard TimeEntry format
      return this.extractTimeEntriesFromGroups(validatedGroups, workspaceId)
    } catch (error) {
      if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
        throw TogglValidationError.invalidResponse(error.message)
      }

      throw createApiErrorFromAxios(error, `/workspace/${workspaceId}/search/time_entries`)
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

  async updateTimeEntry(workspaceId: number, timeEntryId: number, updates: Partial<TimeEntryPayload>): Promise<TimeEntry> {
    try {
      const response = await this.client.put(`/workspaces/${workspaceId}/time_entries/${timeEntryId}`, updates)
      return TimeEntrySchema.assert(response.data)
    } catch (error) {
      if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
        throw TogglValidationError.invalidResponse(error.message)
      }

      throw createApiErrorFromAxios(error, `/workspaces/${workspaceId}/time_entries/${timeEntryId}`)
    }
  }

  private extractTimeEntriesFromGroups(groupedData: typeof ReportsSearchResponseSchema.infer, workspaceId: number): TimeEntry[] {
    const timeEntries: TimeEntry[] = []

    for (const group of groupedData) {
      for (const entry of group.time_entries) {
        // Convert Reports API format to standard TimeEntry format
        // Note: Use null instead of undefined for optional fields to match TimeEntry schema
        const timeEntry: TimeEntry = {
          at: entry.at,
          description: group.description || '',
          duration: entry.seconds,
          id: entry.id,
          project_id: group.project_id ?? undefined, // Keep undefined for project_id
          start: entry.start,
          stop: entry.stop ?? undefined, // Keep undefined for stop
          task_id: group.task_id ?? null, // Use null for task_id
          workspace_id: entry.workspace_id || workspaceId,
        }

        // Validate the converted entry matches our TimeEntry schema
        timeEntries.push(TimeEntrySchema.assert(timeEntry))
      }
    }

    return timeEntries
  }
}
