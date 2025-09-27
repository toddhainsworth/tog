import type { TogglClient } from './toggl-client.js'

export interface LoggingContext {
  debug?: (message: string, data?: Record<string, unknown>) => void
  warn?: (message: string) => void
}

export interface TokenValidationResult {
  error?: string
  isValid: boolean
  userId?: number
}

export const UserService = {
  /**
   * Performs a health check combining authentication and basic API access.
   * Useful for startup validation and configuration verification.
   */
  async performHealthCheck(client: TogglClient, context?: LoggingContext): Promise<{
    checks: {
      authentication: boolean
      connection: boolean
    }
    error?: string
    healthy: boolean
  }> {
    context?.debug?.('Performing health check')

    const authResult = await this.validateAuthentication(client, context)

    if (!authResult.authenticated) {
      return {
        checks: {
          authentication: false,
          connection: false
        },
        error: authResult.error,
        healthy: false
      }
    }

    context?.debug?.('Health check completed successfully')
    return {
      checks: {
        authentication: true,
        connection: true
      },
      healthy: true
    }
  },

  /**
   * Performs a connectivity test to the Toggl API.
   * This is useful for configuration validation and network diagnostics.
   */
  async testConnection(client: TogglClient, context?: LoggingContext): Promise<{
    connected: boolean
    error?: string
  }> {
    try {
      context?.debug?.('Testing connection to Toggl API')
      const isConnected = await client.ping()

      if (isConnected) {
        context?.debug?.('Connection test successful')
        return { connected: true }
      }
 
        context?.debug?.('Connection test failed - unable to reach API')
        return {
          connected: false,
          error: 'Unable to connect to Toggl API'
        }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      context?.debug?.('Connection test failed with error', { error: errorMessage })
      return {
        connected: false,
        error: `Connection failed: ${errorMessage}`
      }
    }
  },

  /**
   * Validates that the client is properly authenticated and can access Toggl API.
   * This combines token validation with connection testing.
   */
  async validateAuthentication(client: TogglClient, context?: LoggingContext): Promise<{
    authenticated: boolean
    error?: string
  }> {
    context?.debug?.('Validating authentication')

    const tokenResult = await this.validateToken(client, context)

    if (!tokenResult.isValid) {
      return {
        authenticated: false,
        error: tokenResult.error || 'Authentication failed'
      }
    }

    const connectionResult = await this.testConnection(client, context)

    if (!connectionResult.connected) {
      return {
        authenticated: false,
        error: connectionResult.error || 'Connection failed'
      }
    }

    context?.debug?.('Authentication validation successful')
    return {
      authenticated: true
    }
  },

  /**
   * Validates API token by pinging the Toggl API.
   * Returns validation result with success flag and optional user ID.
   */
  async validateToken(client: TogglClient, context?: LoggingContext): Promise<TokenValidationResult> {
    try {
      context?.debug?.('Validating API token')
      const isValid = await client.ping()

      if (isValid) {
        context?.debug?.('API token validation successful')
        return {
          isValid: true
        }
      }
 
        context?.debug?.('API token validation failed - invalid token')
        return {
          error: 'API token is invalid or expired',
          isValid: false
        }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      context?.debug?.('API token validation failed with error', { error: errorMessage })
      return {
        error: `Token validation failed: ${errorMessage}`,
        isValid: false
      }
    }
  }
};