import type { TogglClient } from './toggl-client.js';
import type { Project, Task } from './validation.js';
import { ProjectService } from './project-service.js';
export interface LoggingContext {
    debug?: (message: string, data?: Record<string, unknown>) => void;
    warn?: (message: string) => void;
}
export interface TaskSelectionResult {
    error?: string;
    project?: Project;
    success: boolean;
    task?: Task;
}
export interface TaskServiceOptions {
    client: TogglClient;
    context?: LoggingContext;
    projectService?: ProjectService;
}
export declare class TaskService {
    private readonly client;
    private readonly context?;
    private readonly projectService;
    constructor(client: TogglClient, context?: LoggingContext | undefined, projectService?: ProjectService);
    /**
     * Filters tasks by active status.
     */
    static filterActiveTasks(tasks: Task[]): Task[];
    /**
     * Filters tasks by project ID.
     */
    static filterTasksByProject(tasks: Task[], projectId: number): Task[];
    /**
     * Finds a task by its ID.
     */
    static findTaskById(tasks: Task[], taskId: number): null | Task;
    /**
     * Finds a task by name (case-insensitive partial match) or exact ID.
     * Optionally filters by project ID to ensure task belongs to the specified project.
     * Supports exact matches taking precedence over partial matches.
     */
    static findTaskByNameOrId(tasks: Task[], input: string, projectId?: number): null | Task;
    /**
     * Gets tasks that have no project assignment (orphaned tasks).
     */
    static getOrphanedTasks(tasks: Task[]): Task[];
    /**
     * Static method to fetch all tasks for the authenticated user.
     * Returns empty array on error.
     */
    static getTasks(client: TogglClient, context?: LoggingContext): Promise<Task[]>;
    /**
     * Sorts tasks alphabetically by name.
     */
    static sortTasksByName(tasks: Task[]): Task[];
    /**
     * Validates project-task relationship compatibility.
     */
    static validateProjectTaskRelationship(project?: Project, task?: Task): {
        error?: string;
        isValid: boolean;
    };
    /**
     * Instance method to find task by name or ID.
     */
    findTaskByNameOrId(input: string, projectId?: number): Promise<null | Task>;
    /**
     * Instance method to fetch tasks with automatic error handling.
     */
    getTasks(): Promise<Task[]>;
    /**
     * Gets tasks and projects together for efficient selection operations.
     */
    getTasksAndProjects(): Promise<{
        error?: string;
        projects: Project[];
        tasks: Task[];
    }>;
    /**
     * Gets tasks for a specific project with validation.
     */
    getTasksForProject(projectId: number): Promise<{
        error?: string;
        project?: Project;
        tasks: Task[];
    }>;
    /**
     * Gets task statistics for reporting.
     */
    getTaskStats(): Promise<{
        active: number;
        byProject: Record<number, number>;
        inactive: number;
        orphaned: number;
        total: number;
    }>;
    /**
     * Selects a task based on name or ID input.
     * Includes comprehensive validation and project relationship handling.
     */
    selectTask(input: string, projectId?: number): Promise<TaskSelectionResult>;
    /**
     * Validates task access and project membership.
     */
    validateTask(taskId: number, projectId?: number): Promise<TaskSelectionResult>;
}
