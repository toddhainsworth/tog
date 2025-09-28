import type { TogglClient } from './toggl-client.js';
import type { Workspace } from './validation.js';
export interface LoggingContext {
    debug?: (message: string, data?: Record<string, unknown>) => void;
    warn?: (message: string) => void;
}
export interface WorkspaceSelectionResult {
    error?: string;
    success: boolean;
    workspace?: Workspace;
}
export declare const WorkspaceService: {
    /**
     * Finds a workspace by ID.
     * Returns null if not found.
     */
    findWorkspaceById(workspaces: Workspace[], workspaceId: number): null | Workspace;
    /**
     * Finds a workspace by name (case-insensitive partial match) or exact ID.
     * Supports exact matches taking precedence over partial matches.
     * Throws error if multiple partial matches are found without an exact match.
     */
    findWorkspaceByNameOrId(workspaces: Workspace[], input: string): null | Workspace;
    /**
     * Gets the default workspace (first available workspace).
     * Useful for single-workspace scenarios.
     */
    getDefaultWorkspace(client: TogglClient, context?: LoggingContext): Promise<null | Workspace>;
    /**
     * Fetches all workspaces for the authenticated user.
     * Returns empty array on error.
     */
    getWorkspaces(client: TogglClient, context?: LoggingContext): Promise<Workspace[]>;
    /**
     * Validates that a workspace ID exists and is accessible.
     * Returns validation result with success flag and optional error.
     */
    validateWorkspace(client: TogglClient, workspaceId: number, context?: LoggingContext): Promise<WorkspaceSelectionResult>;
    /**
     * Validates workspace access and returns workspace details.
     * This is useful for configuration validation.
     */
    validateWorkspaceAccess(client: TogglClient, workspaceId: number, context?: LoggingContext): Promise<{
        hasAccess: boolean;
        workspace?: Workspace;
    }>;
};
