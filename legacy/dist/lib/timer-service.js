import { withSpinner } from './prompts.js';
export const TimerService = {
    /**
     * Checks if there is currently a running timer.
     * Returns true if a timer is running (which should block starting a new timer).
     */
    async checkForRunningTimer(client) {
        try {
            const currentEntry = await client.getCurrentTimeEntry();
            return {
                currentEntry,
                hasRunningTimer: Boolean(currentEntry)
            };
        }
        catch {
            throw new Error('Failed to check current timer');
        }
    },
    /**
     * Creates and starts a new timer with the given parameters.
     * Returns the created time entry or throws an error if creation fails.
     */
    async createTimer(options, context) {
        const { client, config, description, selectedProject, selectedTask } = options;
        try {
            const timeEntryData = {
                created_with: 'tog-cli',
                description,
                duration: -1,
                start: new Date().toISOString(),
                workspace_id: config.workspaceId,
                ...(selectedTask && { task_id: selectedTask.id }),
                ...(selectedProject && { project_id: selectedProject.id })
            };
            const timeEntry = await withSpinner('Creating timer...', () => client.createTimeEntry(config.workspaceId, timeEntryData), context);
            if (timeEntry) {
                return {
                    success: true,
                    timeEntry
                };
            }
            return {
                error: new Error('Failed to start timer. Please try again.'),
                success: false
            };
        }
        catch (error) {
            const convertedError = error instanceof Error && error.message
                ? error
                : new Error(String(error) || 'Unknown error occurred during timer creation');
            return {
                error: convertedError,
                success: false
            };
        }
    },
    /**
     * Fetches both tasks and projects from the Toggl API.
     * Returns null values if the fetch fails.
     */
    async fetchTasksAndProjects(client, context) {
        try {
            const [tasks, projects] = await withSpinner('Fetching available tasks and projects...', async () => Promise.all([client.getTasks(), client.getProjects()]), context);
            return { projects, tasks };
        }
        catch {
            throw new Error('Failed to fetch tasks/projects');
        }
    },
    /**
     * Validates timer description input.
     */
    validateDescription(description) {
        if (!description || description.trim().length === 0) {
            return {
                error: 'Timer description cannot be empty',
                isValid: false
            };
        }
        if (description.trim().length > 500) {
            return {
                error: 'Timer description cannot exceed 500 characters',
                isValid: false
            };
        }
        return { isValid: true };
    },
    /**
     * Validates that the project and task are compatible.
     */
    validateProjectTaskRelationship(project, task) {
        if (task && project && task.project_id !== project.id) {
            return {
                error: `Task "${task.name}" does not belong to project "${project.name}"`,
                isValid: false
            };
        }
        return { isValid: true };
    },
    /**
     * Performs comprehensive validation of all timer creation parameters.
     */
    validateTimerCreation(options) {
        const { config, description, selectedProject, selectedTask } = options;
        // Validate workspace config
        const workspaceValidation = this.validateWorkspaceConfig(config);
        if (!workspaceValidation.isValid) {
            return workspaceValidation;
        }
        // Validate description
        const descriptionValidation = this.validateDescription(description);
        if (!descriptionValidation.isValid) {
            return descriptionValidation;
        }
        // Validate project/task relationship
        const relationshipValidation = this.validateProjectTaskRelationship(selectedProject, selectedTask);
        if (!relationshipValidation.isValid) {
            return relationshipValidation;
        }
        return { isValid: true };
    },
    /**
     * Validates workspace configuration.
     */
    validateWorkspaceConfig(config) {
        if (!config.workspaceId) {
            return {
                error: 'Workspace ID is missing from configuration',
                isValid: false
            };
        }
        return { isValid: true };
    },
};
