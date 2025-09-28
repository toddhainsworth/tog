/**
 * Configuration Validation Schemas
 *
 * Uses arktype for runtime validation of configuration data,
 * maintaining the same validation standards as the legacy implementation.
 */

import { type } from 'arktype'

/**
 * API Token validation schema
 *
 * Toggl API tokens are typically 32+ character hex strings
 */
export const ApiTokenSchema = type('string>=32')

/**
 * Configuration object schema
 */
export const ConfigSchema = type({
  apiToken: ApiTokenSchema,
  workspaceId: 'number',
})

/**
 * Type definitions inferred from schemas
 */
export type ApiToken = typeof ApiTokenSchema.infer
export type Config = typeof ConfigSchema.infer
