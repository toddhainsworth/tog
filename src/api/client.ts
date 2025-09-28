/**
 * Simple HTTP Client for Toggl API
 *
 * Provides a minimal, focused interface for making authenticated requests
 * to the Toggl Track API without complex abstractions.
 */

import axios, { AxiosInstance, AxiosResponse, isAxiosError } from 'axios'

export interface TogglApiClient {
  get<T = unknown>(endpoint: string): Promise<T>
  post<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<T>
  put<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<T>
  patch<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<T>
  delete<T = unknown>(endpoint: string): Promise<T>
}

/**
 * Create a Toggl API client with authentication
 *
 * @param apiToken - Toggl API token
 * @returns Configured API client
 */
export function createTogglClient(apiToken: string): TogglApiClient {
  // Create axios instance with Toggl API configuration
  const client: AxiosInstance = axios.create({
    baseURL: 'https://api.track.toggl.com/api/v9',
    auth: {
      username: apiToken,
      password: 'api_token'
    },
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'tog-cli/0.6.0'
    },
    timeout: 10000
  })

  return {
    async get<T>(endpoint: string): Promise<T> {
      try {
        const response: AxiosResponse<T> = await client.get(endpoint)
        return response.data
      } catch (error: unknown) {
        throw formatApiError(error, 'GET', endpoint)
      }
    },

    async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
      try {
        const response: AxiosResponse<T> = await client.post(endpoint, data)
        return response.data
      } catch (error: unknown) {
        throw formatApiError(error, 'POST', endpoint)
      }
    },

    async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
      try {
        const response: AxiosResponse<T> = await client.put(endpoint, data)
        return response.data
      } catch (error: unknown) {
        throw formatApiError(error, 'PUT', endpoint)
      }
    },

    async patch<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
      try {
        const response: AxiosResponse<T> = await client.patch(endpoint, data)
        return response.data
      } catch (error: unknown) {
        throw formatApiError(error, 'PATCH', endpoint)
      }
    },

    async delete<T>(endpoint: string): Promise<T> {
      try {
        const response: AxiosResponse<T> = await client.delete(endpoint)
        return response.data
      } catch (error: unknown) {
        throw formatApiError(error, 'DELETE', endpoint)
      }
    }
  }
}

/**
 * Format API errors with helpful context
 */
function formatApiError(error: unknown, method: string, endpoint: string): Error {
  // Use axios's built-in type guard
  if (isAxiosError(error)) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const message = error.response.data?.message || error.response.statusText

      if (status === 401) {
        return new Error('Invalid API token. Run "tog init" to set up authentication.')
      }

      if (status === 403) {
        return new Error('Access denied. Check your API token permissions.')
      }

      if (status === 429) {
        return new Error('Rate limit exceeded. Please wait before retrying.')
      }

      return new Error(`API error ${status}: ${message}`)
    }

    if (error.request) {
      // Network error
      return new Error('Network error: Unable to connect to Toggl API. Check your internet connection.')
    }
  }

  // Handle Error instances
  if (error instanceof Error) {
    return new Error(`Request failed: ${error.message}`)
  }

  // Fallback for unknown error types
  return new Error(`Request failed: ${String(error)}`)
}

/**
 * Common Toggl API types
 */
export interface TogglUser {
  id: number
  email: string
  fullname: string
  default_workspace_id: number
  timezone: string
}

export interface TogglTimeEntry {
  id: number
  description: string
  start: string
  stop?: string | null
  duration: number
  project_id?: number
  task_id?: number
  workspace_id: number
  billable: boolean
  created_with: string
}

export interface TogglProject {
  id: number
  name: string
  color: string
  active: boolean
  workspace_id: number
  client_id?: number
}

export interface TogglTask {
  id: number
  name: string
  project_id: number
  workspace_id: number
  active: boolean
}

export interface TogglClient {
  id: number
  name: string
}