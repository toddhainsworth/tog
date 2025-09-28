import { Command } from '@oclif/core';
import { type TogglConfig } from './config.js';
import { ReferenceCachedTogglClient } from './reference-cached-toggl-client.js';
export interface LoggingContext {
    debug?: (message: string, data?: Record<string, unknown>) => void;
    warn?: (message: string) => void;
}
/**
 * Base command class providing common functionality for all Toggl CLI commands
 */
export declare abstract class BaseCommand extends Command {
    static baseFlags: {
        debug: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    private client;
    private togglConfig;
    /**
     * Get or create Toggl client instance with caching
     * @returns ReferenceCachedTogglClient instance
     */
    protected getClient(): ReferenceCachedTogglClient;
    /**
     * Get logging context for services
     * @returns LoggingContext instance
     */
    protected getLoggingContext(): LoggingContext;
    /**
     * Handle common error scenarios with consistent messaging
     * @param error The error to handle
     * @param context Additional context for the error
     * @param debug Optional debug flag to show full error details
     */
    protected handleError(error: unknown, context: string, debug?: boolean): never;
    /**
     * Load configuration or exit with error message
     * @returns Valid TogglConfig
     */
    protected loadConfigOrExit(): TogglConfig;
    /**
     * Log debug message when debug flag is enabled
     * Uses oclif's logToStderr for proper output handling
     * @param message Debug message
     * @param data Optional structured data (will be sanitized)
     */
    protected logDebug(message: string, data?: Record<string, unknown>): void;
    /**
     * Log debug error with full details when debug flag is enabled
     * @param message Debug message
     * @param error Error object
     * @param data Optional structured data (will be sanitized)
     */
    protected logDebugError(message: string, error: Error, data?: Record<string, unknown>): void;
    /**
     * Log info message with emoji
     * @param message Info message
     */
    protected logInfo(message: string): void;
    /**
     * Log success message with emoji
     * @param message Success message
     */
    protected logSuccess(message: string): void;
    /**
     * Log warning message with emoji
     * @param message Warning message
     */
    protected logWarning(message: string): void;
    /**
     * Set config directly (for testing)
     */
    protected setConfig(config: TogglConfig): void;
}
