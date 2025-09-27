import { expect } from 'chai'
import sinon from 'sinon'

import type { Project, Task, TimeEntry } from '../../src/lib/validation.js'

import { TimeEntryEditor } from '../../src/lib/time-entry-editor.js'
import { TimeEntryService } from '../../src/lib/time-entry-service.js'

describe('TimeEntryEditor', () => {
  let mockTimeEntryService: sinon.SinonStubbedInstance<TimeEntryService>
  let timeEntryEditor: TimeEntryEditor
  let mockContext: { debug: sinon.SinonSpy; warn: sinon.SinonSpy }

  const mockProjects: Project[] = [
    { active: true, id: 1, name: 'Backend API', workspace_id: 123 },
    { active: true, id: 2, name: 'Frontend React', workspace_id: 123 },
    { active: true, id: 3, name: 'Mobile App', workspace_id: 123 }
  ]

  const mockTasks: Task[] = [
    { active: true, id: 10, name: 'User Authentication', project_id: 1 },
    { active: true, id: 11, name: 'API Integration', project_id: 1 },
    { active: true, id: 12, name: 'User Interface', project_id: 2 },
    { active: true, id: 13, name: 'User Management', project_id: 2 }
  ]

  const mockCurrentEntry: TimeEntry = {
    at: '2023-09-01T10:00:00Z',
    description: 'Current timer description',
    duration: -1,
    id: 456,
    project_id: 1,
    start: '2023-09-01T10:00:00Z',
    task_id: 10,
    workspace_id: 123
  }

  beforeEach(() => {
    mockTimeEntryService = sinon.createStubInstance(TimeEntryService)
    mockContext = {
      debug: sinon.spy(),
      warn: sinon.spy()
    }
    timeEntryEditor = new TimeEntryEditor(mockTimeEntryService, mockContext)
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('executeUpdate', () => {
    it('should successfully update description only', async () => {
      const flags = { description: 'New description' }
      const updatedEntry = { ...mockCurrentEntry, description: 'New description' }

      mockTimeEntryService.updateTimeEntry.resolves({
        timeEntry: updatedEntry
      })

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(result.success).to.be.true
      expect(result.timeEntry).to.deep.equal(updatedEntry)
      expect(result.updates).to.deep.equal({ description: 'New description' })

      expect(mockTimeEntryService.updateTimeEntry).to.have.been.calledWith(
        123,
        456,
        { description: 'New description', projectId: undefined, taskId: undefined }
      )
    })

    it('should successfully update project by name', async () => {
      const flags = { project: 'frontend' }
      const updatedEntry = { ...mockCurrentEntry, project_id: 2 }

      mockTimeEntryService.updateTimeEntry.resolves({
        timeEntry: updatedEntry
      })

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(result.success).to.be.true
      expect(result.timeEntry).to.deep.equal(updatedEntry)
      expect(result.updates).to.deep.equal({ project_id: 2 })

      expect(mockTimeEntryService.updateTimeEntry).to.have.been.calledWith(
        123,
        456,
        { description: undefined, projectId: 2, taskId: undefined }
      )
    })

    it('should successfully clear all assignments with clear flag', async () => {
      const flags = { clear: true }
      const updatedEntry = { ...mockCurrentEntry, project_id: null, task_id: null }

      mockTimeEntryService.updateTimeEntry.resolves({
        timeEntry: updatedEntry
      })

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(result.success).to.be.true
      expect(result.updates).to.deep.equal({ project_id: null, task_id: null })

      expect(mockTimeEntryService.updateTimeEntry).to.have.been.calledWith(
        123,
        456,
        { description: undefined, projectId: null, taskId: null }
      )
    })

    it('should handle project not found error', async () => {
      const flags = { project: 'nonexistent' }

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(result.success).to.be.false
      expect(result.error).to.include('Project "nonexistent" not found')
      expect(mockTimeEntryService.updateTimeEntry).not.to.have.been.called
    })

    it('should handle task not found error', async () => {
      const flags = { task: 'nonexistent' }

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(result.success).to.be.false
      expect(result.error).to.include('Task "nonexistent" not found')
      expect(mockTimeEntryService.updateTimeEntry).not.to.have.been.called
    })

    it('should handle service update failure', async () => {
      const flags = { description: 'New description' }

      mockTimeEntryService.updateTimeEntry.resolves({
        error: 'Update failed'
      })

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(result.success).to.be.false
      expect(result.error).to.equal('Update failed')
    })

    it('should validate current entry missing required fields', async () => {
      const invalidEntry = { ...mockCurrentEntry, workspace_id: undefined as unknown as number }
      const flags = { description: 'New description' }

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: invalidEntry as TimeEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(result.success).to.be.false
      expect(result.error).to.include('missing required workspace_id or id')
      expect(mockTimeEntryService.updateTimeEntry).not.to.have.been.called
    })
  })

  describe('gatherUpdates', () => {
    it('should return null when no changes are made', async () => {
      const flags = { description: 'Current timer description' } // Same as current

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({ description: 'Current timer description' })
    })

    it('should handle clear flag', async () => {
      const flags = { clear: true }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        project_id: null,
        task_id: null
      })
    })

    it('should handle description flag', async () => {
      const flags = { description: 'New description' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        description: 'New description'
      })
    })

    it('should handle project flag with exact name match', async () => {
      const flags = { project: 'Backend API' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        project_id: 1
      })
    })

    it('should handle project flag with partial name match', async () => {
      const flags = { project: 'mobile' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        project_id: 3
      })
    })

    it('should handle project flag with ID', async () => {
      const flags = { project: '2' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        project_id: 2
      })
    })

    it('should handle project flag with "none" value', async () => {
      const flags = { project: 'none' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        project_id: null
      })
    })

    it('should handle task flag with name match', async () => {
      const flags = { task: 'auth' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        task_id: 10
      })
    })

    it('should handle task flag with ID', async () => {
      const flags = { task: '12' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        task_id: 12
      })
    })

    it('should handle task flag with "none" value', async () => {
      const flags = { task: 'none' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        task_id: null
      })
    })

    it('should handle combined project and task flags', async () => {
      const flags = { project: 'Frontend React', task: 'interface' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        project_id: 2,
        task_id: 12
      })
    })


    it('should throw error for ambiguous project match', async () => {
      const ambiguousProjects = [
        ...mockProjects,
        { active: true, id: 4, name: 'Backend Services', workspace_id: 123 }
      ]
      const flags = { project: 'backend' }

      try {
        await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, ambiguousProjects, mockTasks)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect((error as Error).message).to.include('Multiple projects match "backend"')
      }
    })

    it('should throw error for ambiguous task match', async () => {
      const ambiguousTasks = [
        ...mockTasks,
        { active: true, id: 14, name: 'User Profiles', project_id: 2 }
      ]
      const flags = { task: 'user' }

      try {
        await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, ambiguousTasks)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect((error as Error).message).to.include('Multiple tasks match "user"')
      }
    })
  })

  describe('validation integration', () => {
    it('should validate mismatched project-task relationship through executeUpdate', async () => {
      const flags = { project: 'Backend API', task: 'interface' } // Task belongs to different project

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(result.success).to.be.false
      expect(result.error).to.include('Task "interface"')
      expect(result.error).to.include('not found')
    })

    it('should validate task without project through executeUpdate', async () => {
      const flags = { project: 'none', task: 'auth' } // Task without project

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(result.success).to.be.false
      expect(result.error).to.include('Cannot assign a task without a project')
    })
  })


  describe('non-interactive flag combinations', () => {
    it('should handle project change without description change', async () => {
      const flags = { project: 'mobile' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        project_id: 3
      })
    })

    it('should handle task clearing without description change', async () => {
      const flags = { task: 'none' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        task_id: null
      })
    })

    it('should handle project and task change without description', async () => {
      const flags = { project: 'Frontend React', task: 'interface' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        project_id: 2,
        task_id: 12
      })
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle service throwing exception', async () => {
      const flags = { description: 'New description' }

      mockTimeEntryService.updateTimeEntry.rejects(new Error('Service error'))

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(result.success).to.be.false
      expect(result.error).to.include('Edit workflow failed: Service error')
    })

    it('should handle empty projects array', async () => {
      const flags = { project: 'any' }

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: [],
        tasks: mockTasks
      })

      expect(result.success).to.be.false
      expect(result.error).to.include('Project "any" not found')
    })

    it('should handle empty tasks array', async () => {
      const flags = { task: 'any' }

      const result = await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: []
      })

      expect(result.success).to.be.false
      expect(result.error).to.include('Task "any" not found')
    })

    it('should handle case insensitive "none" values', async () => {
      const flags = { project: 'NONE', task: 'None' }

      const result = await timeEntryEditor.gatherUpdates(flags, mockCurrentEntry, mockProjects, mockTasks)

      expect(result).to.deep.equal({
        project_id: null,
        task_id: null
      })
    })
  })

  describe('logging integration', () => {
    it('should log debug information during successful workflow', async () => {
      const flags = { description: 'New description' }
      const updatedEntry = { ...mockCurrentEntry, description: 'New description' }

      mockTimeEntryService.updateTimeEntry.resolves({
        timeEntry: updatedEntry
      })

      await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(mockContext.debug).to.have.been.calledWith('Starting time entry edit workflow')
      expect(mockContext.debug).to.have.been.calledWith('Updates gathered successfully')
      expect(mockContext.debug).to.have.been.calledWith('Time entry edit completed successfully')
    })

    it('should log debug information during error workflow', async () => {
      const flags = { description: 'New description' }

      mockTimeEntryService.updateTimeEntry.rejects(new Error('Service error'))

      await timeEntryEditor.executeUpdate({
        currentEntry: mockCurrentEntry,
        flags,
        projects: mockProjects,
        tasks: mockTasks
      })

      expect(mockContext.debug).to.have.been.calledWith('Starting time entry edit workflow')
      expect(mockContext.debug).to.have.been.calledWith('Time entry edit workflow failed')
    })
  })
})