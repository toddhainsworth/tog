import { expect } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import sinon, { type SinonStub } from 'sinon'

import type { TogglClient } from '../../src/lib/toggl-client.js'
import type { Project } from '../../src/lib/validation.js'

import { ProjectService } from '../../src/lib/project-service.js'


describe('ProjectService', () => {
  let mockClient: sinon.SinonStubbedInstance<TogglClient>
  let mockContext: { debug: SinonStub; warn: SinonStub }
  let projectService: ProjectService

  const mockProjects: Project[] = [
    { active: true, id: 1, name: 'Backend API', workspace_id: 123 },
    { active: true, client_name: 'Acme Corp', id: 2, name: 'Frontend React', workspace_id: 123 },
    { active: false, id: 3, name: 'Mobile App', workspace_id: 456 },
    { active: true, id: 4, name: 'API Services', workspace_id: 123 }
  ]

  beforeEach(() => {
    mockClient = {
      getProjects: sinon.stub(),
      getWorkspaces: sinon.stub()
    } as unknown as sinon.SinonStubbedInstance<TogglClient>

    mockContext = {
      debug: sinon.stub(),
      warn: sinon.stub()
    }


    projectService = new ProjectService(mockClient, mockContext)
  })

  describe('static createProjectLookupMap', () => {
    it('should create a lookup map from project ID to name', () => {
      const lookupMap = ProjectService.createProjectLookupMap(mockProjects)

      expect(lookupMap.get(1)).to.equal('Backend API')
      expect(lookupMap.get(2)).to.equal('Frontend React')
      expect(lookupMap.get(3)).to.equal('Mobile App')
      expect(lookupMap.get(4)).to.equal('API Services')
    })

    it('should handle empty array', () => {
      const lookupMap = ProjectService.createProjectLookupMap([])
      expect(lookupMap.size).to.equal(0)
    })

    it('should return undefined for non-existent project ID', () => {
      const lookupMap = ProjectService.createProjectLookupMap(mockProjects)
      expect(lookupMap.get(999)).to.be.undefined
    })
  })

  describe('static getProjects', () => {
    it('should fetch projects successfully', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const result = await ProjectService.getProjects(mockClient, mockContext)

      expect(result).to.deep.equal(mockProjects)
      expect(mockContext.debug).to.have.been.calledWith('Fetching user projects')
      expect(mockContext.debug).to.have.been.calledWith('Projects fetched successfully', { count: 4 })
    })

    it('should return empty array on error', async () => {
      const error = new Error('Network error')
      mockClient.getProjects.rejects(error)

      const result = await ProjectService.getProjects(mockClient, mockContext)

      expect(result).to.deep.equal([])
      expect(mockContext.debug).to.have.been.calledWith('Failed to fetch projects', { error: 'Network error' })
      expect(mockContext.warn).to.have.been.calledWith('Failed to fetch projects')
    })

    it('should work without context', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const result = await ProjectService.getProjects(mockClient)

      expect(result).to.deep.equal(mockProjects)
    })
  })

  describe('instance getProjects', () => {
    it('should fetch projects using static method', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const result = await projectService.getProjects()

      expect(result).to.deep.equal(mockProjects)
      expect(mockContext.debug).to.have.been.calledWith('Fetching user projects')
    })
  })

  describe('findProjectById', () => {
    it('should find project by ID', () => {
      const project = ProjectService.findProjectById(mockProjects, 2)

      expect(project).to.deep.equal({ active: true, client_name: 'Acme Corp', id: 2, name: 'Frontend React', workspace_id: 123 })
    })

    it('should return null if project not found', () => {
      const project = ProjectService.findProjectById(mockProjects, 999)

      expect(project).to.be.null
    })

    it('should handle empty array', () => {
      const project = ProjectService.findProjectById([], 1)

      expect(project).to.be.null
    })
  })

  describe('fetchProjectById', () => {
    it('should fetch and find project by ID', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const project = await ProjectService.fetchProjectById(mockClient, 2, mockContext)

      expect(project).to.deep.equal({ active: true, client_name: 'Acme Corp', id: 2, name: 'Frontend React', workspace_id: 123 })
      expect(mockClient.getProjects).to.have.been.calledOnce
      expect(mockContext.debug).to.have.been.calledWith('Fetching user projects')
    })

    it('should return null if project not found after fetch', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const project = await ProjectService.fetchProjectById(mockClient, 999, mockContext)

      expect(project).to.be.null
      expect(mockClient.getProjects).to.have.been.calledOnce
    })

    it('should return null if fetch fails', async () => {
      mockClient.getProjects.rejects(new Error('API error'))

      const project = await ProjectService.fetchProjectById(mockClient, 1, mockContext)

      expect(project).to.be.null
      expect(mockContext.warn).to.have.been.calledWith('Failed to fetch projects')
    })
  })

  describe('findProjectByNameOrId', () => {
    it('should find project by exact ID', () => {
      const project = ProjectService.findProjectByNameOrId(mockProjects, '2')

      expect(project).to.deep.equal({ active: true, client_name: 'Acme Corp', id: 2, name: 'Frontend React', workspace_id: 123 })
    })

    it('should find project by partial name match', () => {
      const project = ProjectService.findProjectByNameOrId(mockProjects, 'backend')

      expect(project).to.deep.equal({ active: true, id: 1, name: 'Backend API', workspace_id: 123 })
    })

    it('should find project by exact name match', () => {
      const project = ProjectService.findProjectByNameOrId(mockProjects, 'Frontend React')

      expect(project).to.deep.equal({ active: true, client_name: 'Acme Corp', id: 2, name: 'Frontend React', workspace_id: 123 })
    })

    it('should return null if no match found', () => {
      const project = ProjectService.findProjectByNameOrId(mockProjects, 'nonexistent')

      expect(project).to.be.null
    })

    it('should prefer exact name match over partial matches', () => {
      const projects: Project[] = [
        { active: true, id: 1, name: 'API', workspace_id: 123 },
        { active: true, id: 2, name: 'Backend API', workspace_id: 123 },
        { active: true, id: 3, name: 'API Services', workspace_id: 123 }
      ]

      const project = ProjectService.findProjectByNameOrId(projects, 'api')

      expect(project).to.deep.equal({ active: true, id: 1, name: 'API', workspace_id: 123 })
    })

    it('should throw error for ambiguous partial matches', () => {
      const projects: Project[] = [
        { active: true, id: 1, name: 'Backend Service', workspace_id: 123 },
        { active: true, id: 2, name: 'Frontend Service', workspace_id: 123 }
      ]

      expect(() => ProjectService.findProjectByNameOrId(projects, 'service')).to.throw(
        'Multiple projects match "service": Backend Service, Frontend Service. Please be more specific.'
      )
    })

    it('should handle case insensitive matching', () => {
      const project = ProjectService.findProjectByNameOrId(mockProjects, 'BACKEND')

      expect(project).to.deep.equal({ active: true, id: 1, name: 'Backend API', workspace_id: 123 })
    })

    it('should handle invalid ID strings', () => {
      const project = ProjectService.findProjectByNameOrId(mockProjects, 'abc')

      expect(project).to.be.null
    })
  })

  describe('instance findProjectByNameOrId', () => {
    it('should find project by name or ID using static method', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const result = await projectService.findProjectByNameOrId('backend')

      expect(result).to.deep.equal({ active: true, id: 1, name: 'Backend API', workspace_id: 123 })
    })
  })

  describe('filtering methods', () => {
    describe('filterProjectsByWorkspace', () => {
      it('should filter projects by workspace ID', () => {
        const filtered = ProjectService.filterProjectsByWorkspace(mockProjects, 123)

        expect(filtered).to.have.length(3)
        expect(filtered.every(p => p.workspace_id === 123)).to.be.true
      })

      it('should return empty array if no matches', () => {
        const filtered = ProjectService.filterProjectsByWorkspace(mockProjects, 999)

        expect(filtered).to.deep.equal([])
      })
    })

    describe('filterProjectsByClient', () => {
      it('should filter projects by client name', () => {
        const filtered = ProjectService.filterProjectsByClient(mockProjects, 'Acme Corp')

        expect(filtered).to.have.length(1)
        expect(filtered[0]).to.deep.equal({ active: true, client_name: 'Acme Corp', id: 2, name: 'Frontend React', workspace_id: 123 })
      })

      it('should return empty array if no matches', () => {
        const filtered = ProjectService.filterProjectsByClient(mockProjects, 'Nonexistent Client')

        expect(filtered).to.deep.equal([])
      })
    })

    describe('filterActiveProjects', () => {
      it('should filter active projects', () => {
        const filtered = ProjectService.filterActiveProjects(mockProjects)

        expect(filtered).to.have.length(3)
        expect(filtered.every(p => p.active === true)).to.be.true
      })

      it('should return empty array if no active projects', () => {
        const inactiveProjects = mockProjects.map(p => ({ ...p, active: false }))
        const filtered = ProjectService.filterActiveProjects(inactiveProjects)

        expect(filtered).to.deep.equal([])
      })
    })
  })


  describe('validateProject', () => {
    it('should validate existing project successfully', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const result = await projectService.validateProject(2)

      expect(result).to.deep.equal({
        project: { active: true, client_name: 'Acme Corp', id: 2, name: 'Frontend React', workspace_id: 123 },
        success: true
      })
      expect(mockContext.debug).to.have.been.calledWith('Project validation successful', {
        projectId: 2,
        projectName: 'Frontend React',
        workspaceId: 123
      })
    })

    it('should fail validation for invalid project ID', async () => {
      const result = await projectService.validateProject(0)

      expect(result).to.deep.equal({
        error: 'Invalid project ID provided',
        success: false
      })
    })

    it('should fail validation for negative project ID', async () => {
      const result = await projectService.validateProject(-1)

      expect(result).to.deep.equal({
        error: 'Invalid project ID provided',
        success: false
      })
    })

    it('should fail validation for non-existent project', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const result = await projectService.validateProject(999)

      expect(result).to.deep.equal({
        error: 'Project with ID 999 not found or not accessible',
        success: false
      })
    })

    it('should validate workspace membership', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const result = await projectService.validateProject(2, 456)

      expect(result).to.deep.equal({
        error: 'Project "Frontend React" does not belong to the specified workspace',
        success: false
      })
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getProjects.rejects(error)

      const result = await projectService.validateProject(1)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Project with ID 1 not found or not accessible')
      expect(mockContext.debug).to.have.been.calledWith('Failed to fetch projects', {
        error: 'API error'
      })
    })
  })

  describe('selectProject', () => {
    it('should select project successfully', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const result = await projectService.selectProject('backend')

      expect(result).to.deep.equal({
        project: { active: true, id: 1, name: 'Backend API', workspace_id: 123 },
        success: true
      })
      expect(mockContext.debug).to.have.been.calledWith('Project selection successful', {
        projectId: 1,
        projectName: 'Backend API',
        workspaceId: 123
      })
    })

    it('should fail selection for non-existent project', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const result = await projectService.selectProject('nonexistent')

      expect(result).to.deep.equal({
        error: 'Project "nonexistent" not found',
        success: false
      })
    })

    it('should filter by workspace when specified', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const result = await projectService.selectProject('mobile', 456)

      expect(result).to.deep.equal({
        project: { active: false, id: 3, name: 'Mobile App', workspace_id: 456 },
        success: true
      })
    })

    it('should fail when project not in specified workspace', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const result = await projectService.selectProject('backend', 456)

      expect(result).to.deep.equal({
        error: 'Project "backend" in workspace 456 not found',
        success: false
      })
    })

    it('should handle errors during selection', async () => {
      const error = new Error('Selection error')
      mockClient.getProjects.rejects(error)

      const result = await projectService.selectProject('backend')

      expect(result.success).to.be.false
      expect(result.error).to.equal('Project "backend" not found')
    })
  })

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      mockClient.getProjects.resolves(mockProjects)

      const stats = await projectService.getProjectStats()

      expect(stats).to.deep.equal({
        active: 3,
        byClient: {
          'Acme Corp': 1,
          'No Client': 3
        },
        byWorkspace: {
          123: 3,
          456: 1
        },
        inactive: 1,
        total: 4
      })
    })

    it('should handle empty projects', async () => {
      mockClient.getProjects.resolves([])

      const stats = await projectService.getProjectStats()

      expect(stats).to.deep.equal({
        active: 0,
        byClient: {},
        byWorkspace: {},
        inactive: 0,
        total: 0
      })
    })
  })

  describe('edge cases', () => {
    it('should handle null/undefined project names gracefully', () => {
      const projectsWithNulls: Project[] = [
        { active: true, id: 1, name: '', workspace_id: 123 }
      ]

      const result = ProjectService.findProjectByNameOrId(projectsWithNulls, '')
      expect(result).to.deep.equal({ active: true, id: 1, name: '', workspace_id: 123 })
    })

    it('should handle projects with same name in different workspaces', async () => {
      const duplicateProjects: Project[] = [
        { active: true, id: 1, name: 'Project A', workspace_id: 123 },
        { active: true, id: 2, name: 'Project A', workspace_id: 456 }
      ]
      mockClient.getProjects.resolves(duplicateProjects)

      const result = await projectService.selectProject('Project A', 456)
      expect(result.success).to.be.true
      expect(result.project?.workspace_id).to.equal(456)
    })
  })
});