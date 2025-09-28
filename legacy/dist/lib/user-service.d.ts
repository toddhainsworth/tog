import type { TogglClient } from './toggl-client.js';
export interface LoggingContext {
    debug?: (message: string, data?: Record<string, unknown>) => void;
    warn?: (message: string) => void;
}
export interface TokenValidationResult {
    error?: string;
    isValid: boolean;
    userId?: number;
}
export declare const UserService: {
    /**
     * Performs a health check combining authentication and basic API access.
     * Useful for startup validation and configuration verification.
     */
    performHealthCheck(client: TogglClient, context?: LoggingContext): Promise<{
        checks: {
            authentication: boolean;
            connection: boolean;
        };
        error?: string;
        healthy: boolean;
    }>;
    /**
     * Performs a connectivity test to the Toggl API.
     * This is useful for configuration validation and network diagnostics.
     */
    testConnection(client: TogglClient, context?: LoggingContext): Promise<{
        connected: boolean;
        error?: string;
    }>;
    /**
     * Validates that the client is properly authenticated and can access Toggl API.
     * This combines token validation with connection testing.
     */
    validateAuthentication(client: TogglClient, context?: LoggingContext): Promise<{
        authenticated: boolean;
        error?: string;
    }>;
    /**
     * Validates API token by pinging the Toggl API.
     * Returns validation result with success flag and optional user ID.
     */
    validateToken(client: TogglClient, context?: LoggingContext): Promise<TokenValidationResult>;
};
