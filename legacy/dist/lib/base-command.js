import { Command, Flags } from '@oclif/core';
import { loadConfig } from './config.js';
import { DataSanitizer } from './data-sanitizer.js';
import { EMOJIS } from './emojis.js';
import { ReferenceCachedTogglClient } from './reference-cached-toggl-client.js';
/**
 * Base command class providing common functionality for all Toggl CLI commands
 */
export class BaseCommand extends Command {
    static baseFlags = {
        debug: Flags.boolean({
            description: 'Show debug output including full error details',
            hidden: true, // Hide from help unless specifically requested
            // No shorthand to avoid conflicts with command-specific flags
        }),
    };
    client = null;
    togglConfig = null;
    /**
     * Get or create Toggl client instance with caching
     * @returns ReferenceCachedTogglClient instance
     */
    getClient() {
        if (!this.client) {
            const config = this.togglConfig || this.loadConfigOrExit();
            const debugLogger = {
                debug: (message, data) => this.logDebug(`[TogglClient] ${message}`, data)
            };
            this.client = new ReferenceCachedTogglClient(config.apiToken, debugLogger);
        }
        return this.client;
    }
    /**
     * Get logging context for services
     * @returns LoggingContext instance
     */
    getLoggingContext() {
        return {
            debug: (message, data) => this.logDebug(message, data),
            warn: (message) => this.logWarning(message)
        };
    }
    /**
     * Handle common error scenarios with consistent messaging
     * @param error The error to handle
     * @param context Additional context for the error
     * @param debug Optional debug flag to show full error details
     */
    handleError(error, context, debug) {
        if (debug) {
            // In debug mode, show the full error details using oclif's logToStderr
            this.logDebugError('Full error details', error instanceof Error ? error : new Error(String(error)), {
                context,
            });
        }
        const message = error instanceof Error ? error.message : String(error);
        this.error(`${EMOJIS.ERROR} ${context}: ${message}`);
    }
    /**
     * Load configuration or exit with error message
     * @returns Valid TogglConfig
     */
    loadConfigOrExit() {
        const config = loadConfig();
        if (!config) {
            this.error('No Toggl CLI configuration found. Run `tog init` to set up your API token first.');
        }
        this.togglConfig = config;
        return config;
    }
    /**
     * Log debug message when debug flag is enabled
     * Uses oclif's logToStderr for proper output handling
     * @param message Debug message
     * @param data Optional structured data (will be sanitized)
     */
    logDebug(message, data) {
        // Access debug flag directly from argv - simpler than overriding parse
        if (!process.argv.includes('--debug'))
            return;
        let output = `🔍 DEBUG: ${message}`;
        if (data && Object.keys(data).length > 0) {
            const sanitizedData = DataSanitizer.sanitize(data);
            output += ` ${JSON.stringify(sanitizedData)}`;
        }
        this.logToStderr(output);
    }
    /**
     * Log debug error with full details when debug flag is enabled
     * @param message Debug message
     * @param error Error object
     * @param data Optional structured data (will be sanitized)
     */
    logDebugError(message, error, data) {
        // Access debug flag directly from argv - simpler than overriding parse
        if (!process.argv.includes('--debug'))
            return;
        let output = `🔍 DEBUG: ${message}`;
        output += `\n  Error: ${error.message}`;
        if (data && Object.keys(data).length > 0) {
            const sanitizedData = DataSanitizer.sanitize(data);
            output += `\n  Data: ${JSON.stringify(sanitizedData)}`;
        }
        if (error.stack) {
            output += `\n  Stack: ${error.stack}`;
        }
        this.logToStderr(output);
    }
    /**
     * Log info message with emoji
     * @param message Info message
     */
    logInfo(message) {
        this.log(`${EMOJIS.INFO} ${message}`);
    }
    /**
     * Log success message with emoji
     * @param message Success message
     */
    logSuccess(message) {
        this.log(`${EMOJIS.SUCCESS} ${message}`);
    }
    /**
     * Log warning message with emoji
     * @param message Warning message
     */
    logWarning(message) {
        this.log(`${EMOJIS.WARNING} ${message}`);
    }
    /**
     * Set config directly (for testing)
     */
    setConfig(config) {
        this.togglConfig = config;
        this.client = null; // Reset client to use new config
    }
}
