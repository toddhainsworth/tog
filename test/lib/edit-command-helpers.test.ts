import {expect} from 'chai'

import type {Project, Task} from '../../src/lib/validation.js'

// Helper functions extracted for testing (same as start command)
function findProjectByNameOrId(projects: Project[], input: string): null | Project {
  const id = Number.parseInt(input, 10)
  if (!Number.isNaN(id)) {
    return projects.find(p => p.id === id) || null
  }

  const lowercaseInput = input.toLowerCase()
  const matches = projects.filter(p =>
    p.name.toLowerCase().includes(lowercaseInput)
  )

  if (matches.length === 0) {
    return null
  }

  if (matches.length === 1) {
    return matches[0]
  }

  const exactMatch = matches.find(p =>
    p.name.toLowerCase() === lowercaseInput
  )
  if (exactMatch) {
    return exactMatch
  }

  const names = matches.map(p => p.name).join(', ')
  throw new Error(`Multiple projects match "${input}": ${names}. Please be more specific.`)
}

function findTaskByNameOrId(tasks: Task[], input: string, projectId?: number): null | Task {
  const id = Number.parseInt(input, 10)
  if (!Number.isNaN(id)) {
    const task = tasks.find(t => t.id === id)
    if (task && projectId !== undefined && task.project_id !== projectId) {
      throw new Error(`Task "${task.name}" does not belong to the selected project`)
    }

    return task || null
  }

  const relevantTasks = projectId === undefined
    ? tasks
    : tasks.filter(t => t.project_id === projectId)

  const lowercaseInput = input.toLowerCase()
  const matches = relevantTasks.filter(t =>
    t.name.toLowerCase().includes(lowercaseInput)
  )

  if (matches.length === 0) {
    return null
  }

  if (matches.length === 1) {
    return matches[0]
  }

  const exactMatch = matches.find(t =>
    t.name.toLowerCase() === lowercaseInput
  )
  if (exactMatch) {
    return exactMatch
  }

  const names = matches.map(t => t.name).join(', ')
  throw new Error(`Multiple tasks match "${input}": ${names}. Please be more specific.`)
}

// Test update payload building logic
function buildUpdatePayload(updates: {
  description?: string;
  project_id?: null | number;
  task_id?: null | number;
}): {description?: string; project_id?: null | number; task_id?: null | number} {
  const payload: {description?: string; project_id?: null | number; task_id?: null | number} = {}

  if (updates.description !== undefined) {
    payload.description = updates.description
  }

  if (updates.project_id !== undefined) {
    payload.project_id = updates.project_id
  }

  if (updates.task_id !== undefined) {
    payload.task_id = updates.task_id
  }

  return payload
}

// Test clear flag logic
function applyClearFlag(flags: {clear?: boolean}): {project_id?: null | number; task_id?: null | number} {
  if (flags.clear) {
    return {project_id: null, task_id: null}
  }

  return {}
}

// Test "none" string handling
function handleNoneValue(input: string): null | number | undefined {
  if (input.toLowerCase() === 'none') {
    return null
  }

  return undefined // Indicates no change
}

