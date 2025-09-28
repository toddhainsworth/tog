import type { TogglClient } from './toggl-client.js';
import type { Client } from './validation.js';
export interface LoggingContext {
    debug?: (message: string, data?: Record<string, unknown>) => void;
    warn?: (message: string) => void;
}
export interface ClientSelectionResult {
    client?: Client;
    error?: string;
    success: boolean;
}
export declare const ClientService: {
    /**
     * Creates a client lookup map for efficient client name to ID resolution.
     */
    createClientLookupMap(clients: Client[]): Map<string, Client>;
    /**
     * Filters clients by name pattern.
     */
    filterClientsByName(clients: Client[], pattern: string): Client[];
    /**
     * Finds a client by its ID.
     */
    findClientById(clients: Client[], clientId: number): Client | null;
    /**
     * Finds a client by name (case-insensitive partial match) or exact ID.
     * Supports exact matches taking precedence over partial matches.
     * Throws error if multiple partial matches are found without an exact match.
     */
    findClientByNameOrId(clients: Client[], input: string): Client | null;
    /**
     * Gets client by name using a lookup map (more efficient for bulk operations).
     */
    getClientFromLookupMap(lookupMap: Map<string, Client>, clientName: string): Client | undefined;
    /**
     * Fetches all clients for the authenticated user.
     * Returns empty array on error.
     */
    getClients(client: TogglClient, context?: LoggingContext): Promise<Client[]>;
    /**
     * Gets client statistics for reporting.
     */
    getClientStats(togglClient: TogglClient, projects: Array<{
        client_name?: null | string;
    }>, context?: LoggingContext): Promise<{
        averageProjectsPerClient: number;
        clientsWithoutProjects: number;
        clientsWithProjects: number;
        error?: string;
        topClientsByProjects: Array<{
            name: string;
            projectCount: number;
        }>;
        totalClients: number;
    }>;
    /**
     * Gets clients with their project counts.
     * This requires project data to be passed in since ClientService doesn't directly depend on ProjectService.
     */
    getClientsWithProjectCounts(clients: Client[], projects: Array<{
        client_name?: null | string;
    }>): Array<{
        client: Client;
        projectCount: number;
    }>;
    /**
     * Selects a client based on name or ID input.
     * Includes comprehensive validation and error handling.
     */
    selectClient(togglClient: TogglClient, input: string, context?: LoggingContext): Promise<ClientSelectionResult>;
    /**
     * Sorts clients alphabetically by name.
     */
    sortClientsByName(clients: Client[]): Client[];
    /**
     * Validates that a client exists and is accessible.
     */
    validateClient(togglClient: TogglClient, clientId: number, context?: LoggingContext): Promise<ClientSelectionResult>;
};
