import { expect } from 'chai'
import { match, restore, type SinonStub, type SinonStubbedInstance, stub } from 'sinon'

import type { TogglConfig } from '../../src/lib/config.js'
import type { TogglClient } from '../../src/lib/toggl-client.js'

import * as prompts from '../../src/lib/prompts.js'
import { TimerService } from '../../src/lib/timer-service.js'
import { createMockTogglClient, isError, MockData } from '../helpers/test-utilities.js'

describe('TimerService', () => {
  let mockClient: SinonStubbedInstance<TogglClient>
  let mockConfig: TogglConfig
  let withSpinnerStub: SinonStub

  const mockProject = MockData.project()
  const mockTask = MockData.task()
  const mockTimeEntry = MockData.timeEntry()

  beforeEach(() => {
    mockClient = createMockTogglClient()

    mockConfig = {
      apiToken: 'test-token',
      workspaceId: 123
    }

    withSpinnerStub = stub(prompts, 'withSpinner')
  })

  afterEach(() => {
    restore()
  })

  describe('checkForRunningTimer', () => {
    it('should return false when no timer is running', async () => {
      mockClient.getCurrentTimeEntry.resolves(null)

      const result = await TimerService.checkForRunningTimer(mockClient)

      expect(result).to.deep.equal({
        currentEntry: null,
        hasRunningTimer: false
      })
    })

    it('should return true when timer is running', async () => {
      const runningEntry = { ...mockTimeEntry, stop: null }
      mockClient.getCurrentTimeEntry.resolves(runningEntry)

      const result = await TimerService.checkForRunningTimer(mockClient)

      expect(result).to.deep.equal({
        currentEntry: runningEntry,
        hasRunningTimer: true
      })
    })

    it('should throw error when API call fails', async () => {
      mockClient.getCurrentTimeEntry.rejects(new Error('API Error'))

      try {
        await TimerService.checkForRunningTimer(mockClient)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(isError(error) && error.message).to.include('Failed to check current timer')
      }
    })
  })

  describe('createTimer', () => {
    it('should create timer successfully with minimal data', async () => {
      const expectedData = {
        created_with: 'tog-cli',
        description: 'Test timer',
        duration: -1,
        start: match.string,
        workspace_id: 123
      }

      mockClient.createTimeEntry.resolves(mockTimeEntry)
      withSpinnerStub.callsFake(async (_, fn, __) => fn())

      const result = await TimerService.createTimer({
        client: mockClient,
        config: mockConfig,
        description: 'Test timer'
      }, { log() {} })

      expect(result.success).to.be.true
      expect(result.timeEntry).to.equal(mockTimeEntry)
      expect(mockClient.createTimeEntry).to.have.been.calledWith(123, expectedData)
    })

    it('should create timer with project and task', async () => {
      const expectedData = {
        created_with: 'tog-cli',
        description: 'Test timer',
        duration: -1,
        project_id: 1,
        start: match.string,
        task_id: 10,
        workspace_id: 123
      }

      mockClient.createTimeEntry.resolves(mockTimeEntry)
      withSpinnerStub.callsFake(async (_, fn, __) => fn())

      const result = await TimerService.createTimer({
        client: mockClient,
        config: mockConfig,
        description: 'Test timer',
        selectedProject: mockProject,
        selectedTask: mockTask
      }, { log() {} })

      expect(result.success).to.be.true
      expect(mockClient.createTimeEntry).to.have.been.calledWith(123, expectedData)
    })

    it('should create timer with project only', async () => {
      const expectedData = {
        created_with: 'tog-cli',
        description: 'Test timer',
        duration: -1,
        project_id: 1,
        start: match.string,
        workspace_id: 123
      }

      mockClient.createTimeEntry.resolves(mockTimeEntry)
      withSpinnerStub.callsFake(async (_, fn, __) => fn())

      const result = await TimerService.createTimer({
        client: mockClient,
        config: mockConfig,
        description: 'Test timer',
        selectedProject: mockProject
      }, { log() {} })

      expect(result.success).to.be.true
      expect(mockClient.createTimeEntry).to.have.been.calledWith(123, expectedData)
    })

    it('should return failure when API returns null', async () => {
      mockClient.createTimeEntry.resolves(null)
      withSpinnerStub.callsFake(async (_, fn, __) => fn())

      const result = await TimerService.createTimer({
        client: mockClient,
        config: mockConfig,
        description: 'Test timer'
      }, { log() {} })

      expect(result.success).to.be.false
      expect(result.error?.message).to.equal('Failed to start timer. Please try again.')
    })

    it('should handle API errors gracefully', async () => {
      mockClient.createTimeEntry.rejects(new Error('API Error'))
      withSpinnerStub.callsFake(async (_, fn, __) => fn())

      const result = await TimerService.createTimer({
        client: mockClient,
        config: mockConfig,
        description: 'Test timer'
      }, { log() {} })

      expect(result.success).to.be.false
      expect(result.error?.message).to.equal('API Error')
    })

    it('should handle non-Error exceptions', async () => {
      mockClient.createTimeEntry.rejects('String error')
      withSpinnerStub.callsFake(async (_, fn, __) => fn())

      const result = await TimerService.createTimer({
        client: mockClient,
        config: mockConfig,
        description: 'Test timer'
      }, { log() {} })

      expect(result.success).to.be.false
      expect(result.error?.message).to.equal('Unknown error occurred during timer creation')
    })
  })

  describe('fetchTasksAndProjects', () => {
    it('should fetch tasks and projects successfully', async () => {
      const mockTasks = [mockTask]
      const mockProjects = [mockProject]

      mockClient.getTasks.resolves(mockTasks)
      mockClient.getProjects.resolves(mockProjects)
      withSpinnerStub.callsFake(async (_, fn, __) => fn())

      const result = await TimerService.fetchTasksAndProjects(mockClient, { log() {} })

      expect(result).to.deep.equal({
        projects: mockProjects,
        tasks: mockTasks
      })
    })

    it('should handle API errors', async () => {
      mockClient.getTasks.rejects(new Error('API Error'))
      withSpinnerStub.callsFake(async (_, fn, __) => fn())

      try {
        await TimerService.fetchTasksAndProjects(mockClient, { log() {} })
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(isError(error) && error.message).to.include('Failed to fetch tasks/projects')
      }
    })
  })

  describe('validateDescription', () => {
    it('should accept valid description', () => {
      const result = TimerService.validateDescription('Valid description')
      expect(result.isValid).to.be.true
    })

    it('should reject empty description', () => {
      const result = TimerService.validateDescription('')
      expect(result.isValid).to.be.false
      expect(result.error).to.equal('Timer description cannot be empty')
    })

    it('should reject whitespace-only description', () => {
      const result = TimerService.validateDescription('   ')
      expect(result.isValid).to.be.false
      expect(result.error).to.equal('Timer description cannot be empty')
    })

    it('should reject description that is too long', () => {
      const longDescription = 'a'.repeat(501)
      const result = TimerService.validateDescription(longDescription)
      expect(result.isValid).to.be.false
      expect(result.error).to.equal('Timer description cannot exceed 500 characters')
    })

    it('should accept description at character limit', () => {
      const maxDescription = 'a'.repeat(500)
      const result = TimerService.validateDescription(maxDescription)
      expect(result.isValid).to.be.true
    })
  })

  describe('validateProjectTaskRelationship', () => {
    it('should accept no project or task', () => {
      const result = TimerService.validateProjectTaskRelationship()
      expect(result.isValid).to.be.true
    })

    it('should accept project without task', () => {
      const result = TimerService.validateProjectTaskRelationship(mockProject)
      expect(result.isValid).to.be.true
    })

    it('should accept task without project', () => {
      const result = TimerService.validateProjectTaskRelationship(undefined, mockTask)
      expect(result.isValid).to.be.true
    })

    it('should accept matching project and task', () => {
      const result = TimerService.validateProjectTaskRelationship(mockProject, mockTask)
      expect(result.isValid).to.be.true
    })

    it('should reject mismatched project and task', () => {
      const differentProject = { ...mockProject, id: 2 }
      const result = TimerService.validateProjectTaskRelationship(differentProject, mockTask)
      expect(result.isValid).to.be.false
      expect(result.error).to.equal('Task "Test Task" does not belong to project "Test Project"')
    })
  })

  describe('validateWorkspaceConfig', () => {
    it('should accept valid workspace config', () => {
      const result = TimerService.validateWorkspaceConfig(mockConfig)
      expect(result.isValid).to.be.true
    })

    it('should reject config without workspace ID', () => {
      const invalidConfig = { ...mockConfig, workspaceId: undefined as never }
      const result = TimerService.validateWorkspaceConfig(invalidConfig)
      expect(result.isValid).to.be.false
      expect(result.error).to.equal('Workspace ID is missing from configuration')
    })
  })

  describe('validateTimerCreation', () => {
    const validOptions = {
      client: mockClient,
      config: mockConfig,
      description: 'Valid description',
      selectedProject: mockProject,
      selectedTask: mockTask
    }

    it('should accept all valid parameters', () => {
      const result = TimerService.validateTimerCreation(validOptions)
      expect(result.isValid).to.be.true
    })

    it('should reject invalid workspace config', () => {
      const options = {
        ...validOptions,
        config: { ...mockConfig, workspaceId: undefined as never }
      }
      const result = TimerService.validateTimerCreation(options)
      expect(result.isValid).to.be.false
      expect(result.error).to.equal('Workspace ID is missing from configuration')
    })

    it('should reject invalid description', () => {
      const options = { ...validOptions, description: '' }
      const result = TimerService.validateTimerCreation(options)
      expect(result.isValid).to.be.false
      expect(result.error).to.equal('Timer description cannot be empty')
    })

    it('should reject mismatched project and task', () => {
      const differentProject = { ...mockProject, id: 2 }
      const options = { ...validOptions, selectedProject: differentProject }
      const result = TimerService.validateTimerCreation(options)
      expect(result.isValid).to.be.false
      expect(result.error).to.equal('Task "Test Task" does not belong to project "Test Project"')
    })
  })
})