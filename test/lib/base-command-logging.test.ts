import type sinon from 'sinon'

import {expect} from 'chai'
import {createSandbox} from 'sinon'

import {BaseCommand} from '../../src/lib/base-command.js'

// Concrete test command that extends BaseCommand
class TestCommand extends BaseCommand {
  static override baseFlags = BaseCommand.baseFlags

  async run(): Promise<void> {
    // Test implementation
  }

  public testHandleError(error: unknown, context: string, debug?: boolean): never {
    this.handleError(error, context, debug)
  }

  // Expose protected methods for testing
  public testLogDebug(message: string, data?: Record<string, unknown>): void {
    this.logDebug(message, data)
  }

  public testLogDebugError(message: string, error: Error, data?: Record<string, unknown>): void {
    this.logDebugError(message, error, data)
  }

  public testSetConfig(config: {apiToken: string; workspaceId: number}): void {
    this.setConfig(config)
  }
}

describe('BaseCommand Debug Logging', () => {
  let sandbox: ReturnType<typeof createSandbox>
  let command: TestCommand
  let logToStderrStub: sinon.SinonStub
  let originalArgv: string[]

  beforeEach(() => {
    sandbox = createSandbox()
    // Save original argv
    originalArgv = process.argv
    // Create a minimal config for oclif Command
    command = new TestCommand([], { pjson: { name: 'test', oclif: {}, version: '1.0.0' }, root: '/test' } as unknown as any)
    logToStderrStub = sandbox.stub(command, 'logToStderr')
    sandbox.stub(command, 'error').throws(new Error('Command error'))
  })

  afterEach(() => {
    sandbox.restore()
    // Restore original argv
    process.argv = originalArgv
  })

  describe('logDebug', () => {
    it('should not log when debug flag is disabled', () => {
      // Simulate argv without --debug flag
      process.argv = ['node', 'tog', 'start']

      command.testLogDebug('Test message')
      expect(logToStderrStub.called).to.be.false
    })

    it('should log when debug flag is enabled', () => {
      // Simulate argv with --debug flag
      process.argv = ['node', 'tog', 'start', '--debug']

      command.testLogDebug('Test message')
      expect(logToStderrStub.calledOnceWith('🔍 DEBUG: Test message')).to.be.true
    })

    it('should log with data when provided', () => {
      process.argv = ['node', 'tog', 'start', '--debug']

      const data = { action: 'create', userId: 123 }
      command.testLogDebug('Operation started', data)

      expect(logToStderrStub.calledOnceWith(
        '🔍 DEBUG: Operation started {"action":"create","userId":123}'
      )).to.be.true
    })

    it('should sanitize sensitive data', () => {
      process.argv = ['node', 'tog', 'start', '--debug']

      const data = { apiToken: 'secret123456789', userId: 123 }
      command.testLogDebug('API call', data)

      expect(logToStderrStub.calledOnceWith(
        '🔍 DEBUG: API call {"apiToken":"***6789","userId":123}'
      )).to.be.true
    })

    it('should handle empty data object', () => {
      process.argv = ['node', 'tog', 'start', '--debug']

      command.testLogDebug('Test message', {})
      expect(logToStderrStub.calledOnceWith('🔍 DEBUG: Test message')).to.be.true
    })
  })

  describe('logDebugError', () => {
    it('should not log when debug flag is disabled', () => {
      process.argv = ['node', 'tog', 'start']

      const error = new Error('Test error')
      command.testLogDebugError('Error occurred', error)
      expect(logToStderrStub.called).to.be.false
    })

    it('should log error details when debug flag is enabled', () => {
      process.argv = ['node', 'tog', 'start', '--debug']

      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at TestCommand.test'

      command.testLogDebugError('Operation failed', error)

      expect(logToStderrStub.called).to.be.true
      const output = logToStderrStub.getCall(0).args[0]
      expect(output).to.include('🔍 DEBUG: Operation failed')
      expect(output).to.include('Error: Test error')
      expect(output).to.include('Stack: Error: Test error')
    })

    it('should include sanitized data when provided', () => {
      process.argv = ['node', 'tog', 'start', '--debug']

      const error = new Error('API error')
      const data = { apiToken: 'secret123456789', endpoint: '/api/test' }

      command.testLogDebugError('API request failed', error, data)

      expect(logToStderrStub.called).to.be.true
      const calledWith = logToStderrStub.getCall(0).args[0]
      expect(calledWith).to.include('🔍 DEBUG: API request failed')
      expect(calledWith).to.include('Error: API error')
      expect(calledWith).to.include('Data: {"apiToken":"***6789","endpoint":"/api/test"}')
    })

    it('should handle error without stack trace', () => {
      process.argv = ['node', 'tog', 'start', '--debug']

      const error = new Error('Simple error')
      delete error.stack

      command.testLogDebugError('Error occurred', error)

      const output = logToStderrStub.getCall(0).args[0]
      expect(output).to.include('🔍 DEBUG: Error occurred')
      expect(output).to.include('Error: Simple error')
      expect(output).not.to.include('Stack:')
    })
  })

  describe('handleError integration', () => {
    it('should use debug logging when debug flag is enabled', () => {
      process.argv = ['node', 'tog', 'start', '--debug']

      const error = new Error('Test error')
      error.stack = String.raw`Error: Test error\n    at test`

      expect(() => {
        command.testHandleError(error, 'Test context', true)
      }).to.throw()

      // Should have called logDebugError
      expect(logToStderrStub.called).to.be.true
      expect(logToStderrStub.getCall(0).args[0]).to.include('🔍 DEBUG: Full error details')
      expect(logToStderrStub.getCall(0).args[0]).to.include('Error: Test error')
    })

    it('should not debug log when debug parameter is false', () => {
      process.argv = ['node', 'tog', 'start', '--debug']

      const error = new Error('Test error')

      expect(() => {
        command.testHandleError(error, 'Test context', false)
      }).to.throw()

      expect(logToStderrStub.called).to.be.false
    })

    it('should handle non-Error objects', () => {
      process.argv = ['node', 'tog', 'start', '--debug']

      const error = 'String error'

      expect(() => {
        command.testHandleError(error, 'Test context', true)
      }).to.throw()

      expect(logToStderrStub.called).to.be.true
      expect(logToStderrStub.getCall(0).args[0]).to.include('Error: String error')
    })
  })
})