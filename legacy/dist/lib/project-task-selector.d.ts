import type { Project, Task } from './validation.js';
export interface ProjectTaskSelectionResult {
    selectedProject?: Project;
    selectedTask?: Task;
}
export declare class ProjectTaskSelector {
    private readonly projects;
    private readonly tasks;
    constructor(projects: Project[], tasks: Task[]);
    /**
     * Finds a project by its ID.
     */
    findProjectById(projectId: number): Project | undefined;
    /**
     * Finds a project by name (case-insensitive partial match) or exact ID.
     * Supports exact matches taking precedence over partial matches.
     * Throws error if multiple partial matches are found without an exact match.
     */
    findProjectByNameOrId(input: string): null | Project;
    /**
     * Finds a task by name (case-insensitive partial match) or exact ID.
     * Optionally filters by project ID to ensure task belongs to the specified project.
     * Supports exact matches taking precedence over partial matches.
     */
    findTaskByNameOrId(input: string, projectId?: number): null | Task;
    /**
     * Handles interactive selection of project and task using prompts.
     * Returns null if user cancels or if an error occurs.
     */
    selectInteractively(): Promise<null | {
        project?: Project;
        task?: Task;
    }>;
    /**
     * Main method to handle project and task selection based on flags or interactive prompts.
     * Handles the complete flow of project/task selection logic.
     */
    selectProjectAndTask(flags: {
        project?: string;
        task?: string;
    }): Promise<ProjectTaskSelectionResult>;
    /**
     * Selects a project based on a flag input (name or ID).
     * Returns null if project is not found or if an error occurs.
     */
    selectProjectByFlag(projectFlag: string): Promise<null | Project>;
    /**
     * Selects a task based on a flag input (name or ID).
     * Optionally constrains the search to a specific project.
     * Returns both the task and its associated project.
     */
    selectTaskByFlag(taskFlag: string, selectedProject?: Project): Promise<null | {
        project?: Project;
        task: Task;
    }>;
}
