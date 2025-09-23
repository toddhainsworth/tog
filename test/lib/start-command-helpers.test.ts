import {expect} from 'chai'

import type {Project, Task} from '../../src/lib/validation.js'

// Helper functions extracted for testing
function findProjectByNameOrId(projects: Project[], input: string): null | Project {
  // Try to parse as ID first
  const id = Number.parseInt(input, 10)
  if (!Number.isNaN(id)) {
    return projects.find(p => p.id === id) || null
  }

  // Case-insensitive name matching
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

  // Multiple matches - look for exact match first
  const exactMatch = matches.find(p =>
    p.name.toLowerCase() === lowercaseInput
  )
  if (exactMatch) {
    return exactMatch
  }

  // Multiple partial matches - this is ambiguous
  const names = matches.map(p => p.name).join(', ')
  throw new Error(`Multiple projects match "${input}": ${names}. Please be more specific.`)
}

function findTaskByNameOrId(tasks: Task[], input: string, projectId?: number): null | Task {
  // Try to parse as ID first
  const id = Number.parseInt(input, 10)
  if (!Number.isNaN(id)) {
    const task = tasks.find(t => t.id === id)
    // If we have a project constraint, ensure task belongs to that project
    if (task && projectId !== undefined && task.project_id !== projectId) {
      throw new Error(`Task "${task.name}" does not belong to the selected project`)
    }

    return task || null
  }

  // Filter by project if provided
  const relevantTasks = projectId === undefined
    ? tasks
    : tasks.filter(t => t.project_id === projectId)

  // Case-insensitive name matching
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

  // Multiple matches - look for exact match first
  const exactMatch = matches.find(t =>
    t.name.toLowerCase() === lowercaseInput
  )
  if (exactMatch) {
    return exactMatch
  }

  // Multiple partial matches - this is ambiguous
  const names = matches.map(t => t.name).join(', ')
  throw new Error(`Multiple tasks match "${input}": ${names}. Please be more specific.`)
}

describe('Start command helper functions', () => {

  describe('findProjectByNameOrId', () => {
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

    it('should find project by partial name match', () => {
      const result = findProjectByNameOrId(mockProjects, 'frontend')
      expect(result).to.deep.equal(mockProjects[1])
    })

    it('should prefer exact match over partial match', () => {
      const projects = [
        ...mockProjects,
        {active: true, id: 5, name: 'Backend', workspace_id: 123}
      ]
      const result = findProjectByNameOrId(projects, 'backend')
      expect(result!.name).to.equal('Backend') // Exact match, not "Backend API"
    })

    it('should return null for non-existent project', () => {
      const result = findProjectByNameOrId(mockProjects, 'nonexistent')
      expect(result).to.be.null
    })

    it('should return null for non-existent ID', () => {
      const result = findProjectByNameOrId(mockProjects, '999')
      expect(result).to.be.null
    })

    it('should throw error for ambiguous partial matches', () => {
      expect(() => {
        findProjectByNameOrId(mockProjects, 'backend')
      }).to.throw('Multiple projects match "backend": Backend API, Backend Services. Please be more specific.')
    })

    it('should handle case-insensitive exact matches', () => {
      const result = findProjectByNameOrId(mockProjects, 'FRONTEND REACT')
      expect(result).to.deep.equal(mockProjects[1])
    })
  })

  describe('findTaskByNameOrId', () => {
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

    it('should find task by exact name (case insensitive)', () => {
      const result = findTaskByNameOrId(mockTasks, 'user interface')
      expect(result).to.deep.equal(mockTasks[2])
    })

    it('should find task by partial name match', () => {
      const result = findTaskByNameOrId(mockTasks, 'api')
      expect(result).to.deep.equal(mockTasks[1])
    })

    it('should filter by project ID when provided', () => {
      const result = findTaskByNameOrId(mockTasks, 'interface', 2)
      expect(result!.name).to.equal('User Interface') // Should find task in project 2
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

    it('should return null for non-existent ID', () => {
      const result = findTaskByNameOrId(mockTasks, '999')
      expect(result).to.be.null
    })

    it('should throw error for ambiguous partial matches', () => {
      expect(() => {
        findTaskByNameOrId(mockTasks, 'user')
      }).to.throw('Multiple tasks match "user": User Authentication, User Interface, User Management. Please be more specific.')
    })

    it('should prefer exact match over partial match', () => {
      const tasks = [
        ...mockTasks,
        {active: true, id: 14, name: 'API', project_id: 1}
      ]
      const result = findTaskByNameOrId(tasks, 'api')
      expect(result!.name).to.equal('API') // Exact match, not "API Integration"
    })

    it('should handle project filtering with no matches', () => {
      const result = findTaskByNameOrId(mockTasks, 'authentication', 2)
      expect(result).to.be.null // No tasks containing "authentication" in project 2
    })

    it('should handle empty task list', () => {
      const result = findTaskByNameOrId([], 'anything')
      expect(result).to.be.null
    })
  })
})