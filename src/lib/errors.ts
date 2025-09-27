/**
 * Custom error classes for Toggl CLI
 * Provides structured error handling with better type safety
 */

import {isAxiosError} from 'axios'

import { HTTP_STATUS, MAX_DESCRIPTION_LENGTH, MIN_API_TOKEN_LENGTH } from './constants.js'

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
      HTTP_STATUS.UNAUTHORIZED
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
    return new TogglValidationError(`API token must be at least ${MIN_API_TOKEN_LENGTH} characters long`)
  }

  static invalidDescription(): TogglValidationError {
    return new TogglValidationError(`Description cannot be empty and must be ${MAX_DESCRIPTION_LENGTH} characters or less`)
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
  if (isAxiosError(error) && error.response) {
    const {data, status: statusCode, statusText} = error.response

    if (statusCode === HTTP_STATUS.UNAUTHORIZED || statusCode === HTTP_STATUS.FORBIDDEN) {
      return TogglApiError.authenticationFailed()
    }

    if (statusCode === 404) {
      return TogglApiError.notFound(endpoint || 'Resource')
    }

    if (statusCode >= 500) {
      return TogglApiError.serverError(statusText, statusCode)
    }

    // For 400 errors, include the response body if available
    let errorMessage = `HTTP ${statusCode}: ${statusText}`
    if (statusCode === 400 && data) {
      if (typeof data === 'string') {
        errorMessage += ` - ${data}`
      } else if (typeof data === 'object' && data !== null) {
        errorMessage += ` - ${JSON.stringify(data)}`
      }
    }

    return new TogglApiError(
      errorMessage,
      statusCode,
      endpoint,
      error
    )
  }

  // Handle generic errors - extract message if it's an Error object
  const errorCause = error instanceof Error ? error : undefined
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

  return TogglApiError.connectionFailed(
    endpoint ? `${endpoint}: ${errorMessage}` : errorMessage,
    errorCause
  )
}