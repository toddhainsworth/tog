import { ProjectService } from './project-service.js';
import { TaskService } from './task-service.js';
import { WorkspaceService } from './workspace-service.js';
export class TimeEntryService {
    client;
    context;
    projectService;
    taskService;
    constructor(client, context, projectService, taskService) {
        this.client = client;
        this.context = context;
        this.projectService = projectService || new ProjectService(client, context);
        this.taskService = taskService || new TaskService(client, context, this.projectService);
    }
    /**
     * Checks if there is currently a running timer.
     */
    async checkForRunningTimer() {
        const result = await this.getCurrentTimeEntry();
        if (result.error) {
            return {
                error: result.error,
                hasRunningTimer: false
            };
        }
        return {
            currentEntry: result.timeEntry,
            hasRunningTimer: Boolean(result.timeEntry && !result.timeEntry.stop)
        };
    }
    /**
     * Creates a new time entry with comprehensive validation.
     */
    async createTimeEntry(options) {
        const { billable, description, duration, project, start, stop, task, workspaceId } = options;
        try {
            this.context?.debug?.('Creating time entry', {
                hasDescription: Boolean(description),
                hasProject: Boolean(project),
                hasTask: Boolean(task),
                workspaceId
            });
            // Validate workspace access
            const workspaceResult = await WorkspaceService.validateWorkspace(this.client, workspaceId, this.context);
            if (!workspaceResult.success) {
                return {
                    error: new Error(workspaceResult.error || 'Invalid workspace'),
                    success: false
                };
            }
            // Validate description
            const descriptionValidation = this.validateDescription(description);
            if (!descriptionValidation.isValid) {
                return {
                    error: new Error(descriptionValidation.error || 'Invalid description'),
                    success: false
                };
            }
            // Validate project-task relationship
            const relationshipValidation = TaskService.validateProjectTaskRelationship(project, task);
            if (!relationshipValidation.isValid) {
                return {
                    error: new Error(relationshipValidation.error || 'Invalid project-task relationship'),
                    success: false
                };
            }
            // Prepare time entry data
            const timeEntryData = {
                billable,
                created_with: 'tog-cli',
                description: description.trim(),
                duration: duration ?? -1, // -1 indicates a running timer
                start: start || new Date().toISOString(),
                stop,
                workspace_id: workspaceId,
                ...(task && { task_id: task.id }),
                ...(project && { project_id: project.id })
            };
            const timeEntry = await this.client.createTimeEntry(workspaceId, timeEntryData);
            this.context?.debug?.('Time entry created successfully', {
                entryId: timeEntry.id,
                projectId: timeEntry.project_id,
                taskId: timeEntry.task_id
            });
            return {
                success: true,
                timeEntry
            };
        }
        catch (error) {
            const originalMessage = error instanceof Error ? error.message : String(error);
            const convertedError = new Error(`Failed to create time entry: ${originalMessage}`);
            this.context?.debug?.('Time entry creation failed', {
                error: convertedError.message,
                workspaceId
            });
            return {
                error: convertedError,
                success: false
            };
        }
    }
    /**
     * Gets the currently running time entry.
     */
    async getCurrentTimeEntry() {
        try {
            this.context?.debug?.('Fetching current time entry');
            const timeEntry = await this.client.getCurrentTimeEntry();
            this.context?.debug?.('Current time entry fetched', {
                hasEntry: Boolean(timeEntry),
                isRunning: timeEntry ? !timeEntry.stop : false
            });
            return { timeEntry };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.context?.debug?.('Failed to fetch current time entry', { error: errorMessage });
            return {
                error: `Failed to get current time entry: ${errorMessage}`,
                timeEntry: null
            };
        }
    }
    /**
     * Gets the most recent time entry.
     */
    async getMostRecentTimeEntry() {
        try {
            this.context?.debug?.('Fetching most recent time entry');
            const timeEntry = await this.client.getMostRecentTimeEntry();
            this.context?.debug?.('Most recent time entry fetched', {
                hasEntry: Boolean(timeEntry)
            });
            return { timeEntry };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.context?.debug?.('Failed to fetch most recent time entry', { error: errorMessage });
            return {
                error: `Failed to get most recent time entry: ${errorMessage}`,
                timeEntry: null
            };
        }
    }
    /**
     * Gets time entries for a date range.
     */
    async getTimeEntries(startDate, endDate) {
        try {
            this.context?.debug?.('Fetching time entries', { endDate, startDate });
            const timeEntries = await this.client.getTimeEntries(startDate, endDate);
            this.context?.debug?.('Time entries fetched successfully', {
                count: timeEntries.length,
                endDate,
                startDate
            });
            return { timeEntries };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.context?.debug?.('Failed to fetch time entries', {
                endDate,
                error: errorMessage,
                startDate
            });
            return {
                error: `Failed to get time entries: ${errorMessage}`,
                timeEntries: []
            };
        }
    }
    /**
     * Gets time entry statistics for reporting.
     */
    async getTimeEntryStats(startDate, endDate) {
        const result = await this.getTimeEntries(startDate, endDate);
        if (result.error) {
            return {
                byProject: {},
                error: `Failed to get time entry statistics: ${result.error}`,
                runningEntries: 0,
                totalDuration: 0,
                totalEntries: 0
            };
        }
        const { timeEntries } = result;
        const totalEntries = timeEntries.length;
        const totalDuration = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
        const runningEntries = timeEntries.filter(entry => !entry.stop).length;
        const byProject = {};
        for (const entry of timeEntries) {
            const projectId = entry.project_id;
            if (projectId) {
                if (!byProject[projectId]) {
                    byProject[projectId] = 0;
                }
                byProject[projectId] += entry.duration || 0;
            }
        }
        return {
            byProject,
            runningEntries,
            totalDuration,
            totalEntries
        };
    }
    /**
     * Searches time entries using the Reports API.
     */
    async searchTimeEntries(options) {
        const { description, endDate, pageSize, startDate, workspaceId } = options;
        try {
            this.context?.debug?.('Searching time entries', {
                endDate,
                hasDescription: Boolean(description),
                pageSize,
                startDate,
                workspaceId
            });
            // Validate workspace access
            const workspaceResult = await WorkspaceService.validateWorkspace(this.client, workspaceId, this.context);
            if (!workspaceResult.success) {
                return {
                    error: workspaceResult.error || 'Invalid workspace',
                    timeEntries: []
                };
            }
            const searchParams = {
                description,
                end_date: endDate,
                page_size: pageSize,
                start_date: startDate
            };
            const timeEntries = await this.client.searchTimeEntries(workspaceId, searchParams);
            this.context?.debug?.('Time entry search completed', {
                count: timeEntries.length,
                workspaceId
            });
            return { timeEntries };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.context?.debug?.('Time entry search failed', {
                error: errorMessage,
                workspaceId
            });
            return {
                error: `Failed to search time entries: ${errorMessage}`,
                timeEntries: []
            };
        }
    }
    /**
     * Stops a running time entry.
     */
    async stopTimeEntry(workspaceId, timeEntryId) {
        try {
            this.context?.debug?.('Stopping time entry', { timeEntryId, workspaceId });
            // Validate workspace access
            const workspaceResult = await WorkspaceService.validateWorkspace(this.client, workspaceId, this.context);
            if (!workspaceResult.success) {
                return {
                    error: workspaceResult.error || 'Invalid workspace',
                    success: false
                };
            }
            const stopped = await this.client.stopTimeEntry(workspaceId, timeEntryId);
            if (stopped) {
                this.context?.debug?.('Time entry stopped successfully', { timeEntryId });
                return { success: true };
            }
            this.context?.debug?.('Failed to stop time entry', { timeEntryId });
            return {
                error: 'Failed to stop time entry',
                success: false
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.context?.debug?.('Time entry stop failed', {
                error: errorMessage,
                timeEntryId,
                workspaceId
            });
            return {
                error: `Failed to stop time entry: ${errorMessage}`,
                success: false
            };
        }
    }
    /**
     * Updates an existing time entry.
     */
    async updateTimeEntry(workspaceId, timeEntryId, updates) {
        try {
            this.context?.debug?.('Updating time entry', {
                timeEntryId,
                updates: Object.keys(updates),
                workspaceId
            });
            // Validate workspace access
            const workspaceResult = await WorkspaceService.validateWorkspace(this.client, workspaceId, this.context);
            if (!workspaceResult.success) {
                return {
                    error: workspaceResult.error || 'Invalid workspace'
                };
            }
            // Validate description if provided
            if (updates.description !== undefined) {
                const descriptionValidation = this.validateDescription(updates.description);
                if (!descriptionValidation.isValid) {
                    return {
                        error: descriptionValidation.error || 'Invalid description'
                    };
                }
            }
            // Prepare update payload
            const updatePayload = {
                ...(updates.billable !== undefined && { billable: updates.billable }),
                ...(updates.description !== undefined && { description: updates.description.trim() }),
                ...(updates.duration !== undefined && { duration: updates.duration }),
                ...(updates.projectId !== undefined && { project_id: updates.projectId }),
                ...(updates.start !== undefined && { start: updates.start }),
                ...(updates.stop !== undefined && { stop: updates.stop }),
                ...(updates.taskId !== undefined && { task_id: updates.taskId })
            };
            const timeEntry = await this.client.updateTimeEntry(workspaceId, timeEntryId, updatePayload);
            this.context?.debug?.('Time entry updated successfully', {
                entryId: timeEntry.id,
                projectId: timeEntry.project_id,
                taskId: timeEntry.task_id
            });
            return { timeEntry };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.context?.debug?.('Time entry update failed', {
                error: errorMessage,
                timeEntryId,
                workspaceId
            });
            return {
                error: `Failed to update time entry: ${errorMessage}`
            };
        }
    }
    /**
     * Validates timer description input.
     */
    validateDescription(description) {
        if (!description || description.trim().length === 0) {
            return {
                error: 'Description cannot be empty',
                isValid: false
            };
        }
        if (description.trim().length > 500) {
            return {
                error: 'Description is too long',
                isValid: false
            };
        }
        return { isValid: true };
    }
}
;
