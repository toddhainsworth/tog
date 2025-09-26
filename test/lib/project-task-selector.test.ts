import { expect } from 'chai'

import type { Project, Task } from '../../src/lib/validation.js'

import { ProjectTaskSelector } from '../../src/lib/project-task-selector.js'
import { isError, MockData } from '../helpers/test-utilities.js'

describe('ProjectTaskSelector', () => {
  const mockProjects: Project[] = [
    MockData.project({ id: 1, name: 'Backend API', workspace_id: 123 }),
    MockData.project({ id: 2, name: 'Frontend React', workspace_id: 123 }),
    MockData.project({ id: 3, name: 'Mobile App', workspace_id: 123 }),
    MockData.project({ id: 4, name: 'Backend Services', workspace_id: 123 }),
  ]

  const mockTasks: Task[] = [
    MockData.task({ id: 10, name: 'User Authentication', project_id: 1 }),
    MockData.task({ id: 11, name: 'API Integration', project_id: 1 }),
    MockData.task({ id: 12, name: 'User Interface', project_id: 2 }),
    MockData.task({ id: 13, name: 'User Management', project_id: 2 }),
  ]

  let selector: ProjectTaskSelector

  beforeEach(() => {
    selector = new ProjectTaskSelector(mockProjects, mockTasks)
  })

  describe('findProjectByNameOrId', () => {
    it('should find project by exact ID', () => {
      const result = selector.findProjectByNameOrId('2')
      expect(result).to.deep.equal(mockProjects[1])
    })

    it('should find project by exact name (case insensitive)', () => {
      const result = selector.findProjectByNameOrId('mobile app')
      expect(result).to.deep.equal(mockProjects[2])
    })

    it('should find project by partial name match', () => {
      const result = selector.findProjectByNameOrId('frontend')
      expect(result).to.deep.equal(mockProjects[1])
    })

    it('should prefer exact match over partial match', () => {
      const projects = [
        ...mockProjects,
        { active: true, id: 5, name: 'Backend', workspace_id: 123 }
      ]
      const selectorWithExact = new ProjectTaskSelector(projects, mockTasks)
      const result = selectorWithExact.findProjectByNameOrId('backend')
      expect(result!.name).to.equal('Backend') // Exact match, not "Backend API"
    })

    it('should return null for non-existent project', () => {
      const result = selector.findProjectByNameOrId('nonexistent')
      expect(result).to.be.null
    })

    it('should return null for non-existent ID', () => {
      const result = selector.findProjectByNameOrId('999')
      expect(result).to.be.null
    })

    it('should throw error for ambiguous partial matches', () => {
      expect(() => {
        selector.findProjectByNameOrId('backend')
      }).to.throw('Multiple projects match "backend": Backend API, Backend Services. Please be more specific.')
    })

    it('should handle case-insensitive exact matches', () => {
      const result = selector.findProjectByNameOrId('FRONTEND REACT')
      expect(result).to.deep.equal(mockProjects[1])
    })
  })

  describe('findTaskByNameOrId', () => {
    it('should find task by exact ID', () => {
      const result = selector.findTaskByNameOrId('11')
      expect(result).to.deep.equal(mockTasks[1])
    })

    it('should find task by exact name (case insensitive)', () => {
      const result = selector.findTaskByNameOrId('user interface')
      expect(result).to.deep.equal(mockTasks[2])
    })

    it('should find task by partial name match', () => {
      const result = selector.findTaskByNameOrId('api')
      expect(result).to.deep.equal(mockTasks[1])
    })

    it('should filter by project ID when provided', () => {
      const result = selector.findTaskByNameOrId('interface', 2)
      expect(result!.name).to.equal('User Interface') // Should find task in project 2
    })

    it('should throw error if task does not belong to specified project', () => {
      expect(() => {
        selector.findTaskByNameOrId('10', 2) // Task 10 belongs to project 1
      }).to.throw('Task "User Authentication" does not belong to the selected project')
    })

    it('should return null for non-existent task', () => {
      const result = selector.findTaskByNameOrId('nonexistent')
      expect(result).to.be.null
    })

    it('should return null for non-existent ID', () => {
      const result = selector.findTaskByNameOrId('999')
      expect(result).to.be.null
    })

    it('should throw error for ambiguous partial matches', () => {
      expect(() => {
        selector.findTaskByNameOrId('user')
      }).to.throw('Multiple tasks match "user": User Authentication, User Interface, User Management. Please be more specific.')
    })

    it('should prefer exact match over partial match', () => {
      const tasks = [
        ...mockTasks,
        { active: true, id: 14, name: 'API', project_id: 1 }
      ]
      const selectorWithExact = new ProjectTaskSelector(mockProjects, tasks)
      const result = selectorWithExact.findTaskByNameOrId('api')
      expect(result!.name).to.equal('API') // Exact match, not "API Integration"
    })

    it('should handle project filtering with no matches', () => {
      const result = selector.findTaskByNameOrId('authentication', 2)
      expect(result).to.be.null // No tasks containing "authentication" in project 2
    })

    it('should handle empty task list', () => {
      const emptySelector = new ProjectTaskSelector(mockProjects, [])
      const result = emptySelector.findTaskByNameOrId('anything')
      expect(result).to.be.null
    })
  })

  describe('findProjectById', () => {
    it('should find project by ID', () => {
      const result = selector.findProjectById(2)
      expect(result).to.deep.equal(mockProjects[1])
    })

    it('should return undefined for non-existent ID', () => {
      const result = selector.findProjectById(999)
      expect(result).to.be.undefined
    })
  })

  describe('selectProjectByFlag', () => {
    it('should select project successfully', async () => {
      const result = await selector.selectProjectByFlag('Backend API')
      expect(result).to.deep.equal(mockProjects[0])
    })

    it('should throw error for non-existent project', async () => {
      try {
        await selector.selectProjectByFlag('nonexistent')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(isError(error) && error.message).to.include('Project "nonexistent" not found')
      }
    })

    it('should throw error for ambiguous matches', async () => {
      try {
        await selector.selectProjectByFlag('backend')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(isError(error) && error.message).to.include('Multiple projects match "backend"')
      }
    })
  })

  describe('selectTaskByFlag', () => {
    it('should select task successfully', async () => {
      const result = await selector.selectTaskByFlag('User Authentication')
      expect(result).to.deep.equal({
        project: mockProjects[0], // Auto-selected based on task's project_id
        task: mockTasks[0]
      })
    })

    it('should respect selected project constraint', async () => {
      const selectedProject = mockProjects[1] // Frontend React
      const result = await selector.selectTaskByFlag('User Interface', selectedProject)
      expect(result).to.deep.equal({
        project: selectedProject,
        task: mockTasks[2]
      })
    })

    it('should throw error for task not in selected project', async () => {
      const selectedProject = mockProjects[1] // Frontend React
      try {
        await selector.selectTaskByFlag('User Authentication', selectedProject)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(isError(error) && error.message).to.include('in project "Frontend React" not found')
      }
    })

    it('should throw error for non-existent task', async () => {
      try {
        await selector.selectTaskByFlag('nonexistent')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(isError(error) && error.message).to.include('Task "nonexistent" not found')
      }
    })

    it('should auto-select project from task when no project provided', async () => {
      const result = await selector.selectTaskByFlag('API Integration')
      expect(result).to.deep.equal({
        project: mockProjects[0], // Auto-selected Backend API
        task: mockTasks[1]
      })
    })
  })

  describe('selectInteractively', () => {
    // Note: Skipping interactive tests due to ESM stubbing complexity

    it.skip('should handle interactive selection successfully', async () => {
      // Skipped due to ESM stubbing issues
    })

    it.skip('should handle selection with only project', async () => {
      // Skipped due to ESM stubbing issues
    })

    it.skip('should handle selection with only task', async () => {
      // Skipped due to ESM stubbing issues
    })

    it.skip('should propagate prompt errors', async () => {
      // Skipped due to ESM stubbing issues
    })
  })

  describe('selectProjectAndTask', () => {

    it('should handle project flag only', async () => {
      const result = await selector.selectProjectAndTask({ project: 'Backend API' })
      expect(result).to.deep.equal({
        selectedProject: mockProjects[0],
        selectedTask: undefined
      })
    })

    it('should handle task flag only', async () => {
      const result = await selector.selectProjectAndTask({ task: 'User Authentication' })
      expect(result).to.deep.equal({
        selectedProject: mockProjects[0], // Auto-selected
        selectedTask: mockTasks[0]
      })
    })

    it('should handle both project and task flags', async () => {
      const result = await selector.selectProjectAndTask({
        project: 'Frontend React',
        task: 'User Interface'
      })
      expect(result).to.deep.equal({
        selectedProject: mockProjects[1],
        selectedTask: mockTasks[2]
      })
    })

    it.skip('should use interactive selection when no flags provided', async () => {
      // Skipped due to ESM stubbing issues
    })

    it('should return empty result when project lookup fails', async () => {
      const result = await selector.selectProjectAndTask({ project: 'nonexistent' })
      expect(result).to.deep.equal({})
    })

    it('should return empty result when task lookup fails', async () => {
      const result = await selector.selectProjectAndTask({ task: 'nonexistent' })
      expect(result).to.deep.equal({})
    })

    it('should skip interactive selection when no tasks/projects available', async () => {
      const emptySelector = new ProjectTaskSelector([], [])
      const result = await emptySelector.selectProjectAndTask({})
      expect(result).to.deep.equal({})

      // Should not have called prompt (skipped due to ESM stubbing issues)
    })
  })
})