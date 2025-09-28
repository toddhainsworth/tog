import type { TogglConfig } from './config.js';
import type { TogglClient } from './toggl-client.js';
import type { Project, Task, TimeEntry } from './validation.js';
export interface LoggingContext {
    log: (message: string) => void;
    warn?: (message: string) => void;
}
export interface TimerCreationOptions {
    client: TogglClient;
    config: TogglConfig;
    description: string;
    selectedProject?: Project;
    selectedTask?: Task;
}
export interface TimerCreationResult {
    error?: Error;
    success: boolean;
    timeEntry?: TimeEntry;
}
export declare const TimerService: {
    /**
     * Checks if there is currently a running timer.
     * Returns true if a timer is running (which should block starting a new timer).
     */
    checkForRunningTimer(client: TogglClient): Promise<{
        currentEntry?: null | TimeEntry;
        hasRunningTimer: boolean;
    }>;
    /**
     * Creates and starts a new timer with the given parameters.
     * Returns the created time entry or throws an error if creation fails.
     */
    createTimer(options: TimerCreationOptions, context: LoggingContext): Promise<TimerCreationResult>;
    /**
     * Fetches both tasks and projects from the Toggl API.
     * Returns null values if the fetch fails.
     */
    fetchTasksAndProjects(client: TogglClient, context: LoggingContext): Promise<{
        projects: null | Project[];
        tasks: null | Task[];
    }>;
    /**
     * Validates timer description input.
     */
    validateDescription(description: string): {
        error?: string;
        isValid: boolean;
    };
    /**
     * Validates that the project and task are compatible.
     */
    validateProjectTaskRelationship(project?: Project, task?: Task): {
        error?: string;
        isValid: boolean;
    };
    /**
     * Performs comprehensive validation of all timer creation parameters.
     */
    validateTimerCreation(options: TimerCreationOptions): {
        error?: string;
        isValid: boolean;
    };
    /**
     * Validates workspace configuration.
     */
    validateWorkspaceConfig(config: TogglConfig): {
        error?: string;
        isValid: boolean;
    };
};
