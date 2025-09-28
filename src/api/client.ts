/**
 * Simple HTTP Client for Toggl API
 *
 * Provides a minimal, focused interface for making authenticated requests
 * to the Toggl Track API without complex abstractions.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios'

export interface TogglApiClient {
  get<T = any>(endpoint: string): Promise<T>
  post<T = any>(endpoint: string, data?: any): Promise<T>
  put<T = any>(endpoint: string, data?: any): Promise<T>
  delete<T = any>(endpoint: string): Promise<T>
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
      } catch (error) {
        throw formatApiError(error, 'GET', endpoint)
      }
    },

    async post<T>(endpoint: string, data?: any): Promise<T> {
      try {
        const response: AxiosResponse<T> = await client.post(endpoint, data)
        return response.data
      } catch (error) {
        throw formatApiError(error, 'POST', endpoint)
      }
    },

    async put<T>(endpoint: string, data?: any): Promise<T> {
      try {
        const response: AxiosResponse<T> = await client.put(endpoint, data)
        return response.data
      } catch (error) {
        throw formatApiError(error, 'PUT', endpoint)
      }
    },

    async delete<T>(endpoint: string): Promise<T> {
      try {
        const response: AxiosResponse<T> = await client.delete(endpoint)
        return response.data
      } catch (error) {
        throw formatApiError(error, 'DELETE', endpoint)
      }
    }
  }
}

/**
 * Format API errors with helpful context
 */
function formatApiError(error: any, method: string, endpoint: string): Error {
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

  // Other error
  return new Error(`Request failed: ${error.message}`)
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
  duration: number
  project_id?: number
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