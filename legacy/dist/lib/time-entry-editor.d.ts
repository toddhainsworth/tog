import type { Project, Task, TimeEntry } from './validation.js';
import { TimeEntryService } from './time-entry-service.js';
export interface LoggingContext {
    debug?: (message: string, data?: Record<string, unknown>) => void;
    warn?: (message: string) => void;
}
export interface EditFlags {
    clear?: boolean;
    description?: string;
    project?: string;
    task?: string;
}
export interface EditUpdates {
    description?: string;
    project_id?: null | number;
    task_id?: null | number;
}
export interface EditResult {
    error?: string;
    success: boolean;
    timeEntry?: TimeEntry;
    updates?: EditUpdates;
}
export interface TimeEntryEditorOptions {
    currentEntry: TimeEntry;
    flags: EditFlags;
    projects: Project[];
    tasks: Task[];
}
export declare class TimeEntryEditor {
    private readonly timeEntryService;
    private readonly context?;
    constructor(timeEntryService: TimeEntryService, context?: LoggingContext | undefined);
    /**
     * Executes the complete edit workflow.
     */
    executeUpdate(options: TimeEntryEditorOptions): Promise<EditResult>;
    /**
     * Gathers all updates from flags and interactive prompts.
     */
    gatherUpdates(flags: EditFlags, currentEntry: TimeEntry, projects: Project[], tasks: Task[]): Promise<EditUpdates | null>;
    /**
     * Processes description input from flags.
     */
    private processDescriptionInput;
    /**
     * Handles interactive editing flow with optional description and project/task changes.
     */
    private processInteractiveEditing;
    /**
     * Processes project input from flags.
     */
    private processProjectInput;
    /**
     * Processes task input from flags.
     */
    private processTaskInput;
    /**
     * Prompts for a new description.
     */
    private promptForNewDescription;
    /**
     * Validates the current time entry.
     */
    private validateCurrentEntry;
    /**
     * Validates the gathered updates.
     */
    private validateUpdates;
}
