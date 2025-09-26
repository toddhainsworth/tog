import { expect } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import sinon, { type SinonStub } from 'sinon'

import type { TogglClient } from '../../src/lib/toggl-client.js'

import { UserService } from '../../src/lib/user-service.js'

describe('UserService', () => {
  let mockClient: sinon.SinonStubbedInstance<TogglClient>
  let mockContext: { debug: SinonStub; warn: SinonStub }

  beforeEach(() => {
    mockClient = {
      ping: sinon.stub()
    } as unknown as sinon.SinonStubbedInstance<TogglClient>

    mockContext = {
      debug: sinon.stub(),
      warn: sinon.stub()
    }
  })

  describe('validateToken', () => {
    it('should validate token successfully when ping returns true', async () => {
      mockClient.ping.resolves(true)

      const result = await UserService.validateToken(mockClient, mockContext)

      expect(result).to.deep.equal({
        isValid: true
      })
      expect(mockContext.debug).to.have.been.calledWith('Validating API token')
      expect(mockContext.debug).to.have.been.calledWith('API token validation successful')
    })

    it('should fail validation when ping returns false', async () => {
      mockClient.ping.resolves(false)

      const result = await UserService.validateToken(mockClient, mockContext)

      expect(result).to.deep.equal({
        error: 'API token is invalid or expired',
        isValid: false
      })
      expect(mockContext.debug).to.have.been.calledWith('API token validation failed - invalid token')
    })

    it('should handle API errors', async () => {
      const error = new Error('Network error')
      mockClient.ping.rejects(error)

      const result = await UserService.validateToken(mockClient, mockContext)

      expect(result.isValid).to.be.false
      expect(result.error).to.include('Token validation failed: Network error')
      expect(mockContext.debug).to.have.been.calledWith('API token validation failed with error', {
        error: 'Network error'
      })
    })

    it('should handle non-Error exceptions', async () => {
      mockClient.ping.rejects('String error')

      const result = await UserService.validateToken(mockClient, mockContext)

      expect(result.isValid).to.be.false
      expect(result.error).to.include('Token validation failed:')
    })

    it('should work without context', async () => {
      mockClient.ping.resolves(true)

      const result = await UserService.validateToken(mockClient)

      expect(result.isValid).to.be.true
    })
  })

  describe('testConnection', () => {
    it('should return connected when ping succeeds', async () => {
      mockClient.ping.resolves(true)

      const result = await UserService.testConnection(mockClient, mockContext)

      expect(result).to.deep.equal({ connected: true })
      expect(mockContext.debug).to.have.been.calledWith('Testing connection to Toggl API')
      expect(mockContext.debug).to.have.been.calledWith('Connection test successful')
    })

    it('should return not connected when ping fails', async () => {
      mockClient.ping.resolves(false)

      const result = await UserService.testConnection(mockClient, mockContext)

      expect(result).to.deep.equal({
        connected: false,
        error: 'Unable to connect to Toggl API'
      })
      expect(mockContext.debug).to.have.been.calledWith('Connection test failed - unable to reach API')
    })

    it('should handle API errors', async () => {
      const error = new Error('Network timeout')
      mockClient.ping.rejects(error)

      const result = await UserService.testConnection(mockClient, mockContext)

      expect(result.connected).to.be.false
      expect(result.error).to.include('Connection failed: Network timeout')
      expect(mockContext.debug).to.have.been.calledWith('Connection test failed with error', {
        error: 'Network timeout'
      })
    })

    it('should work without context', async () => {
      mockClient.ping.resolves(true)

      const result = await UserService.testConnection(mockClient)

      expect(result.connected).to.be.true
    })
  })

  describe('validateAuthentication', () => {
    it('should return authenticated when token and connection are valid', async () => {
      mockClient.ping.resolves(true)

      const result = await UserService.validateAuthentication(mockClient, mockContext)

      expect(result).to.deep.equal({ authenticated: true })
      expect(mockContext.debug).to.have.been.calledWith('Validating authentication')
      expect(mockContext.debug).to.have.been.calledWith('Authentication validation successful')
    })

    it('should return not authenticated when token validation fails', async () => {
      mockClient.ping.resolves(false)

      const result = await UserService.validateAuthentication(mockClient, mockContext)

      expect(result.authenticated).to.be.false
      expect(result.error).to.include('API token is invalid or expired')
    })

    it('should handle token validation errors', async () => {
      const error = new Error('Token error')
      mockClient.ping.rejects(error)

      const result = await UserService.validateAuthentication(mockClient, mockContext)

      expect(result.authenticated).to.be.false
      expect(result.error).to.include('Token validation failed: Token error')
    })

    it('should work without context', async () => {
      mockClient.ping.resolves(true)

      const result = await UserService.validateAuthentication(mockClient)

      expect(result.authenticated).to.be.true
    })
  })

  describe('performHealthCheck', () => {
    it('should return healthy when authentication succeeds', async () => {
      mockClient.ping.resolves(true)

      const result = await UserService.performHealthCheck(mockClient, mockContext)

      expect(result).to.deep.equal({
        checks: {
          authentication: true,
          connection: true
        },
        healthy: true
      })
      expect(mockContext.debug).to.have.been.calledWith('Performing health check')
      expect(mockContext.debug).to.have.been.calledWith('Health check completed successfully')
    })

    it('should return unhealthy when authentication fails', async () => {
      mockClient.ping.resolves(false)

      const result = await UserService.performHealthCheck(mockClient, mockContext)

      expect(result.healthy).to.be.false
      expect(result.checks).to.deep.equal({
        authentication: false,
        connection: false
      })
      expect(result.error).to.include('API token is invalid or expired')
    })

    it('should handle authentication errors', async () => {
      const error = new Error('Auth error')
      mockClient.ping.rejects(error)

      const result = await UserService.performHealthCheck(mockClient, mockContext)

      expect(result.healthy).to.be.false
      expect(result.checks).to.deep.equal({
        authentication: false,
        connection: false
      })
      expect(result.error).to.include('Token validation failed: Auth error')
    })

    it('should work without context', async () => {
      mockClient.ping.resolves(true)

      const result = await UserService.performHealthCheck(mockClient)

      expect(result.healthy).to.be.true
      expect(result.checks).to.deep.equal({
        authentication: true,
        connection: true
      })
    })
  })

  describe('edge cases', () => {
    it('should handle undefined ping results', async () => {
      mockClient.ping.resolves(undefined as unknown as boolean)

      const tokenResult = await UserService.validateToken(mockClient, mockContext)
      const connectionResult = await UserService.testConnection(mockClient, mockContext)

      expect(tokenResult.isValid).to.be.false
      expect(connectionResult.connected).to.be.false
    })

    it('should handle null ping results', async () => {
      mockClient.ping.resolves(null as unknown as boolean)

      const tokenResult = await UserService.validateToken(mockClient, mockContext)
      const connectionResult = await UserService.testConnection(mockClient, mockContext)

      expect(tokenResult.isValid).to.be.false
      expect(connectionResult.connected).to.be.false
    })

    it('should handle empty string errors', async () => {
      mockClient.ping.rejects('')

      const result = await UserService.validateToken(mockClient, mockContext)

      expect(result.isValid).to.be.false
      expect(result.error).to.include('Token validation failed: ')
    })
  })
});