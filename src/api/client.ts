/**
 * Simple HTTP Client for Toggl API
 *
 * Provides a minimal, focused interface for making authenticated requests
 * to the Toggl Track API without complex abstractions.
 */

import axios, { AxiosInstance, AxiosResponse, isAxiosError } from 'axios'
import { FileCacheManager } from '../utils/cache.js'

export interface TogglApiClient {
  get<T = unknown>(endpoint: string): Promise<T>
  post<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<T>
  put<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<T>
  patch<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<T>
  delete<T = unknown>(endpoint: string): Promise<T>
}

/**
 * Create a Toggl API client with authentication and caching
 *
 * @param apiToken - Toggl API token
 * @returns Configured API client with intelligent caching for reference data
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

  // Initialize cache for reference data
  const cache = new FileCacheManager()

  return {
    async get<T>(endpoint: string): Promise<T> {
      // Determine if this endpoint should be cached
      const cacheKey = `${apiToken.substring(0, 8)}_${endpoint}`

      if (shouldCacheEndpoint(endpoint)) {
        const ttl = getCacheTTL(endpoint)
        return cache.getOrFetch(cacheKey, async () => {
          try {
            const response: AxiosResponse<T> = await client.get(endpoint)
            return response.data
          } catch (error: unknown) {
            throw formatApiError(error, 'GET', endpoint)
          }
        }, ttl)
      }

      // Direct API call for non-cached endpoints
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
        // Invalidate related cache entries for data-modifying operations
        await invalidateRelatedCache(cache, endpoint, apiToken)
        return response.data
      } catch (error: unknown) {
        throw formatApiError(error, 'POST', endpoint)
      }
    },

    async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
      try {
        const response: AxiosResponse<T> = await client.put(endpoint, data)
        // Invalidate related cache entries for data-modifying operations
        await invalidateRelatedCache(cache, endpoint, apiToken)
        return response.data
      } catch (error: unknown) {
        throw formatApiError(error, 'PUT', endpoint)
      }
    },

    async patch<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
      try {
        const response: AxiosResponse<T> = await client.patch(endpoint, data)
        // Invalidate related cache entries for data-modifying operations
        await invalidateRelatedCache(cache, endpoint, apiToken)
        return response.data
      } catch (error: unknown) {
        throw formatApiError(error, 'PATCH', endpoint)
      }
    },

    async delete<T>(endpoint: string): Promise<T> {
      try {
        const response: AxiosResponse<T> = await client.delete(endpoint)
        // Invalidate related cache entries for data-modifying operations
        await invalidateRelatedCache(cache, endpoint, apiToken)
        return response.data
      } catch (error: unknown) {
        throw formatApiError(error, 'DELETE', endpoint)
      }
    }
  }
}

/**
 * Determines if an endpoint should be cached based on data type
 */
function shouldCacheEndpoint(endpoint: string): boolean {
  // Cache reference data that rarely changes
  return endpoint.includes('/projects') ||
         endpoint.includes('/tasks') ||
         endpoint.includes('/clients') ||
         endpoint === '/me' ||
         endpoint.includes('/workspaces')
}

/**
 * Gets cache TTL based on endpoint type
 */
function getCacheTTL(endpoint: string): number {
  if (endpoint === '/me') {
    return 600_000 // 10 minutes for user data
  }
  if (endpoint.includes('/current')) {
    return 30_000 // 30 seconds for current timer
  }
  if (endpoint.includes('/projects') || endpoint.includes('/tasks') || endpoint.includes('/clients')) {
    return 300_000 // 5 minutes for reference data
  }
  if (endpoint.includes('/workspaces')) {
    return 1800_000 // 30 minutes for workspace data
  }
  return 300_000 // Default 5 minutes
}

/**
 * Invalidates cache entries related to a modified endpoint
 */
async function invalidateRelatedCache(cache: FileCacheManager, endpoint: string, apiToken: string): Promise<void> {
  const tokenPrefix = apiToken.substring(0, 8)

  // Invalidate current timer cache when creating/modifying time entries
  if (endpoint.includes('/time_entries')) {
    await cache.delete(`${tokenPrefix}_/me/time_entries/current`)
  }

  // Invalidate project cache when modifying projects
  if (endpoint.includes('/projects')) {
    await cache.delete(`${tokenPrefix}_/workspaces`)
    // Could invalidate specific workspace project endpoints here
  }

  // Invalidate task cache when modifying tasks
  if (endpoint.includes('/tasks')) {
    await cache.delete(`${tokenPrefix}_/workspaces`)
    // Could invalidate specific task endpoints here
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