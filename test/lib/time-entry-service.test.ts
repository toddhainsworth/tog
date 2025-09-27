import { expect } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import sinon, { type SinonStub } from 'sinon'

import type { TogglClient } from '../../src/lib/toggl-client.js'
import type { Project, Task, TimeEntry } from '../../src/lib/validation.js'

import { ProjectService } from '../../src/lib/project-service.js'
import { TaskService } from '../../src/lib/task-service.js'
import { TimeEntryService } from '../../src/lib/time-entry-service.js'
import { WorkspaceService } from '../../src/lib/workspace-service.js'

describe('TimeEntryService', () => {
  // Mock WorkspaceService within the test suite
  const mockValidateWorkspace = sinon.stub()
  let workspaceStub: sinon.SinonStub
  let mockClient: sinon.SinonStubbedInstance<TogglClient>
  let mockContext: { debug: SinonStub; warn: SinonStub }
  let mockProjectService: sinon.SinonStubbedInstance<ProjectService>
  let mockTaskService: sinon.SinonStubbedInstance<TaskService>
  let timeEntryService: TimeEntryService

  const mockTimeEntries: TimeEntry[] = [
    {
      at: '2023-01-01T09:00:00Z',
      duration: 3600,
      id: 1,
      project_id: 10,
      start: '2023-01-01T09:00:00Z',
      stop: '2023-01-01T10:00:00Z',
      task_id: 100,
      workspace_id: 123
    },
    {
      at: '2023-01-01T14:00:00Z',
      duration: 1800,
      id: 2,
      project_id: 20,
      start: '2023-01-01T14:00:00Z',
      stop: '2023-01-01T14:30:00Z',
      workspace_id: 123
    },
    {
      at: '2023-01-02T09:00:00Z',
      duration: -1,
      id: 3,
      project_id: 10,
      start: '2023-01-02T09:00:00Z',
      workspace_id: 123
    }
  ]

  const mockProjects: Project[] = [
    { active: true, id: 10, name: 'Backend API', workspace_id: 123 },
    { active: true, id: 20, name: 'Frontend React', workspace_id: 123 }
  ]

  const mockTasks: Task[] = [
    { active: true, id: 100, name: 'Backend Development', project_id: 10 },
    { active: true, id: 200, name: 'Frontend UI', project_id: 20 }
  ]

  beforeEach(() => {
    // Set up WorkspaceService stub first
    if (!workspaceStub) {
      workspaceStub = sinon.stub(WorkspaceService, 'validateWorkspace')
    }

    workspaceStub.callsFake(mockValidateWorkspace)

    mockClient = {
      createTimeEntry: sinon.stub(),
      getCurrentTimeEntry: sinon.stub(),
      getMostRecentTimeEntry: sinon.stub(),
      getTimeEntries: sinon.stub(),
      searchTimeEntries: sinon.stub(),
      stopTimeEntry: sinon.stub(),
      updateTimeEntry: sinon.stub()
    } as unknown as sinon.SinonStubbedInstance<TogglClient>

    mockContext = {
      debug: sinon.stub(),
      warn: sinon.stub()
    }

    mockProjectService = {
      getProjects: sinon.stub(),
      validateProject: sinon.stub()
    } as unknown as sinon.SinonStubbedInstance<ProjectService>

    mockTaskService = {
      getTasks: sinon.stub(),
      validateTask: sinon.stub()
    } as unknown as sinon.SinonStubbedInstance<TaskService>

    // Reset the workspace service mock and set default success response
    mockValidateWorkspace.reset()
    mockValidateWorkspace.resolves({ success: true, workspace: { id: 123, name: 'Test Workspace' } })

    timeEntryService = new TimeEntryService(mockClient, mockContext, mockProjectService, mockTaskService)
  })

  describe('checkForRunningTimer', () => {
    it('should detect running timer', async () => {
      mockClient.getCurrentTimeEntry.resolves(mockTimeEntries[2]) // duration: -1

      const result = await timeEntryService.checkForRunningTimer()

      expect(result.hasRunningTimer).to.be.true
      expect(result.currentEntry).to.deep.equal(mockTimeEntries[2])
      expect(result.error).to.be.undefined
    })

    it('should detect no running timer when entry has stop time', async () => {
      mockClient.getCurrentTimeEntry.resolves(mockTimeEntries[0]) // has stop time

      const result = await timeEntryService.checkForRunningTimer()

      expect(result.hasRunningTimer).to.be.false
      expect(result.currentEntry).to.deep.equal(mockTimeEntries[0])
    })

    it('should detect no running timer when no entry exists', async () => {
      mockClient.getCurrentTimeEntry.resolves(null)

      const result = await timeEntryService.checkForRunningTimer()

      expect(result.hasRunningTimer).to.be.false
      expect(result.currentEntry).to.be.null
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getCurrentTimeEntry.rejects(error)

      const result = await timeEntryService.checkForRunningTimer()

      expect(result.hasRunningTimer).to.be.false
      expect(result.error).to.include('Failed to get current time entry')
    })
  })

  describe('createTimeEntry', () => {
    it('should create time entry successfully', async () => {
      const newEntry = mockTimeEntries[0]
      const options = {
        description: 'Test work',
        project: mockProjects[0],
        task: mockTasks[0],
        workspaceId: 123
      }

      mockValidateWorkspace.resolves({ success: true, workspace: { id: 123, name: 'Test Workspace' } })
      mockClient.createTimeEntry.resolves(newEntry)

      const result = await timeEntryService.createTimeEntry(options)

      expect(result.success).to.be.true
      expect(result.timeEntry).to.deep.equal(newEntry)
      expect(mockContext.debug).to.have.been.calledWith('Creating time entry')
      expect(mockContext.debug).to.have.been.calledWith('Time entry created successfully')
    })

    it('should fail with invalid workspace', async () => {
      const options = {
        description: 'Test work',
        workspaceId: 999
      }

      mockValidateWorkspace.resolves({ error: 'Workspace not found', success: false })

      const result = await timeEntryService.createTimeEntry(options)

      expect(result.success).to.be.false
      expect(result.error?.message).to.equal('Workspace not found')
    })

    it('should fail with invalid description', async () => {
      const options = {
        description: '',
        workspaceId: 123
      }

      mockValidateWorkspace.resolves({ success: true })

      const result = await timeEntryService.createTimeEntry(options)

      expect(result.success).to.be.false
      expect(result.error?.message).to.include('Description cannot be empty')
    })

    it('should handle project-task relationship validation', async () => {
      const options = {
        description: 'Test work',
        project: mockProjects[0], // project_id: 10
        task: mockTasks[1], // project_id: 20, mismatch
        workspaceId: 123
      }

      mockValidateWorkspace.resolves({ success: true })

      const result = await timeEntryService.createTimeEntry(options)

      expect(result.success).to.be.false
      expect(result.error?.message).to.include('does not belong to project')
    })

    it('should handle API errors during creation', async () => {
      const options = {
        description: 'Test work',
        workspaceId: 123
      }
      const error = new Error('Creation failed')

      mockValidateWorkspace.resolves({ success: true })
      mockClient.createTimeEntry.rejects(error)

      const result = await timeEntryService.createTimeEntry(options)

      expect(result.success).to.be.false
      expect(result.error?.message).to.include('Failed to create time entry')
    })
  })

  describe('getCurrentTimeEntry', () => {
    it('should return current time entry', async () => {
      mockClient.getCurrentTimeEntry.resolves(mockTimeEntries[2])

      const result = await timeEntryService.getCurrentTimeEntry()

      expect(result.timeEntry).to.deep.equal(mockTimeEntries[2])
      expect(result.error).to.be.undefined
    })

    it('should handle no current entry', async () => {
      mockClient.getCurrentTimeEntry.resolves(null)

      const result = await timeEntryService.getCurrentTimeEntry()

      expect(result.timeEntry).to.be.null
      expect(result.error).to.be.undefined
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getCurrentTimeEntry.rejects(error)

      const result = await timeEntryService.getCurrentTimeEntry()

      expect(result.timeEntry).to.be.null
      expect(result.error).to.include('Failed to get current time entry')
    })
  })

  describe('getMostRecentTimeEntry', () => {
    it('should return most recent entry', async () => {
      mockClient.getMostRecentTimeEntry.resolves(mockTimeEntries[0])

      const result = await timeEntryService.getMostRecentTimeEntry()

      expect(result.timeEntry).to.deep.equal(mockTimeEntries[0])
      expect(result.error).to.be.undefined
    })

    it('should handle no entries', async () => {
      mockClient.getMostRecentTimeEntry.resolves(null)

      const result = await timeEntryService.getMostRecentTimeEntry()

      expect(result.timeEntry).to.be.null
      expect(result.error).to.be.undefined
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getMostRecentTimeEntry.rejects(error)

      const result = await timeEntryService.getMostRecentTimeEntry()

      expect(result.error).to.include('Failed to get most recent time entry')
    })
  })

  describe('getTimeEntries', () => {
    it('should fetch time entries for date range', async () => {
      const startDate = '2023-01-01'
      const endDate = '2023-01-31'
      mockClient.getTimeEntries.resolves(mockTimeEntries)

      const result = await timeEntryService.getTimeEntries(startDate, endDate)

      expect(result.timeEntries).to.deep.equal(mockTimeEntries)
      expect(result.error).to.be.undefined
      expect(mockClient.getTimeEntries).to.have.been.calledWith(startDate, endDate)
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getTimeEntries.rejects(error)

      const result = await timeEntryService.getTimeEntries('2023-01-01', '2023-01-31')

      expect(result.timeEntries).to.deep.equal([])
      expect(result.error).to.include('Failed to get time entries')
    })
  })

  describe('getTimeEntryStats', () => {
    it('should calculate time entry statistics', async () => {
      mockClient.getTimeEntries.resolves(mockTimeEntries.filter(e => e.duration > 0)) // Only completed entries

      const result = await timeEntryService.getTimeEntryStats('2023-01-01', '2023-01-31')

      expect(result.error).to.be.undefined
      expect(result.totalDuration).to.equal(5400) // 3600 + 1800
      expect(result.totalEntries).to.equal(2)
      expect(result.byProject).to.deep.include({ 10: 3600, 20: 1800 })
    })

    it('should handle no entries', async () => {
      mockClient.getTimeEntries.resolves([])

      const result = await timeEntryService.getTimeEntryStats('2023-01-01', '2023-01-31')

      expect(result.error).to.be.undefined
      expect(result.totalDuration).to.equal(0)
      expect(result.totalEntries).to.equal(0)
    })

    it('should handle API errors', async () => {
      const error = new Error('Stats error')
      mockClient.getTimeEntries.rejects(error)

      const result = await timeEntryService.getTimeEntryStats('2023-01-01', '2023-01-31')

      expect(result.error).to.include('Failed to get time entry statistics')
    })
  })

  describe('searchTimeEntries', () => {
    it('should search time entries', async () => {
      const options = {
        description: 'test',
        pageSize: 10,
        workspaceId: 123
      }
      mockValidateWorkspace.resolves({ success: true })
      mockClient.searchTimeEntries.resolves(mockTimeEntries)

      const result = await timeEntryService.searchTimeEntries(options)

      expect(result.timeEntries).to.deep.equal(mockTimeEntries)
      expect(result.error).to.be.undefined
    })

    it('should handle search errors', async () => {
      const options = { workspaceId: 123 }
      const error = new Error('Search error')
      mockClient.getTimeEntries.rejects(error)

      const result = await timeEntryService.searchTimeEntries(options)

      expect(result.timeEntries).to.deep.equal([])
      expect(result.error).to.include('Failed to search time entries')
    })
  })

  describe('stopTimeEntry', () => {
    it('should stop running time entry', async () => {
      mockClient.stopTimeEntry.resolves(true)
      mockValidateWorkspace.resolves({ success: true })

      const result = await timeEntryService.stopTimeEntry(123, 3)

      expect(result.success).to.be.true
      expect(mockContext.debug).to.have.been.calledWith('Stopping time entry')
    })

    it('should handle stop errors', async () => {
      const error = new Error('Stop error')
      mockValidateWorkspace.resolves({ success: true })
      mockClient.stopTimeEntry.rejects(error)

      const result = await timeEntryService.stopTimeEntry(123, 3)

      expect(result.success).to.be.false
      expect(result.error).to.include('Failed to stop time entry')
    })
  })

  describe('updateTimeEntry', () => {
    it('should update time entry successfully', async () => {
      const updatedEntry = {
        ...mockTimeEntries[0],
        at: mockTimeEntries[0]?.at || '2023-01-01T09:00:00Z',
        description: 'Updated work',
        duration: mockTimeEntries[0]?.duration || 3600,
        id: mockTimeEntries[0]?.id || 1,
        start: mockTimeEntries[0]?.start || '2023-01-01T09:00:00Z',
        workspace_id: mockTimeEntries[0]?.workspace_id || 123
      }
      const workspaceId = 123
      const entryId = 1
      const updates = { description: 'Updated work' }

      mockValidateWorkspace.resolves({ success: true })
      mockClient.updateTimeEntry.resolves(updatedEntry)

      const result = await timeEntryService.updateTimeEntry(workspaceId, entryId, updates)

      expect(result.timeEntry).to.deep.equal(updatedEntry)
      expect(mockContext.debug).to.have.been.calledWith('Updating time entry')
    })

    it('should handle update errors', async () => {
      const error = new Error('Update error')
      mockClient.updateTimeEntry.rejects(error)

      const result = await timeEntryService.updateTimeEntry(123, 1, { description: 'test' })

      expect(result.error).to.include('Failed to update time entry')
    })
  })

  describe('validateDescription', () => {
    it('should validate valid description', () => {
      const result = timeEntryService.validateDescription('Valid description')

      expect(result.isValid).to.be.true
      expect(result.error).to.be.undefined
    })

    it('should reject empty description', () => {
      const result = timeEntryService.validateDescription('')

      expect(result.isValid).to.be.false
      expect(result.error).to.include('Description cannot be empty')
    })

    it('should reject whitespace-only description', () => {
      const result = timeEntryService.validateDescription('   ')

      expect(result.isValid).to.be.false
      expect(result.error).to.include('Description cannot be empty')
    })

    it('should reject overly long description', () => {
      const longDescription = 'a'.repeat(5001) // Assuming 5000 char limit
      const result = timeEntryService.validateDescription(longDescription)

      expect(result.isValid).to.be.false
      expect(result.error).to.include('Description is too long')
    })
  })

  describe('edge cases', () => {
    it('should handle malformed time entries', async () => {
      const malformedEntries = [
        { ...mockTimeEntries[0], duration: 0 } as TimeEntry
      ]
      mockClient.getTimeEntries.resolves(malformedEntries)

      const result = await timeEntryService.getTimeEntries('2023-01-01', '2023-01-31')

      expect(result.timeEntries).to.deep.equal(malformedEntries)
    })

    it('should handle concurrent timer creation', async () => {
      const options = {
        description: 'Concurrent test',
        workspaceId: 123
      }

      mockValidateWorkspace.resolves({ success: true })
      mockClient.createTimeEntry.rejects(new Error('Timer already running'))

      const result = await timeEntryService.createTimeEntry(options)

      expect(result.success).to.be.false
      expect(result.error?.message).to.include('Failed to create time entry')
    })
  })

  after(() => {
    // Restore the WorkspaceService stub
    if (workspaceStub) {
      workspaceStub.restore()
    }
  })
});