import type { TogglClient } from './toggl-client.js';
import type { Project, Task, TimeEntry } from './validation.js';
import { ProjectService } from './project-service.js';
import { TaskService } from './task-service.js';
export interface LoggingContext {
    debug?: (message: string, data?: Record<string, unknown>) => void;
    warn?: (message: string) => void;
}
export interface TimeEntryCreationOptions {
    billable?: boolean;
    description: string;
    duration?: number;
    project?: Project;
    start?: string;
    stop?: string;
    task?: Task;
    workspaceId: number;
}
export interface TimeEntryCreationResult {
    error?: Error;
    success: boolean;
    timeEntry?: TimeEntry;
}
export interface TimeEntrySearchOptions {
    description?: string;
    endDate?: string;
    pageSize?: number;
    startDate?: string;
    workspaceId: number;
}
export interface TimeEntryUpdateOptions {
    billable?: boolean;
    description?: string;
    duration?: number;
    projectId?: null | number;
    start?: string;
    stop?: string;
    taskId?: null | number;
}
export declare class TimeEntryService {
    private readonly client;
    private readonly context?;
    private readonly projectService;
    private readonly taskService;
    constructor(client: TogglClient, context?: LoggingContext | undefined, projectService?: ProjectService, taskService?: TaskService);
    /**
     * Checks if there is currently a running timer.
     */
    checkForRunningTimer(): Promise<{
        currentEntry?: null | TimeEntry;
        error?: string;
        hasRunningTimer: boolean;
    }>;
    /**
     * Creates a new time entry with comprehensive validation.
     */
    createTimeEntry(options: TimeEntryCreationOptions): Promise<TimeEntryCreationResult>;
    /**
     * Gets the currently running time entry.
     */
    getCurrentTimeEntry(): Promise<{
        error?: string;
        timeEntry?: null | TimeEntry;
    }>;
    /**
     * Gets the most recent time entry.
     */
    getMostRecentTimeEntry(): Promise<{
        error?: string;
        timeEntry?: null | TimeEntry;
    }>;
    /**
     * Gets time entries for a date range.
     */
    getTimeEntries(startDate: string, endDate: string): Promise<{
        error?: string;
        timeEntries: TimeEntry[];
    }>;
    /**
     * Gets time entry statistics for reporting.
     */
    getTimeEntryStats(startDate: string, endDate: string): Promise<{
        byProject: Record<number, number>;
        error?: string;
        runningEntries: number;
        totalDuration: number;
        totalEntries: number;
    }>;
    /**
     * Searches time entries using the Reports API.
     */
    searchTimeEntries(options: TimeEntrySearchOptions): Promise<{
        error?: string;
        timeEntries: TimeEntry[];
    }>;
    /**
     * Stops a running time entry.
     */
    stopTimeEntry(workspaceId: number, timeEntryId: number): Promise<{
        error?: string;
        success: boolean;
    }>;
    /**
     * Updates an existing time entry.
     */
    updateTimeEntry(workspaceId: number, timeEntryId: number, updates: TimeEntryUpdateOptions): Promise<{
        error?: string;
        timeEntry?: TimeEntry;
    }>;
    /**
     * Validates timer description input.
     */
    validateDescription(description: string): {
        error?: string;
        isValid: boolean;
    };
}
