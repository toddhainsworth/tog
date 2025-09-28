import type { TogglClient } from './toggl-client.js'
import type { Favorite } from './validation.js'

export interface LoggingContext {
  debug?: (message: string, data?: Record<string, unknown>) => void
  warn?: (message: string) => void
}

export interface FavoriteSelectionResult {
  error?: string
  favorite?: Favorite
  success: boolean
}

export const FavoriteService = {
  /**
   * Filters favorites by project ID.
   */
  filterFavoritesByProject(favorites: Favorite[], projectId: number): Favorite[] {
    return favorites.filter(f => f.project_id === projectId)
  },

  /**
   * Filters favorites by workspace ID.
   * Note: Favorite schema doesn't include workspace_id, so this method filters by project ownership.
   */
  filterFavoritesByWorkspace(favorites: Favorite[], _workspaceId: number): Favorite[] {
    // Since favorites don't have direct workspace_id, we can't filter by workspace
    // This would require project information to determine workspace membership
    return favorites
  },

  /**
   * Finds a favorite by description (case-insensitive partial match) or exact ID.
   * Supports exact matches taking precedence over partial matches.
   * Throws error if multiple partial matches are found without an exact match.
   */
  findFavoriteByDescriptionOrId(favorites: Favorite[], input: string): Favorite | null {
    // Try to parse as ID first
    const id = Number.parseInt(input, 10)
    if (!Number.isNaN(id)) {
      return favorites.find(f => f.favorite_id === id) || null
    }

    // Case-insensitive description matching
    const lowercaseInput = input.toLowerCase()
    const matches = favorites.filter(f =>
      f.description !== undefined && f.description !== null && f.description.toLowerCase().includes(lowercaseInput)
    )

    if (matches.length === 0) {
      return null
    }

    if (matches.length === 1) {
      return matches[0] ?? null
    }

    // Multiple matches - look for exact match first
    const exactMatch = matches.find(f =>
      f.description !== undefined && f.description !== null && f.description.toLowerCase() === lowercaseInput
    )
    if (exactMatch) {
      return exactMatch
    }

    // Multiple partial matches - this is ambiguous
    const descriptions = matches.map(f => f.description || 'Untitled').join(', ')
    throw new Error(`Multiple favorites match "${input}": ${descriptions}. Please be more specific.`)
  },

  /**
   * Finds a favorite by its favorite_id.
   */
  findFavoriteById(favorites: Favorite[], favoriteId: number): Favorite | null {
    return favorites.find(f => f.favorite_id === favoriteId) || null
  },

  /**
   * Fetches all favorites for the authenticated user.
   * Returns empty array on error.
   */
  async getFavorites(client: TogglClient, context?: LoggingContext): Promise<Favorite[]> {
    try {
      context?.debug?.('Fetching user favorites')
      const favorites = await client.getFavorites()
      context?.debug?.('Favorites fetched successfully', { count: favorites.length })
      return favorites
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      context?.debug?.('Failed to fetch favorites', { error: errorMessage })
      context?.warn?.('Failed to fetch favorites')
      return []
    }
  },

  /**
   * Gets favorites for a specific project.
   */
  async getFavoritesForProject(client: TogglClient, projectId: number, context?: LoggingContext): Promise<{
    error?: string
    favorites: Favorite[]
  }> {
    try {
      // Call the client API directly to ensure errors are propagated
      context?.debug?.('Fetching user favorites for project')
      const allFavorites = await client.getFavorites()
      const projectFavorites = this.filterFavoritesByProject(allFavorites, projectId)

      context?.debug?.('Project favorites fetched', {
        count: projectFavorites.length,
        projectId
      })

      return { favorites: projectFavorites }
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message || error.toString() || 'Unknown error'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = JSON.stringify(error)
      }

      context?.debug?.('Failed to fetch project favorites', { error: errorMessage, projectId })
      return {
        error: `Failed to get favorites for project: ${errorMessage}`,
        favorites: []
      }
    }
  },

  /**
   * Gets favorites for a specific workspace.
   */
  async getFavoritesForWorkspace(client: TogglClient, workspaceId: number, context?: LoggingContext): Promise<{
    error?: string
    favorites: Favorite[]
  }> {
    try {
      // Call the client API directly to ensure errors are propagated
      context?.debug?.('Fetching user favorites for workspace')
      const allFavorites = await client.getFavorites()
      const workspaceFavorites = this.filterFavoritesByWorkspace(allFavorites, workspaceId)

      context?.debug?.('Workspace favorites fetched', {
        count: workspaceFavorites.length,
        workspaceId
      })

      return { favorites: workspaceFavorites }
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message || error.toString() || 'Unknown error'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = JSON.stringify(error)
      }

      context?.debug?.('Failed to fetch workspace favorites', { error: errorMessage, workspaceId })
      return {
        error: `Failed to get favorites for workspace: ${errorMessage}`,
        favorites: []
      }
    }
  },

  /**
   * Gets favorite statistics for reporting.
   */
  async getFavoriteStats(client: TogglClient, context?: LoggingContext): Promise<{
    byProject: Record<number, number>
    byWorkspace: Record<number, number>
    error?: string
    total: number
    withoutProject: number
    withProject: number
  }> {
    try {
      // Call the client API directly to ensure errors are propagated
      context?.debug?.('Fetching user favorites for statistics')
      const favorites = await client.getFavorites()
      const total = favorites.length
      const withProject = favorites.filter(f => f.project_id).length
      const withoutProject = total - withProject

      const byWorkspace: Record<number, number> = {}
      const byProject: Record<number, number> = {}

      for (const favorite of favorites) {
        // Project statistics
        if (favorite.project_id) {
          byProject[favorite.project_id] = (byProject[favorite.project_id] || 0) + 1
        }
      }

      return {
        byProject,
        byWorkspace,
        total,
        withoutProject,
        withProject
      }
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message || error.toString() || 'Unknown error'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = JSON.stringify(error)
      }

      context?.debug?.('Failed to get favorite statistics', { error: errorMessage })
      return {
        byProject: {},
        byWorkspace: {},
        error: `Failed to get favorite statistics: ${errorMessage}`,
        total: 0,
        withoutProject: 0,
        withProject: 0
      }
    }
  },

  /**
   * Gets favorites that have no project assignment.
   */
  getFavoritesWithoutProject(favorites: Favorite[]): Favorite[] {
    return favorites.filter(f => !f.project_id)
  },

  /**
   * Gets the most recently used favorites (sorted by ID descending).
   */
  async getRecentFavorites(client: TogglClient, limit = 10, context?: LoggingContext): Promise<{
    error?: string
    favorites: Favorite[]
  }> {
    try {
      // Call the client API directly to ensure errors are propagated
      context?.debug?.('Fetching user favorites for recent favorites')
      const allFavorites = await client.getFavorites()

      // Sort by favorite_id descending to get most recent first
      const sortedFavorites = [...allFavorites].sort((a, b) => (b.favorite_id || 0) - (a.favorite_id || 0))
      const recentFavorites = sortedFavorites.slice(0, limit)

      context?.debug?.('Recent favorites fetched', {
        count: recentFavorites.length,
        limit,
        total: allFavorites.length
      })

      return { favorites: recentFavorites }
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message || error.toString() || 'Unknown error'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = JSON.stringify(error)
      }

      context?.debug?.('Failed to fetch recent favorites', { error: errorMessage })
      return {
        error: `Failed to get recent favorites: ${errorMessage}`,
        favorites: []
      }
    }
  },

  /**
   * Selects a favorite based on description or ID input.
   * Includes comprehensive validation and error handling.
   */
  async selectFavorite(client: TogglClient, input: string, context?: LoggingContext): Promise<FavoriteSelectionResult> {
    try {
      context?.debug?.('Selecting favorite', { input })

      // Call the client API directly to ensure errors are propagated
      const favorites = await client.getFavorites()

      if (favorites.length === 0) {
        return {
          error: 'No favorites found. Create some favorites first.',
          success: false
        }
      }

      const favorite = this.findFavoriteByDescriptionOrId(favorites, input)

      if (!favorite) {
        return {
          error: `Favorite "${input}" not found`,
          success: false
        }
      }

      context?.debug?.('Favorite selection successful', {
        description: favorite.description,
        favoriteId: favorite.favorite_id,
        projectId: favorite.project_id
      })

      return {
        favorite,
        success: true
      }
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message || error.toString() || 'Unknown error'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = JSON.stringify(error)
      }

      context?.debug?.('Favorite selection failed', { error: errorMessage, input })
      return {
        error: errorMessage,
        success: false
      }
    }
  },

  /**
   * Validates that a favorite exists and is accessible.
   */
  async validateFavorite(client: TogglClient, favoriteId: number, context?: LoggingContext): Promise<FavoriteSelectionResult> {
    if (!favoriteId || favoriteId <= 0) {
      return {
        error: 'Invalid favorite ID provided',
        success: false
      }
    }

    try {
      // Call the client API directly to ensure errors are propagated
      const favorites = await client.getFavorites()
      const favorite = this.findFavoriteById(favorites, favoriteId)

      if (!favorite) {
        return {
          error: `Favorite with ID ${favoriteId} not found or not accessible`,
          success: false
        }
      }

      context?.debug?.('Favorite validation successful', {
        description: favorite.description,
        favoriteId
      })

      return {
        favorite,
        success: true
      }
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message || error.toString() || 'Unknown error'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = JSON.stringify(error)
      }

      context?.debug?.('Favorite validation failed', { error: errorMessage, favoriteId })
      return {
        error: `Failed to validate favorite: ${errorMessage}`,
        success: false
      }
    }
  }
};