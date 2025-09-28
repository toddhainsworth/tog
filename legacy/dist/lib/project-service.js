import { WorkspaceService } from './workspace-service.js';
export class ProjectService {
    client;
    context;
    constructor(client, context) {
        this.client = client;
        this.context = context;
    }
    /**
     * Creates a lookup map from project ID to project name.
     */
    static createProjectLookupMap(projects) {
        const projectMap = new Map();
        for (const project of projects) {
            projectMap.set(project.id, project.name);
        }
        return projectMap;
    }
    /**
     * Fetches and finds a project by its ID.
     */
    static async fetchProjectById(client, projectId, context) {
        const projects = await ProjectService.getProjects(client, context);
        return ProjectService.findProjectById(projects, projectId);
    }
    /**
     * Filters projects by active status.
     */
    static filterActiveProjects(projects) {
        return projects.filter(p => p.active);
    }
    /**
     * Filters projects by client name.
     */
    static filterProjectsByClient(projects, clientName) {
        return projects.filter(p => p.client_name === clientName);
    }
    /**
     * Filters projects by workspace ID.
     */
    static filterProjectsByWorkspace(projects, workspaceId) {
        return projects.filter(p => p.workspace_id === workspaceId);
    }
    /**
     * Finds a project by its ID from a provided array.
     */
    static findProjectById(projects, projectId) {
        return projects.find(p => p.id === projectId) || null;
    }
    /**
     * Finds a project by name (case-insensitive partial match) or exact ID.
     * Supports exact matches taking precedence over partial matches.
     * Throws error if multiple partial matches are found without an exact match.
     */
    static findProjectByNameOrId(projects, input) {
        // Try to parse as ID first
        const id = Number.parseInt(input, 10);
        if (!Number.isNaN(id)) {
            return projects.find(p => p.id === id) || null;
        }
        // Case-insensitive name matching
        const lowercaseInput = input.toLowerCase();
        const matches = projects.filter(p => p.name.toLowerCase().includes(lowercaseInput));
        if (matches.length === 0) {
            return null;
        }
        if (matches.length === 1) {
            return matches[0] ?? null;
        }
        // Multiple matches - look for exact match first
        const exactMatch = matches.find(p => p.name.toLowerCase() === lowercaseInput);
        if (exactMatch) {
            return exactMatch;
        }
        // Multiple partial matches - this is ambiguous
        const names = matches.map(p => p.name).join(', ');
        throw new Error(`Multiple projects match "${input}": ${names}. Please be more specific.`);
    }
    /**
     * Static method to fetch all projects for the authenticated user.
     * Returns empty array on error.
     */
    static async getProjects(client, context) {
        try {
            context?.debug?.('Fetching user projects');
            const projects = await client.getProjects();
            context?.debug?.('Projects fetched successfully', { count: projects.length });
            return projects;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            context?.debug?.('Failed to fetch projects', { error: errorMessage });
            context?.warn?.('Failed to fetch projects');
            return [];
        }
    }
    /**
     * Sorts projects alphabetically by name.
     */
    static sortProjectsByName(projects) {
        return [...projects].sort((a, b) => a.name.localeCompare(b.name));
    }
    /**
     * Instance method to find project by name or ID.
     */
    async findProjectByNameOrId(input) {
        const projects = await this.getProjects();
        return ProjectService.findProjectByNameOrId(projects, input);
    }
    /**
     * Instance method to fetch projects with automatic error handling.
     */
    async getProjects() {
        return ProjectService.getProjects(this.client, this.context);
    }
    /**
     * Gets projects with workspace validation.
     * Ensures user has access to the workspace before fetching projects.
     */
    async getProjectsForWorkspace(workspaceId) {
        const workspaceResult = await WorkspaceService.validateWorkspace(this.client, workspaceId, this.context);
        if (!workspaceResult.success) {
            return {
                error: workspaceResult.error,
                projects: []
            };
        }
        const allProjects = await this.getProjects();
        const workspaceProjects = ProjectService.filterProjectsByWorkspace(allProjects, workspaceId);
        return { projects: workspaceProjects };
    }
    /**
     * Gets project statistics for reporting.
     */
    async getProjectStats() {
        const projects = await this.getProjects();
        const active = ProjectService.filterActiveProjects(projects).length;
        const inactive = projects.length - active;
        const byClient = {};
        const byWorkspace = {};
        for (const project of projects) {
            // Client statistics
            const clientName = project.client_name || 'No Client';
            byClient[clientName] = (byClient[clientName] || 0) + 1;
            // Workspace statistics
            byWorkspace[project.workspace_id] = (byWorkspace[project.workspace_id] || 0) + 1;
        }
        return {
            active,
            byClient,
            byWorkspace,
            inactive,
            total: projects.length
        };
    }
    /**
     * Selects a project based on name or ID input.
     * Includes comprehensive validation and error handling.
     */
    async selectProject(input, workspaceId) {
        try {
            this.context?.debug?.('Selecting project', { input, workspaceId });
            const projects = await this.getProjects();
            // Filter by workspace if specified
            const relevantProjects = workspaceId
                ? ProjectService.filterProjectsByWorkspace(projects, workspaceId)
                : projects;
            const project = ProjectService.findProjectByNameOrId(relevantProjects, input);
            if (!project) {
                const workspaceContext = workspaceId ? ` in workspace ${workspaceId}` : '';
                return {
                    error: `Project "${input}"${workspaceContext} not found`,
                    success: false
                };
            }
            // Validate workspace membership if specified
            if (workspaceId && project.workspace_id !== workspaceId) {
                return {
                    error: `Project "${project.name}" does not belong to workspace ${workspaceId}`,
                    success: false
                };
            }
            this.context?.debug?.('Project selection successful', {
                projectId: project.id,
                projectName: project.name,
                workspaceId: project.workspace_id
            });
            return {
                project,
                success: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.context?.debug?.('Project selection failed', { error: errorMessage, input });
            return {
                error: errorMessage,
                success: false
            };
        }
    }
    /**
     * Validates project access and workspace membership.
     */
    async validateProject(projectId, workspaceId) {
        if (!projectId || projectId <= 0) {
            return {
                error: 'Invalid project ID provided',
                success: false
            };
        }
        try {
            const projects = await this.getProjects();
            const project = ProjectService.findProjectById(projects, projectId);
            if (!project) {
                return {
                    error: `Project with ID ${projectId} not found or not accessible`,
                    success: false
                };
            }
            // Validate workspace membership if specified
            if (workspaceId && project.workspace_id !== workspaceId) {
                return {
                    error: `Project "${project.name}" does not belong to the specified workspace`,
                    success: false
                };
            }
            this.context?.debug?.('Project validation successful', {
                projectId,
                projectName: project.name,
                workspaceId: project.workspace_id
            });
            return {
                project,
                success: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.context?.debug?.('Project validation failed', { error: errorMessage, projectId });
            return {
                error: `Failed to validate project: ${errorMessage}`,
                success: false
            };
        }
    }
}
;
