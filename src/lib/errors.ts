/**
 * Custom error classes for Toggl CLI
 * Provides structured error handling with better type safety
 */

/**
 * Base error class for all Toggl CLI errors
 */
export abstract class TogglError extends Error {
  abstract readonly category: 'api' | 'config' | 'user' | 'validation'
  abstract readonly code: string

  constructor(message: string, cause?: Error) {
    super(message)
    this.name = this.constructor.name
    if (cause) {
      this.cause = cause
    }
  }
}

/**
 * Configuration-related errors (missing config, invalid format, etc.)
 */
export class TogglConfigError extends TogglError {
  readonly category = 'config' as const
  readonly code = 'CONFIG_ERROR'

  static invalidConfig(details: string): TogglConfigError {
    return new TogglConfigError(`Invalid configuration: ${details}`)
  }

  static noConfigFound(): TogglConfigError {
    return new TogglConfigError('No Toggl CLI configuration found. Run `tog init` to set up your API token first.')
  }
}

/**
 * API-related errors (network issues, authentication, API responses)
 */
export class TogglApiError extends TogglError {
  readonly category = 'api' as const
  readonly code = 'API_ERROR'

  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string,
    cause?: Error
  ) {
    super(message, cause)
  }

  static authenticationFailed(): TogglApiError {
    return new TogglApiError(
      'Authentication failed. Your API token may be invalid or expired.',
      401
    )
  }

  static connectionFailed(endpoint?: string, cause?: Error): TogglApiError {
    return new TogglApiError(
      `Failed to connect to Toggl API${endpoint ? ` (${endpoint})` : ''}`,
      undefined,
      endpoint,
      cause
    )
  }

  static notFound(resource: string): TogglApiError {
    return new TogglApiError(`${resource} not found`, 404)
  }

  static serverError(message: string, statusCode: number): TogglApiError {
    return new TogglApiError(`Server error: ${message}`, statusCode)
  }
}

/**
 * Validation errors for user input and API responses
 */
export class TogglValidationError extends TogglError {
  readonly category = 'validation' as const
  readonly code = 'VALIDATION_ERROR'

  static invalidApiToken(): TogglValidationError {
    return new TogglValidationError('API token must be at least 32 characters long')
  }

  static invalidDescription(): TogglValidationError {
    return new TogglValidationError('Description cannot be empty and must be 200 characters or less')
  }

  static invalidResponse(details: string): TogglValidationError {
    return new TogglValidationError(`Invalid API response: ${details}`)
  }

  static invalidWorkspaceId(): TogglValidationError {
    return new TogglValidationError('Workspace ID must be a positive number')
  }
}

/**
 * User interaction errors (cancelled operations, invalid selections)
 */
export class TogglUserError extends TogglError {
  readonly category = 'user' as const
  readonly code = 'USER_ERROR'

  static noSelection(): TogglUserError {
    return new TogglUserError('No selection made')
  }

  static operationCancelled(): TogglUserError {
    return new TogglUserError('Operation was cancelled by user')
  }
}

/**
 * Utility function to create appropriate error from axios errors
 */
export function createApiErrorFromAxios(error: unknown, endpoint?: string): TogglApiError {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {response: {status: number; statusText: string}}
    const statusCode = axiosError.response.status

    if (statusCode === 401 || statusCode === 403) {
      return TogglApiError.authenticationFailed()
    }

    if (statusCode === 404) {
      return TogglApiError.notFound(endpoint || 'Resource')
    }

    if (statusCode >= 500) {
      return TogglApiError.serverError(axiosError.response.statusText, statusCode)
    }

    return new TogglApiError(
      `HTTP ${statusCode}: ${axiosError.response.statusText}`,
      statusCode,
      endpoint,
      error instanceof Error ? error : undefined
    )
  }

  return TogglApiError.connectionFailed(endpoint, error instanceof Error ? error : undefined)
}