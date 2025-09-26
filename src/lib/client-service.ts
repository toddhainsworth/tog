import type { TogglClient } from './toggl-client.js'
import type { Client } from './validation.js'

export interface LoggingContext {
  debug?: (message: string, data?: Record<string, unknown>) => void
  warn?: (message: string) => void
}

export interface ClientSelectionResult {
  client?: Client
  error?: string
  success: boolean
}

export const ClientService = {
  /**
   * Creates a client lookup map for efficient client name to ID resolution.
   */
  createClientLookupMap(clients: Client[]): Map<string, Client> {
    return new Map(clients.map(client => [client.name.toLowerCase(), client]))
  },

  /**
   * Filters clients by name pattern.
   */
  filterClientsByName(clients: Client[], pattern: string): Client[] {
    const lowercasePattern = pattern.toLowerCase()
    return clients.filter(c =>
      c.name.toLowerCase().includes(lowercasePattern)
    )
  },

  /**
   * Finds a client by its ID.
   */
  findClientById(clients: Client[], clientId: number): Client | null {
    return clients.find(c => c.id === clientId) || null
  },

  /**
   * Finds a client by name (case-insensitive partial match) or exact ID.
   * Supports exact matches taking precedence over partial matches.
   * Throws error if multiple partial matches are found without an exact match.
   */
  findClientByNameOrId(clients: Client[], input: string): Client | null {
    // Try to parse as ID first
    const id = Number.parseInt(input, 10)
    if (!Number.isNaN(id)) {
      return clients.find(c => c.id === id) || null
    }

    // Case-insensitive name matching
    const lowercaseInput = input.toLowerCase()
    const matches = clients.filter(c =>
      c.name.toLowerCase().includes(lowercaseInput)
    )

    if (matches.length === 0) {
      return null
    }

    if (matches.length === 1) {
      return matches[0] ?? null
    }

    // Multiple matches - look for exact match first
    const exactMatch = matches.find(c =>
      c.name.toLowerCase() === lowercaseInput
    )
    if (exactMatch) {
      return exactMatch
    }

    // Multiple partial matches - this is ambiguous
    const names = matches.map(c => c.name).join(', ')
    throw new Error(`Multiple clients match "${input}": ${names}. Please be more specific.`)
  },

  /**
   * Gets client by name using a lookup map (more efficient for bulk operations).
   */
  getClientFromLookupMap(lookupMap: Map<string, Client>, clientName: string): Client | undefined {
    return lookupMap.get(clientName.toLowerCase())
  },

  /**
   * Fetches all clients for the authenticated user.
   * Returns empty array on error.
   */
  async getClients(client: TogglClient, context?: LoggingContext): Promise<Client[]> {
    try {
      context?.debug?.('Fetching user clients')
      const clients = await client.getClients()
      context?.debug?.('Clients fetched successfully', { count: clients.length })
      return clients
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        // If it's an Error but message is empty, check other properties or toString
        errorMessage = error.message || error.toString() || 'Unknown error'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = JSON.stringify(error)
      }

      context?.debug?.('Failed to fetch clients', { error: errorMessage })
      context?.warn?.('Failed to fetch clients')
      return []
    }
  },

  /**
   * Gets client statistics for reporting.
   */
  async getClientStats(togglClient: TogglClient, projects: Array<{ client_name?: null | string }>, context?: LoggingContext): Promise<{
    averageProjectsPerClient: number
    clientsWithoutProjects: number
    clientsWithProjects: number
    error?: string
    topClientsByProjects: Array<{ name: string; projectCount: number }>
    totalClients: number
  }> {
    try {
      // Call the client API directly to ensure errors are propagated
      context?.debug?.('Fetching user clients for statistics')
      const clients = await togglClient.getClients()
      context?.debug?.('Clients fetched successfully for statistics', { count: clients.length })

      const clientsWithCounts = this.getClientsWithProjectCounts(clients, projects)

      const totalClients = clients.length
      const clientsWithProjects = clientsWithCounts.filter(c => c.projectCount > 0).length
      const clientsWithoutProjects = totalClients - clientsWithProjects
      const totalProjects = clientsWithCounts.reduce((sum, c) => sum + c.projectCount, 0)
      const averageProjectsPerClient = totalClients > 0 ? totalProjects / totalClients : 0

      // Get top 5 clients by project count (only include clients with projects)
      const topClientsByProjects = clientsWithCounts
        .filter(c => c.projectCount > 0)
        .sort((a, b) => b.projectCount - a.projectCount)
        .slice(0, 5)
        .map(c => ({
          name: c.client.name,
          projectCount: c.projectCount
        }))

      return {
        averageProjectsPerClient: Math.round(averageProjectsPerClient * 100) / 100,
        clientsWithoutProjects,
        clientsWithProjects,
        topClientsByProjects,
        totalClients
      }
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        // If it's an Error but message is empty, check other properties or toString
        errorMessage = error.message || error.toString() || 'Unknown error'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = JSON.stringify(error)
      }

      context?.debug?.('Failed to get client statistics', { error: errorMessage })
      return {
        averageProjectsPerClient: 0,
        clientsWithoutProjects: 0,
        clientsWithProjects: 0,
        error: `Failed to get client statistics: ${errorMessage}`,
        topClientsByProjects: [],
        totalClients: 0
      }
    }
  },

  /**
   * Gets clients with their project counts.
   * This requires project data to be passed in since ClientService doesn't directly depend on ProjectService.
   */
  getClientsWithProjectCounts(clients: Client[], projects: Array<{ client_name?: null | string }>): Array<{
    client: Client
    projectCount: number
  }> {
    const projectCounts = new Map<string, number>()

    // Count projects by client name
    for (const project of projects) {
      if (project.client_name) {
        projectCounts.set(project.client_name, (projectCounts.get(project.client_name) || 0) + 1)
      }
    }

    return clients.map(client => ({
      client,
      projectCount: projectCounts.get(client.name) || 0
    }))
  },

  /**
   * Selects a client based on name or ID input.
   * Includes comprehensive validation and error handling.
   */
  async selectClient(togglClient: TogglClient, input: string, context?: LoggingContext): Promise<ClientSelectionResult> {
    try {
      context?.debug?.('Selecting client', { input })

      // Call the client API directly to ensure errors are propagated
      const clients = await togglClient.getClients()

      if (clients.length === 0) {
        return {
          error: 'No clients found in this workspace',
          success: false
        }
      }

      const client = this.findClientByNameOrId(clients, input)

      if (!client) {
        return {
          error: `Client "${input}" not found`,
          success: false
        }
      }

      context?.debug?.('Client selection successful', {
        clientId: client.id,
        clientName: client.name
      })

      return {
        client,
        success: true
      }
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        // If it's an Error but message is empty, check other properties or toString
        errorMessage = error.message || error.toString() || 'Unknown error'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = JSON.stringify(error)
      }

      context?.debug?.('Client selection failed', { error: errorMessage, input })
      return {
        error: errorMessage,
        success: false
      }
    }
  },

  /**
   * Sorts clients alphabetically by name.
   */
  sortClientsByName(clients: Client[]): Client[] {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name))
  },

  /**
   * Validates that a client exists and is accessible.
   */
  async validateClient(togglClient: TogglClient, clientId: number, context?: LoggingContext): Promise<ClientSelectionResult> {
    if (!clientId || clientId <= 0) {
      return {
        error: 'Invalid client ID provided',
        success: false
      }
    }

    try {
      // Call the client API directly to ensure errors are propagated
      const clients = await togglClient.getClients()
      const client = this.findClientById(clients, clientId)

      if (!client) {
        return {
          error: `Client with ID ${clientId} not found or not accessible`,
          success: false
        }
      }

      context?.debug?.('Client validation successful', {
        clientId,
        clientName: client.name
      })

      return {
        client,
        success: true
      }
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        // If it's an Error but message is empty, check other properties or toString
        errorMessage = error.message || error.toString() || 'Unknown error'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = JSON.stringify(error)
      }

      context?.debug?.('Client validation failed', { clientId, error: errorMessage })
      return {
        error: `Failed to validate client: ${errorMessage}`,
        success: false
      }
    }
  }
};