import { expect } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import sinon, { type SinonStub } from 'sinon'

import type { TogglClient } from '../../src/lib/toggl-client.js'
import type { Project, Task } from '../../src/lib/validation.js'

import { ProjectService } from '../../src/lib/project-service.js'
import { TaskService } from '../../src/lib/task-service.js'

describe('TaskService', () => {
  let mockClient: sinon.SinonStubbedInstance<TogglClient>
  let mockContext: { debug: SinonStub; warn: SinonStub }
  let mockProjectService: sinon.SinonStubbedInstance<ProjectService>
  let taskService: TaskService

  const mockTasks: Task[] = [
    { active: true, id: 1, name: 'Backend Development', project_id: 10 },
    { active: true, id: 2, name: 'Frontend UI', project_id: 20 },
    { active: false, id: 3, name: 'Database Migration', project_id: 10 },
    { active: true, id: 4, name: 'Orphaned Task' },
    { active: true, id: 5, name: 'API Testing', project_id: 10 }
  ]

  const mockProjects: Project[] = [
    { active: true, id: 10, name: 'Backend API', workspace_id: 123 },
    { active: true, id: 20, name: 'Frontend React', workspace_id: 123 }
  ]

  beforeEach(() => {
    mockClient = {
      getProjects: sinon.stub(),
      getTasks: sinon.stub()
    } as unknown as sinon.SinonStubbedInstance<TogglClient>

    mockContext = {
      debug: sinon.stub(),
      warn: sinon.stub()
    }

    mockProjectService = {
      getProjects: sinon.stub(),
      validateProject: sinon.stub()
    } as unknown as sinon.SinonStubbedInstance<ProjectService>

    taskService = new TaskService(mockClient, mockContext, mockProjectService)
  })

  describe('static filterActiveTasks', () => {
    it('should filter active tasks', () => {
      const activeTasks = TaskService.filterActiveTasks(mockTasks)

      expect(activeTasks).to.have.length(4)
      expect(activeTasks.every(t => t.active === true)).to.be.true
    })

    it('should return empty array if no active tasks', () => {
      const inactiveTasks = mockTasks.map(t => ({ ...t, active: false }))
      const activeTasks = TaskService.filterActiveTasks(inactiveTasks)

      expect(activeTasks).to.deep.equal([])
    })
  })

  describe('static filterTasksByProject', () => {
    it('should filter tasks by project ID', () => {
      const projectTasks = TaskService.filterTasksByProject(mockTasks, 10)

      expect(projectTasks).to.have.length(3)
      expect(projectTasks.every(t => t.project_id === 10)).to.be.true
    })

    it('should return empty array if no tasks for project', () => {
      const projectTasks = TaskService.filterTasksByProject(mockTasks, 999)

      expect(projectTasks).to.deep.equal([])
    })
  })

  describe('static findTaskById', () => {
    it('should find task by ID', () => {
      const task = TaskService.findTaskById(mockTasks, 2)

      expect(task).to.deep.equal({ active: true, id: 2, name: 'Frontend UI', project_id: 20 })
    })

    it('should return null if task not found', () => {
      const task = TaskService.findTaskById(mockTasks, 999)

      expect(task).to.be.null
    })

    it('should handle empty array', () => {
      const task = TaskService.findTaskById([], 1)

      expect(task).to.be.null
    })
  })

  describe('static findTaskByNameOrId', () => {
    it('should find task by exact ID', () => {
      const task = TaskService.findTaskByNameOrId(mockTasks, '2')

      expect(task).to.deep.equal({ active: true, id: 2, name: 'Frontend UI', project_id: 20 })
    })

    it('should find task by partial name match', () => {
      const task = TaskService.findTaskByNameOrId(mockTasks, 'backend')

      expect(task).to.deep.equal({ active: true, id: 1, name: 'Backend Development', project_id: 10 })
    })

    it('should find task by exact name match', () => {
      const task = TaskService.findTaskByNameOrId(mockTasks, 'Frontend UI')

      expect(task).to.deep.equal({ active: true, id: 2, name: 'Frontend UI', project_id: 20 })
    })

    it('should return null if no match found', () => {
      const task = TaskService.findTaskByNameOrId(mockTasks, 'nonexistent')

      expect(task).to.be.null
    })

    it('should prefer exact name match over partial matches', () => {
      const tasks: Task[] = [
        { active: true, id: 1, name: 'Test', project_id: 10 },
        { active: true, id: 2, name: 'Test Task', project_id: 10 },
        { active: true, id: 3, name: 'Testing Framework', project_id: 10 }
      ]

      const task = TaskService.findTaskByNameOrId(tasks, 'test')

      expect(task).to.deep.equal({ active: true, id: 1, name: 'Test', project_id: 10 })
    })

    it('should throw error for ambiguous partial matches', () => {
      const tasks: Task[] = [
        { active: true, id: 1, name: 'Backend Service', project_id: 10 },
        { active: true, id: 2, name: 'Frontend Service', project_id: 10 }
      ]

      expect(() => TaskService.findTaskByNameOrId(tasks, 'service')).to.throw(
        'Multiple tasks match "service": Backend Service, Frontend Service. Please be more specific.'
      )
    })

    it('should handle case insensitive matching', () => {
      const task = TaskService.findTaskByNameOrId(mockTasks, 'BACKEND')

      expect(task).to.deep.equal({ active: true, id: 1, name: 'Backend Development', project_id: 10 })
    })

    it('should handle invalid ID strings', () => {
      const task = TaskService.findTaskByNameOrId(mockTasks, 'abc')

      expect(task).to.be.null
    })

    it('should filter by project ID when provided', () => {
      const task = TaskService.findTaskByNameOrId(mockTasks, 'backend', 10)

      expect(task).to.deep.equal({ active: true, id: 1, name: 'Backend Development', project_id: 10 })
    })

    it('should return null when filtering by project and no match', () => {
      const task = TaskService.findTaskByNameOrId(mockTasks, 'backend', 20)

      expect(task).to.be.null
    })

    it('should throw error when task ID belongs to different project', () => {
      expect(() => TaskService.findTaskByNameOrId(mockTasks, '1', 20)).to.throw(
        'Task "Backend Development" does not belong to the selected project'
      )
    })
  })

  describe('static getOrphanedTasks', () => {
    it('should return tasks without project assignment', () => {
      const orphanedTasks = TaskService.getOrphanedTasks(mockTasks)

      expect(orphanedTasks).to.have.length(1)
      expect(orphanedTasks[0]).to.deep.equal({ active: true, id: 4, name: 'Orphaned Task' })
    })

    it('should return empty array if no orphaned tasks', () => {
      const tasksWithProjects = mockTasks.filter(t => t.project_id)
      const orphanedTasks = TaskService.getOrphanedTasks(tasksWithProjects)

      expect(orphanedTasks).to.deep.equal([])
    })
  })

  describe('static getTasks', () => {
    it('should fetch tasks successfully', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const result = await TaskService.getTasks(mockClient, mockContext)

      expect(result).to.deep.equal(mockTasks)
      expect(mockContext.debug).to.have.been.calledWith('Fetching user tasks')
      expect(mockContext.debug).to.have.been.calledWith('Tasks fetched successfully', { count: 5 })
    })

    it('should return empty array on error', async () => {
      const error = new Error('Network error')
      mockClient.getTasks.rejects(error)

      const result = await TaskService.getTasks(mockClient, mockContext)

      expect(result).to.deep.equal([])
      expect(mockContext.debug).to.have.been.calledWith('Failed to fetch tasks', { error: 'Network error' })
      expect(mockContext.warn).to.have.been.calledWith('Failed to fetch tasks')
    })

    it('should work without context', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const result = await TaskService.getTasks(mockClient)

      expect(result).to.deep.equal(mockTasks)
    })
  })

  describe('static sortTasksByName', () => {
    it('should sort tasks alphabetically by name', () => {
      const sortedTasks = TaskService.sortTasksByName(mockTasks)
      expect(sortedTasks.map(t => t.name)).to.deep.equal([
        'API Testing',
        'Backend Development',
        'Database Migration',
        'Frontend UI',
        'Orphaned Task'
      ])
    })

    it('should not mutate the original array', () => {
      const originalOrder = mockTasks.map(t => t.name)
      TaskService.sortTasksByName(mockTasks)
      expect(mockTasks.map(t => t.name)).to.deep.equal(originalOrder)
    })

    it('should handle empty array', () => {
      const result = TaskService.sortTasksByName([])
      expect(result).to.deep.equal([])
    })
  })

  describe('static validateProjectTaskRelationship', () => {
    it('should validate matching project-task relationship', () => {
      const project = mockProjects[0]
      const task = mockTasks[0] // project_id: 10

      const result = TaskService.validateProjectTaskRelationship(project, task)

      expect(result.isValid).to.be.true
    })

    it('should invalidate mismatched project-task relationship', () => {
      const project = mockProjects[0] // id: 10
      const task = mockTasks[1] // project_id: 20

      const result = TaskService.validateProjectTaskRelationship(project, task)

      expect(result).to.deep.equal({
        error: 'Task "Frontend UI" does not belong to project "Backend API"',
        isValid: false
      })
    })

    it('should validate when no project provided', () => {
      const task = mockTasks[0]

      const result = TaskService.validateProjectTaskRelationship(undefined, task)

      expect(result).to.deep.equal({ isValid: true })
    })

    it('should validate when no task provided', () => {
      const project = mockProjects[0]

      const result = TaskService.validateProjectTaskRelationship(project)

      expect(result).to.deep.equal({ isValid: true })
    })

    it('should validate when neither project nor task provided', () => {
      const result = TaskService.validateProjectTaskRelationship()

      expect(result).to.deep.equal({ isValid: true })
    })
  })

  describe('instance findTaskByNameOrId', () => {
    it('should find task by name or ID using static method', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const result = await taskService.findTaskByNameOrId('backend')

      expect(result).to.deep.equal({ active: true, id: 1, name: 'Backend Development', project_id: 10 })
    })

    it('should handle project ID filtering', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const result = await taskService.findTaskByNameOrId('backend', 10)

      expect(result).to.deep.equal({ active: true, id: 1, name: 'Backend Development', project_id: 10 })
    })
  })

  describe('instance getTasks', () => {
    it('should fetch tasks using static method', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const result = await taskService.getTasks()

      expect(result).to.deep.equal(mockTasks)
      expect(mockContext.debug).to.have.been.calledWith('Fetching user tasks')
    })
  })

  describe('getTasksAndProjects', () => {
    it('should fetch tasks and projects together', async () => {
      mockClient.getTasks.resolves(mockTasks)
      mockProjectService.getProjects.resolves(mockProjects)

      const result = await taskService.getTasksAndProjects()

      expect(result.tasks).to.deep.equal(mockTasks)
      expect(result.projects).to.deep.equal(mockProjects)
      expect(result.error).to.be.undefined
      expect(mockContext.debug).to.have.been.calledWith('Fetching tasks and projects together')
      expect(mockContext.debug).to.have.been.calledWith('Tasks and projects fetched successfully', {
        projectCount: 2,
        taskCount: 5
      })
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('API error')
      mockClient.getTasks.rejects(error)
      mockProjectService.getProjects.resolves([])

      const result = await taskService.getTasksAndProjects()

      // Static TaskService.getTasks handles errors by returning empty array
      // So getTasksAndProjects should succeed with empty arrays
      expect(result.tasks).to.deep.equal([])
      expect(result.projects).to.deep.equal([])
      expect(result.error).to.be.undefined
    })
  })

  describe('getTasksForProject', () => {
    it('should return tasks for valid project', async () => {
      mockClient.getTasks.resolves(mockTasks)
      mockProjectService.validateProject.resolves({
        project: mockProjects[0],
        success: true
      })

      const result = await taskService.getTasksForProject(10)

      expect(result.tasks).to.have.length(3)
      expect(result.tasks.every(t => t.project_id === 10)).to.be.true
      expect(result.project).to.deep.equal(mockProjects[0])
      expect(result.error).to.be.undefined
    })

    it('should return error for invalid project', async () => {
      mockProjectService.validateProject.resolves({
        error: 'Project not found',
        success: false
      })

      const result = await taskService.getTasksForProject(999)

      expect(result.tasks).to.deep.equal([])
      expect(result.error).to.equal('Project not found')
    })
  })

  describe('getTaskStats', () => {
    it('should return task statistics', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const stats = await taskService.getTaskStats()

      expect(stats).to.deep.equal({
        active: 4,
        byProject: {
          10: 3,
          20: 1
        },
        inactive: 1,
        orphaned: 1,
        total: 5
      })
    })

    it('should handle empty tasks', async () => {
      mockClient.getTasks.resolves([])

      const stats = await taskService.getTaskStats()

      expect(stats).to.deep.equal({
        active: 0,
        byProject: {},
        inactive: 0,
        orphaned: 0,
        total: 0
      })
    })
  })

  describe('selectTask', () => {
    it('should select task successfully', async () => {
      mockClient.getTasks.resolves(mockTasks)
      mockProjectService.validateProject.resolves({
        project: mockProjects[0],
        success: true
      })

      const result = await taskService.selectTask('backend')

      expect(result).to.deep.equal({
        project: mockProjects[0],
        success: true,
        task: { active: true, id: 1, name: 'Backend Development', project_id: 10 }
      })
      expect(mockContext.debug).to.have.been.calledWith('Task selection successful', {
        projectId: 10,
        taskId: 1,
        taskName: 'Backend Development'
      })
    })

    it('should auto-select project from task', async () => {
      mockClient.getTasks.resolves(mockTasks)
      mockProjectService.validateProject.resolves({
        project: mockProjects[0],
        success: true
      })

      const result = await taskService.selectTask('backend')

      expect(result.project).to.deep.equal(mockProjects[0])
      expect(mockContext.debug).to.have.been.calledWith('Auto-selected project from task', {
        projectId: 10,
        projectName: 'Backend API'
      })
    })

    it('should fail selection for non-existent task', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const result = await taskService.selectTask('nonexistent')

      expect(result).to.deep.equal({
        error: 'Task "nonexistent" not found',
        success: false
      })
    })

    it('should filter by project when specified', async () => {
      mockClient.getTasks.resolves(mockTasks)
      mockProjectService.validateProject.resolves({
        project: mockProjects[1],
        success: true
      })

      const result = await taskService.selectTask('frontend', 20)

      expect(result.success).to.be.true
      expect(result.task?.name).to.equal('Frontend UI')
      expect(result.project).to.deep.equal(mockProjects[1])
    })

    it('should fail when task not in specified project', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const result = await taskService.selectTask('backend', 20)

      expect(result).to.deep.equal({
        error: 'Task "backend" in project 20 not found',
        success: false
      })
    })

    it('should handle errors during selection', async () => {
      const error = new Error('Selection error')
      mockClient.getTasks.rejects(error)

      const result = await taskService.selectTask('backend')

      expect(result.success).to.be.false
      expect(result.error).to.equal('Task "backend" not found')
    })

    it('should handle orphaned tasks without project', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const result = await taskService.selectTask('orphaned')

      expect(result).to.deep.equal({
        project: undefined,
        success: true,
        task: { active: true, id: 4, name: 'Orphaned Task' }
      })
    })
  })

  describe('validateTask', () => {
    it('should validate existing task successfully', async () => {
      mockClient.getTasks.resolves(mockTasks)
      mockProjectService.validateProject.resolves({
        project: mockProjects[0],
        success: true
      })

      const result = await taskService.validateTask(1)

      expect(result).to.deep.equal({
        project: mockProjects[0],
        success: true,
        task: { active: true, id: 1, name: 'Backend Development', project_id: 10 }
      })
      expect(mockContext.debug).to.have.been.calledWith('Task validation successful', {
        projectId: 10,
        taskId: 1,
        taskName: 'Backend Development'
      })
    })

    it('should fail validation for invalid task ID', async () => {
      const result = await taskService.validateTask(0)

      expect(result).to.deep.equal({
        error: 'Invalid task ID provided',
        success: false
      })
    })

    it('should fail validation for negative task ID', async () => {
      const result = await taskService.validateTask(-1)

      expect(result).to.deep.equal({
        error: 'Invalid task ID provided',
        success: false
      })
    })

    it('should fail validation for non-existent task', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const result = await taskService.validateTask(999)

      expect(result).to.deep.equal({
        error: 'Task with ID 999 not found or not accessible',
        success: false
      })
    })

    it('should validate project membership', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const result = await taskService.validateTask(1, 20)

      expect(result).to.deep.equal({
        error: 'Task "Backend Development" does not belong to the specified project',
        success: false
      })
    })

    it('should validate task without project', async () => {
      mockClient.getTasks.resolves(mockTasks)

      const result = await taskService.validateTask(4)

      expect(result).to.deep.equal({
        project: undefined,
        success: true,
        task: { active: true, id: 4, name: 'Orphaned Task' }
      })
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getTasks.rejects(error)

      const result = await taskService.validateTask(1)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Task with ID 1 not found or not accessible')
      expect(mockContext.debug).to.have.been.calledWith('Failed to fetch tasks', {
        error: 'API error'
      })
    })

    it('should handle project validation failure for task with project', async () => {
      mockClient.getTasks.resolves(mockTasks)
      mockProjectService.validateProject.resolves({
        error: 'Project validation failed',
        success: false
      })

      const result = await taskService.validateTask(1)

      expect(result).to.deep.equal({
        project: undefined,
        success: true,
        task: { active: true, id: 1, name: 'Backend Development', project_id: 10 }
      })
    })
  })

  describe('edge cases', () => {
    it('should handle tasks with same name in different projects', async () => {
      const duplicateTasks: Task[] = [
        { active: true, id: 1, name: 'Development', project_id: 10 },
        { active: true, id: 2, name: 'Development', project_id: 20 }
      ]
      mockClient.getTasks.resolves(duplicateTasks)
      mockProjectService.validateProject.resolves({
        project: mockProjects[1],
        success: true
      })

      const result = await taskService.selectTask('Development', 20)
      expect(result.success).to.be.true
      expect(result.task?.project_id).to.equal(20)
    })

    it('should handle null/undefined task names gracefully', () => {
      const tasksWithNulls: Task[] = [
        { active: true, id: 1, name: '', project_id: 10 }
      ]

      const result = TaskService.findTaskByNameOrId(tasksWithNulls, '')
      expect(result).to.deep.equal({ active: true, id: 1, name: '', project_id: 10 })
    })

    it('should handle tasks with undefined project_id in filtering', () => {
      const tasksWithUndefined = mockTasks.filter(t => !t.project_id)
      const filtered = TaskService.filterTasksByProject(tasksWithUndefined, 10)

      expect(filtered).to.have.length(0)
    })
  })
});