import axios from 'axios';
import { createApiErrorFromAxios, TogglValidationError } from './errors.js';
import { ClientsArraySchema, FavoritesArraySchema, ProjectsArraySchema, ReportsSearchResponseSchema, TasksArraySchema, TimeEntriesArraySchema, TimeEntrySchema, UserSchema, WorkspacesArraySchema, } from './validation.js';
export class TogglClient {
    client;
    logger;
    reportsClient;
    constructor(apiToken, logger) {
        this.logger = logger;
        const authHeader = `Basic ${Buffer.from(`${apiToken}:api_token`, 'utf8').toString('base64')}`;
        this.client = axios.create({
            baseURL: 'https://api.track.toggl.com/api/v9',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
        });
        this.reportsClient = axios.create({
            baseURL: 'https://api.track.toggl.com/reports/api/v3',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * Creates a new time entry in the specified workspace.
     */
    async createTimeEntry(workspaceId, timeEntry) {
        try {
            const response = await this.client.post(`/workspaces/${workspaceId}/time_entries?meta=true`, timeEntry);
            return TimeEntrySchema.assert(response.data);
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
                throw TogglValidationError.invalidResponse(error.message);
            }
            throw createApiErrorFromAxios(error, `/workspaces/${workspaceId}/time_entries`);
        }
    }
    /**
     * Fetches all clients for the authenticated user.
     */
    async getClients() {
        try {
            const response = await this.client.get('/me/clients');
            const data = response.data || [];
            return ClientsArraySchema.assert(data);
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
                throw TogglValidationError.invalidResponse(error.message);
            }
            throw createApiErrorFromAxios(error, '/me/clients');
        }
    }
    /**
     * Fetches the current running time entry, if any.
     */
    async getCurrentTimeEntry() {
        try {
            const response = await this.client.get('/me/time_entries/current');
            const { data } = response;
            return data ? TimeEntrySchema.assert(data) : null;
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
                throw TogglValidationError.invalidResponse(error.message);
            }
            throw createApiErrorFromAxios(error, '/me/time_entries/current');
        }
    }
    /**
     * Fetches all favorites for the authenticated user.
     */
    async getFavorites() {
        try {
            const response = await this.client.get('/me/favorites');
            const data = response.data || [];
            return FavoritesArraySchema.assert(data);
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
                throw TogglValidationError.invalidResponse(error.message);
            }
            throw createApiErrorFromAxios(error, '/me/favorites');
        }
    }
    /**
     * Fetches the most recent time entry.
     */
    async getMostRecentTimeEntry() {
        try {
            const response = await this.client.get('/me/time_entries', {
                params: { page_size: 1 }
            });
            const data = response.data || [];
            const entries = TimeEntriesArraySchema.assert(data);
            return entries.length > 0 ? (entries[0] ?? null) : null;
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
                throw TogglValidationError.invalidResponse(error.message);
            }
            throw createApiErrorFromAxios(error, '/me/time_entries');
        }
    }
    /**
     * Fetches all projects for the authenticated user.
     */
    async getProjects() {
        try {
            const response = await this.client.get('/me/projects');
            const data = response.data || [];
            return ProjectsArraySchema.assert(data);
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
                throw TogglValidationError.invalidResponse(error.message);
            }
            throw createApiErrorFromAxios(error, '/me/projects');
        }
    }
    /**
     * Fetches all tasks for the authenticated user.
     */
    async getTasks() {
        try {
            const response = await this.client.get('/me/tasks?meta=true');
            return TasksArraySchema.assert(response.data);
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
                throw TogglValidationError.invalidResponse(error.message);
            }
            throw createApiErrorFromAxios(error, '/me/tasks');
        }
    }
    async getTimeEntries(optionsOrStartDate, endDate) {
        try {
            const params = typeof optionsOrStartDate === 'string'
                ? {
                    end_date: endDate ?? '',
                    start_date: optionsOrStartDate,
                }
                : {
                    end_date: optionsOrStartDate.end_date,
                    start_date: optionsOrStartDate.start_date,
                };
            const response = await this.client.get('/me/time_entries', { params });
            const data = response.data || [];
            return TimeEntriesArraySchema.assert(data);
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
                throw TogglValidationError.invalidResponse(error.message);
            }
            throw createApiErrorFromAxios(error, '/me/time_entries');
        }
    }
    /**
     * Fetches all workspaces for the authenticated user.
     */
    async getWorkspaces() {
        try {
            const response = await this.client.get('/me/workspaces');
            const data = response.data || [];
            return WorkspacesArraySchema.assert(data);
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
                throw TogglValidationError.invalidResponse(error.message);
            }
            throw createApiErrorFromAxios(error, '/me/workspaces');
        }
    }
    /**
     * Tests API connectivity and token validity.
     * Returns false instead of throwing errors for connectivity testing.
     */
    async ping() {
        try {
            const response = await this.client.get('/me');
            const validatedUser = UserSchema.assert(response.data);
            return validatedUser.id > 0;
        }
        catch {
            // For ping, we want to return false rather than throw
            // This is used for connectivity testing
            return false;
        }
    }
    /**
     * Searches time entries using the Reports API.
     * Returns converted TimeEntry array for backward compatibility.
     */
    async searchTimeEntries(workspaceId, searchParams) {
        try {
            const response = await this.reportsClient.post(`/workspace/${workspaceId}/search/time_entries`, searchParams);
            const validatedGroups = ReportsSearchResponseSchema.assert(response.data || []);
            // Convert Reports API format to standard TimeEntry format for backward compatibility
            const timeEntries = [];
            for (const group of validatedGroups) {
                for (const entry of group.time_entries) {
                    const timeEntry = {
                        at: entry.at,
                        description: group.description || '',
                        duration: entry.seconds,
                        id: entry.id,
                        project_id: group.project_id ?? undefined,
                        start: entry.start,
                        stop: entry.stop ?? undefined,
                        task_id: group.task_id ?? null,
                        workspace_id: entry.workspace_id || workspaceId,
                    };
                    timeEntries.push(TimeEntrySchema.assert(timeEntry));
                }
            }
            return timeEntries;
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
                throw TogglValidationError.invalidResponse(error.message);
            }
            throw createApiErrorFromAxios(error, `/workspace/${workspaceId}/search/time_entries`);
        }
    }
    /**
     * Stops a running time entry.
     * Returns true on success, false on failure.
     */
    async stopTimeEntry(workspaceId, timeEntryId) {
        try {
            await this.client.patch(`/workspaces/${workspaceId}/time_entries/${timeEntryId}/stop`);
            return true;
        }
        catch {
            // For stop operations, return false to indicate failure
            // The caller can decide how to handle this
            return false;
        }
    }
    /**
     * Updates an existing time entry.
     */
    async updateTimeEntry(workspaceId, timeEntryId, updates) {
        try {
            const response = await this.client.put(`/workspaces/${workspaceId}/time_entries/${timeEntryId}`, updates);
            return TimeEntrySchema.assert(response.data);
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'ArkTypeError') {
                throw TogglValidationError.invalidResponse(error.message);
            }
            throw createApiErrorFromAxios(error, `/workspaces/${workspaceId}/time_entries/${timeEntryId}`);
        }
    }
}
