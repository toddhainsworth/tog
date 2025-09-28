import type { TogglClient } from './toggl-client.js';
import type { Project } from './validation.js';
export interface LoggingContext {
    debug?: (message: string, data?: Record<string, unknown>) => void;
    warn?: (message: string) => void;
}
export interface ProjectSelectionResult {
    error?: string;
    project?: Project;
    success: boolean;
}
export interface ProjectServiceOptions {
    client: TogglClient;
    context?: LoggingContext;
    workspaceId?: number;
}
export declare class ProjectService {
    private readonly client;
    private readonly context?;
    constructor(client: TogglClient, context?: LoggingContext | undefined);
    /**
     * Creates a lookup map from project ID to project name.
     */
    static createProjectLookupMap(projects: Project[]): Map<number, string>;
    /**
     * Fetches and finds a project by its ID.
     */
    static fetchProjectById(client: TogglClient, projectId: number, context?: LoggingContext): Promise<null | Project>;
    /**
     * Filters projects by active status.
     */
    static filterActiveProjects(projects: Project[]): Project[];
    /**
     * Filters projects by client name.
     */
    static filterProjectsByClient(projects: Project[], clientName: string): Project[];
    /**
     * Filters projects by workspace ID.
     */
    static filterProjectsByWorkspace(projects: Project[], workspaceId: number): Project[];
    /**
     * Finds a project by its ID from a provided array.
     */
    static findProjectById(projects: Project[], projectId: number): null | Project;
    /**
     * Finds a project by name (case-insensitive partial match) or exact ID.
     * Supports exact matches taking precedence over partial matches.
     * Throws error if multiple partial matches are found without an exact match.
     */
    static findProjectByNameOrId(projects: Project[], input: string): null | Project;
    /**
     * Static method to fetch all projects for the authenticated user.
     * Returns empty array on error.
     */
    static getProjects(client: TogglClient, context?: LoggingContext): Promise<Project[]>;
    /**
     * Sorts projects alphabetically by name.
     */
    static sortProjectsByName(projects: Project[]): Project[];
    /**
     * Instance method to find project by name or ID.
     */
    findProjectByNameOrId(input: string): Promise<null | Project>;
    /**
     * Instance method to fetch projects with automatic error handling.
     */
    getProjects(): Promise<Project[]>;
    /**
     * Gets projects with workspace validation.
     * Ensures user has access to the workspace before fetching projects.
     */
    getProjectsForWorkspace(workspaceId: number): Promise<{
        error?: string;
        projects: Project[];
    }>;
    /**
     * Gets project statistics for reporting.
     */
    getProjectStats(): Promise<{
        active: number;
        byClient: Record<string, number>;
        byWorkspace: Record<number, number>;
        inactive: number;
        total: number;
    }>;
    /**
     * Selects a project based on name or ID input.
     * Includes comprehensive validation and error handling.
     */
    selectProject(input: string, workspaceId?: number): Promise<ProjectSelectionResult>;
    /**
     * Validates project access and workspace membership.
     */
    validateProject(projectId: number, workspaceId?: number): Promise<ProjectSelectionResult>;
}
