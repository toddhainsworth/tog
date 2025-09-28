import type { TogglClient } from './toggl-client.js';
import type { Favorite } from './validation.js';
export interface LoggingContext {
    debug?: (message: string, data?: Record<string, unknown>) => void;
    warn?: (message: string) => void;
}
export interface FavoriteSelectionResult {
    error?: string;
    favorite?: Favorite;
    success: boolean;
}
export declare const FavoriteService: {
    /**
     * Filters favorites by project ID.
     */
    filterFavoritesByProject(favorites: Favorite[], projectId: number): Favorite[];
    /**
     * Filters favorites by workspace ID.
     * Note: Favorite schema doesn't include workspace_id, so this method filters by project ownership.
     */
    filterFavoritesByWorkspace(favorites: Favorite[], _workspaceId: number): Favorite[];
    /**
     * Finds a favorite by description (case-insensitive partial match) or exact ID.
     * Supports exact matches taking precedence over partial matches.
     * Throws error if multiple partial matches are found without an exact match.
     */
    findFavoriteByDescriptionOrId(favorites: Favorite[], input: string): Favorite | null;
    /**
     * Finds a favorite by its favorite_id.
     */
    findFavoriteById(favorites: Favorite[], favoriteId: number): Favorite | null;
    /**
     * Fetches all favorites for the authenticated user.
     * Returns empty array on error.
     */
    getFavorites(client: TogglClient, context?: LoggingContext): Promise<Favorite[]>;
    /**
     * Gets favorites for a specific project.
     */
    getFavoritesForProject(client: TogglClient, projectId: number, context?: LoggingContext): Promise<{
        error?: string;
        favorites: Favorite[];
    }>;
    /**
     * Gets favorites for a specific workspace.
     */
    getFavoritesForWorkspace(client: TogglClient, workspaceId: number, context?: LoggingContext): Promise<{
        error?: string;
        favorites: Favorite[];
    }>;
    /**
     * Gets favorite statistics for reporting.
     */
    getFavoriteStats(client: TogglClient, context?: LoggingContext): Promise<{
        byProject: Record<number, number>;
        byWorkspace: Record<number, number>;
        error?: string;
        total: number;
        withoutProject: number;
        withProject: number;
    }>;
    /**
     * Gets favorites that have no project assignment.
     */
    getFavoritesWithoutProject(favorites: Favorite[]): Favorite[];
    /**
     * Gets the most recently used favorites (sorted by ID descending).
     */
    getRecentFavorites(client: TogglClient, limit?: number, context?: LoggingContext): Promise<{
        error?: string;
        favorites: Favorite[];
    }>;
    /**
     * Selects a favorite based on description or ID input.
     * Includes comprehensive validation and error handling.
     */
    selectFavorite(client: TogglClient, input: string, context?: LoggingContext): Promise<FavoriteSelectionResult>;
    /**
     * Validates that a favorite exists and is accessible.
     */
    validateFavorite(client: TogglClient, favoriteId: number, context?: LoggingContext): Promise<FavoriteSelectionResult>;
};
