import type { CachedTogglClient } from './cached-toggl-client.js'
import type { TogglClient } from './toggl-client.js'
import type { Workspace } from './validation.js'

export interface LoggingContext {
  debug?: (message: string, data?: Record<string, unknown>) => void
  warn?: (message: string) => void
}

export interface WorkspaceSelectionResult {
  error?: string
  success: boolean
  workspace?: Workspace
}

export const WorkspaceService = {
  /**
   * Finds a workspace by ID.
   * Returns null if not found.
   */
  findWorkspaceById(workspaces: Workspace[], workspaceId: number): null | Workspace {
    return workspaces.find(w => w.id === workspaceId) || null
  },

  /**
   * Finds a workspace by name (case-insensitive partial match) or exact ID.
   * Supports exact matches taking precedence over partial matches.
   * Throws error if multiple partial matches are found without an exact match.
   */
  findWorkspaceByNameOrId(workspaces: Workspace[], input: string): null | Workspace {
    // Try to parse as ID first
    const id = Number.parseInt(input, 10)
    if (!Number.isNaN(id)) {
      return this.findWorkspaceById(workspaces, id)
    }

    // Case-insensitive name matching
    const lowercaseInput = input.toLowerCase()
    const matches = workspaces.filter(w =>
      w.name.toLowerCase().includes(lowercaseInput)
    )

    if (matches.length === 0) {
      return null
    }

    if (matches.length === 1) {
      return matches[0] ?? null
    }

    // Multiple matches - look for exact match first
    const exactMatch = matches.find(w =>
      w.name.toLowerCase() === lowercaseInput
    )
    if (exactMatch) {
      return exactMatch
    }

    // Multiple partial matches - this is ambiguous
    const names = matches.map(w => w.name).join(', ')
    throw new Error(`Multiple workspaces match "${input}": ${names}. Please be more specific.`)
  },

  /**
   * Gets the default workspace (first available workspace).
   * Useful for single-workspace scenarios.
   */
  async getDefaultWorkspace(client: CachedTogglClient | TogglClient, context?: LoggingContext): Promise<null | Workspace> {
    const workspaces = await this.getWorkspaces(client, context)
    return workspaces.length > 0 ? (workspaces[0] ?? null) : null
  },

  /**
   * Fetches all workspaces for the authenticated user.
   * Returns empty array on error.
   */
  async getWorkspaces(client: CachedTogglClient | TogglClient, context?: LoggingContext): Promise<Workspace[]> {
    try {
      context?.debug?.('Fetching user workspaces')
      const workspaces = await client.getWorkspaces()
      context?.debug?.('Workspaces fetched successfully', { count: workspaces.length })
      return workspaces
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      context?.debug?.('Failed to fetch workspaces', { error: errorMessage })
      context?.warn?.('Failed to fetch workspaces')
      return []
    }
  },

  /**
   * Validates that a workspace ID exists and is accessible.
   * Returns validation result with success flag and optional error.
   */
  async validateWorkspace(client: CachedTogglClient | TogglClient, workspaceId: number, context?: LoggingContext): Promise<WorkspaceSelectionResult> {
    if (!workspaceId || workspaceId <= 0) {
      return {
        error: 'Invalid workspace ID provided',
        success: false
      }
    }

    try {
      const workspaces = await this.getWorkspaces(client, context)
      const workspace = this.findWorkspaceById(workspaces, workspaceId)

      if (!workspace) {
        return {
          error: `Workspace with ID ${workspaceId} not found or not accessible`,
          success: false
        }
      }

      context?.debug?.('Workspace validation successful', { workspaceId, workspaceName: workspace.name })
      return {
        success: true,
        workspace
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      context?.debug?.('Workspace validation failed', { error: errorMessage, workspaceId })
      return {
        error: `Failed to validate workspace: ${errorMessage}`,
        success: false
      }
    }
  },

  /**
   * Validates workspace access and returns workspace details.
   * This is useful for configuration validation.
   */
  async validateWorkspaceAccess(client: CachedTogglClient | TogglClient, workspaceId: number, context?: LoggingContext): Promise<{
    hasAccess: boolean
    workspace?: Workspace
  }> {
    const result = await this.validateWorkspace(client, workspaceId, context)
    return {
      hasAccess: result.success,
      workspace: result.workspace
    }
  }
};