describe('Edit command helper functions', () => {
  describe('findProjectByNameOrId (reused from start)', () => {
    const mockProjects: Project[] = [
      {active: true, id: 1, name: 'Backend API', workspace_id: 123},
      {active: true, id: 2, name: 'Frontend React', workspace_id: 123},
      {active: true, id: 3, name: 'Mobile App', workspace_id: 123},
      {active: true, id: 4, name: 'Backend Services', workspace_id: 123},
    ]

    it('should find project by exact ID', () => {
      const result = findProjectByNameOrId(mockProjects, '2')
      expect(result).to.deep.equal(mockProjects[1])
    })

    it('should find project by exact name (case insensitive)', () => {
      const result = findProjectByNameOrId(mockProjects, 'mobile app')
      expect(result).to.deep.equal(mockProjects[2])
    })

    it('should return null for non-existent project', () => {
      const result = findProjectByNameOrId(mockProjects, 'nonexistent')
      expect(result).to.be.null
    })

    it('should throw error for ambiguous partial matches', () => {
      expect(() => {
        findProjectByNameOrId(mockProjects, 'backend')
      }).to.throw('Multiple projects match "backend": Backend API, Backend Services. Please be more specific.')
    })
  })

  describe('findTaskByNameOrId (reused from start)', () => {
    const mockTasks: Task[] = [
      {active: true, id: 10, name: 'User Authentication', project_id: 1},
      {active: true, id: 11, name: 'API Integration', project_id: 1},
      {active: true, id: 12, name: 'User Interface', project_id: 2},
      {active: true, id: 13, name: 'User Management', project_id: 2},
    ]

    it('should find task by exact ID', () => {
      const result = findTaskByNameOrId(mockTasks, '11')
      expect(result).to.deep.equal(mockTasks[1])
    })

    it('should filter by project ID when provided', () => {
      const result = findTaskByNameOrId(mockTasks, 'interface', 2)
      expect(result!.name).to.equal('User Interface')
    })

    it('should throw error if task does not belong to specified project', () => {
      expect(() => {
        findTaskByNameOrId(mockTasks, '10', 2) // Task 10 belongs to project 1
      }).to.throw('Task "User Authentication" does not belong to the selected project')
    })

    it('should return null for non-existent task', () => {
      const result = findTaskByNameOrId(mockTasks, 'nonexistent')
      expect(result).to.be.null
    })
  })

  describe('buildUpdatePayload', () => {
    it('should build payload with only description', () => {
      const updates = {description: 'New description'}
      const payload = buildUpdatePayload(updates)

      expect(payload).to.deep.equal({
        description: 'New description'
      })
    })

    it('should build payload with project and task', () => {
      const updates = {project_id: 5, task_id: 10}
      const payload = buildUpdatePayload(updates)

      expect(payload).to.deep.equal({
        project_id: 5,
        task_id: 10
      })
    })

    it('should handle null values for clearing assignments', () => {
      const updates = {project_id: null, task_id: null}
      const payload = buildUpdatePayload(updates)

      expect(payload).to.deep.equal({
        project_id: null,
        task_id: null
      })
    })

    it('should build payload with mixed values', () => {
      const updates = {description: 'New desc', project_id: 3, task_id: null}
      const payload = buildUpdatePayload(updates)

      expect(payload).to.deep.equal({
        description: 'New desc',
        project_id: 3,
        task_id: null
      })
    })

    it('should return empty payload when no updates', () => {
      const updates = {}
      const payload = buildUpdatePayload(updates)

      expect(payload).to.deep.equal({})
    })
  })

  describe('applyClearFlag', () => {
    it('should clear assignments when clear flag is true', () => {
      const result = applyClearFlag({clear: true})
      expect(result).to.deep.equal({
        project_id: null,
        task_id: null
      })
    })

    it('should return empty object when clear flag is false', () => {
      const result = applyClearFlag({clear: false})
      expect(result).to.deep.equal({})
    })

    it('should return empty object when clear flag is undefined', () => {
      const result = applyClearFlag({})
      expect(result).to.deep.equal({})
    })
  })

  describe('handleNoneValue', () => {
    it('should return null for "none" (case insensitive)', () => {
      expect(handleNoneValue('none')).to.be.null
      expect(handleNoneValue('None')).to.be.null
      expect(handleNoneValue('NONE')).to.be.null
    })

    it('should return undefined for non-"none" values', () => {
      expect(handleNoneValue('project')).to.be.undefined
      expect(handleNoneValue('task')).to.be.undefined
      expect(handleNoneValue('something')).to.be.undefined
    })
  })

  describe('Edit command scenarios', () => {
    const mockProjects: Project[] = [
      {active: true, id: 1, name: 'Backend API', workspace_id: 123},
      {active: true, id: 2, name: 'Frontend React', workspace_id: 123},
    ]

    const mockTasks: Task[] = [
      {active: true, id: 10, name: 'Authentication', project_id: 1},
      {active: true, id: 11, name: 'UI Components', project_id: 2},
    ]

    it('should handle editing description only', () => {
      const updates = {description: 'Updated description'}
      const payload = buildUpdatePayload(updates)

      expect(payload).to.deep.equal({
        description: 'Updated description'
      })
    })

    it('should handle editing project only', () => {
      const project = findProjectByNameOrId(mockProjects, 'frontend')
      expect(project).not.to.be.null

      const updates = {project_id: project!.id}
      const payload = buildUpdatePayload(updates)

      expect(payload).to.deep.equal({
        project_id: 2
      })
    })

    it('should handle clearing project with "none"', () => {
      const clearValue = handleNoneValue('none')
      expect(clearValue).to.be.null

      const updates = {project_id: clearValue}
      const payload = buildUpdatePayload(updates)

      expect(payload).to.deep.equal({
        project_id: null
      })
    })

    it('should handle changing task within same project', () => {
      const task = findTaskByNameOrId(mockTasks, 'auth', 1)
      expect(task).not.to.be.null
      expect(task!.name).to.equal('Authentication')

      const updates = {task_id: task!.id}
      const payload = buildUpdatePayload(updates)

      expect(payload).to.deep.equal({
        task_id: 10
      })
    })

    it('should handle clearing all assignments with clear flag', () => {
      const clearResult = applyClearFlag({clear: true})
      const payload = buildUpdatePayload(clearResult)

      expect(payload).to.deep.equal({
        project_id: null,
        task_id: null
      })
    })

    it('should handle complex update with description, project, and task', () => {
      const project = findProjectByNameOrId(mockProjects, '2')
      const task = findTaskByNameOrId(mockTasks, '11')

      const updates = {
        description: 'Working on UI',
        project_id: project!.id,
        task_id: task!.id
      }
      const payload = buildUpdatePayload(updates)

      expect(payload).to.deep.equal({
        description: 'Working on UI',
        project_id: 2,
        task_id: 11
      })
    })
  })
})