/**
 * Custom error classes for Toggl CLI
 * Provides structured error handling with better type safety
 */
/**
 * Base error class for all Toggl CLI errors
 */
export declare abstract class TogglError extends Error {
    abstract readonly category: 'api' | 'config' | 'user' | 'validation';
    abstract readonly code: string;
    constructor(message: string, cause?: Error);
}
/**
 * Configuration-related errors (missing config, invalid format, etc.)
 */
export declare class TogglConfigError extends TogglError {
    readonly category: "config";
    readonly code = "CONFIG_ERROR";
    static invalidConfig(details: string): TogglConfigError;
    static noConfigFound(): TogglConfigError;
}
/**
 * API-related errors (network issues, authentication, API responses)
 */
export declare class TogglApiError extends TogglError {
    readonly statusCode?: number | undefined;
    readonly endpoint?: string | undefined;
    readonly category: "api";
    readonly code = "API_ERROR";
    constructor(message: string, statusCode?: number | undefined, endpoint?: string | undefined, cause?: Error);
    static authenticationFailed(): TogglApiError;
    static connectionFailed(endpoint?: string, cause?: Error): TogglApiError;
    static notFound(resource: string): TogglApiError;
    static serverError(message: string, statusCode: number): TogglApiError;
}
/**
 * Validation errors for user input and API responses
 */
export declare class TogglValidationError extends TogglError {
    readonly category: "validation";
    readonly code = "VALIDATION_ERROR";
    static invalidApiToken(): TogglValidationError;
    static invalidDescription(): TogglValidationError;
    static invalidResponse(details: string): TogglValidationError;
    static invalidWorkspaceId(): TogglValidationError;
}
/**
 * User interaction errors (cancelled operations, invalid selections)
 */
export declare class TogglUserError extends TogglError {
    readonly category: "user";
    readonly code = "USER_ERROR";
    static noSelection(): TogglUserError;
    static operationCancelled(): TogglUserError;
}
/**
 * Utility function to create appropriate error from axios errors
 */
export declare function createApiErrorFromAxios(error: unknown, endpoint?: string): TogglApiError;
