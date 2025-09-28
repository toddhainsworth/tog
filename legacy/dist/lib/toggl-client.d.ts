import { type Client, type Favorite, type Project, type Task, type TimeEntry, type Workspace } from './validation.js';
export interface TimeEntryPayload {
    billable?: boolean;
    created_with: string;
    description?: string;
    duration?: number;
    project_id?: null | number;
    start: string;
    stop?: string;
    task_id?: null | number;
    workspace_id?: number;
}
export interface SearchTimeEntriesPayload {
    description?: string;
    end_date?: string;
    page_size?: number;
    start_date?: string;
}
export interface GetTimeEntriesOptions {
    end_date: string;
    start_date: string;
}
export interface DebugLogger {
    debug(message: string, data?: Record<string, unknown>): void;
}
export declare class TogglClient {
    private client;
    private logger?;
    private reportsClient;
    constructor(apiToken: string, logger?: DebugLogger);
    /**
     * Creates a new time entry in the specified workspace.
     */
    createTimeEntry(workspaceId: number, timeEntry: TimeEntryPayload): Promise<TimeEntry>;
    /**
     * Fetches all clients for the authenticated user.
     */
    getClients(): Promise<Client[]>;
    /**
     * Fetches the current running time entry, if any.
     */
    getCurrentTimeEntry(): Promise<null | TimeEntry>;
    /**
     * Fetches all favorites for the authenticated user.
     */
    getFavorites(): Promise<Favorite[]>;
    /**
     * Fetches the most recent time entry.
     */
    getMostRecentTimeEntry(): Promise<null | TimeEntry>;
    /**
     * Fetches all projects for the authenticated user.
     */
    getProjects(): Promise<Project[]>;
    /**
     * Fetches all tasks for the authenticated user.
     */
    getTasks(): Promise<Task[]>;
    /**
     * Fetches time entries for a given date range.
     */
    getTimeEntries(options: GetTimeEntriesOptions): Promise<TimeEntry[]>;
    getTimeEntries(startDate: string, endDate: string): Promise<TimeEntry[]>;
    /**
     * Fetches all workspaces for the authenticated user.
     */
    getWorkspaces(): Promise<Workspace[]>;
    /**
     * Tests API connectivity and token validity.
     * Returns false instead of throwing errors for connectivity testing.
     */
    ping(): Promise<boolean>;
    /**
     * Searches time entries using the Reports API.
     * Returns converted TimeEntry array for backward compatibility.
     */
    searchTimeEntries(workspaceId: number, searchParams: SearchTimeEntriesPayload): Promise<TimeEntry[]>;
    /**
     * Stops a running time entry.
     * Returns true on success, false on failure.
     */
    stopTimeEntry(workspaceId: number, timeEntryId: number): Promise<boolean>;
    /**
     * Updates an existing time entry.
     */
    updateTimeEntry(workspaceId: number, timeEntryId: number, updates: Partial<TimeEntryPayload>): Promise<TimeEntry>;
}
