/**
 * Custom error classes for Toggl CLI
 * Provides structured error handling with better type safety
 */
import { isAxiosError } from 'axios';
import { HTTP_STATUS, MAX_DESCRIPTION_LENGTH, MIN_API_TOKEN_LENGTH } from './constants.js';
/**
 * Base error class for all Toggl CLI errors
 */
export class TogglError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = this.constructor.name;
        if (cause) {
            this.cause = cause;
        }
    }
}
/**
 * Configuration-related errors (missing config, invalid format, etc.)
 */
export class TogglConfigError extends TogglError {
    category = 'config';
    code = 'CONFIG_ERROR';
    static invalidConfig(details) {
        return new TogglConfigError(`Invalid configuration: ${details}`);
    }
    static noConfigFound() {
        return new TogglConfigError('No Toggl CLI configuration found. Run `tog init` to set up your API token first.');
    }
}
/**
 * API-related errors (network issues, authentication, API responses)
 */
export class TogglApiError extends TogglError {
    statusCode;
    endpoint;
    category = 'api';
    code = 'API_ERROR';
    constructor(message, statusCode, endpoint, cause) {
        super(message, cause);
        this.statusCode = statusCode;
        this.endpoint = endpoint;
    }
    static authenticationFailed() {
        return new TogglApiError('Authentication failed. Your API token may be invalid or expired.', HTTP_STATUS.UNAUTHORIZED);
    }
    static connectionFailed(endpoint, cause) {
        return new TogglApiError(`Failed to connect to Toggl API${endpoint ? ` (${endpoint})` : ''}`, undefined, endpoint, cause);
    }
    static notFound(resource) {
        return new TogglApiError(`${resource} not found`, 404);
    }
    static serverError(message, statusCode) {
        return new TogglApiError(`Server error: ${message}`, statusCode);
    }
}
/**
 * Validation errors for user input and API responses
 */
export class TogglValidationError extends TogglError {
    category = 'validation';
    code = 'VALIDATION_ERROR';
    static invalidApiToken() {
        return new TogglValidationError(`API token must be at least ${MIN_API_TOKEN_LENGTH} characters long`);
    }
    static invalidDescription() {
        return new TogglValidationError(`Description cannot be empty and must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
    }
    static invalidResponse(details) {
        return new TogglValidationError(`Invalid API response: ${details}`);
    }
    static invalidWorkspaceId() {
        return new TogglValidationError('Workspace ID must be a positive number');
    }
}
/**
 * User interaction errors (cancelled operations, invalid selections)
 */
export class TogglUserError extends TogglError {
    category = 'user';
    code = 'USER_ERROR';
    static noSelection() {
        return new TogglUserError('No selection made');
    }
    static operationCancelled() {
        return new TogglUserError('Operation was cancelled by user');
    }
}
/**
 * Utility function to create appropriate error from axios errors
 */
export function createApiErrorFromAxios(error, endpoint) {
    if (isAxiosError(error) && error.response) {
        const { data, status: statusCode, statusText } = error.response;
        if (statusCode === HTTP_STATUS.UNAUTHORIZED || statusCode === HTTP_STATUS.FORBIDDEN) {
            return TogglApiError.authenticationFailed();
        }
        if (statusCode === 404) {
            return TogglApiError.notFound(endpoint || 'Resource');
        }
        if (statusCode >= 500) {
            return TogglApiError.serverError(statusText, statusCode);
        }
        // For 400 errors, include the response body if available
        let errorMessage = `HTTP ${statusCode}: ${statusText}`;
        if (statusCode === 400 && data) {
            if (typeof data === 'string') {
                errorMessage += ` - ${data}`;
            }
            else if (typeof data === 'object' && data !== null) {
                errorMessage += ` - ${JSON.stringify(data)}`;
            }
        }
        return new TogglApiError(errorMessage, statusCode, endpoint, error);
    }
    // Handle generic errors - extract message if it's an Error object
    const errorCause = error instanceof Error ? error : undefined;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return TogglApiError.connectionFailed(endpoint ? `${endpoint}: ${errorMessage}` : errorMessage, errorCause);
}
