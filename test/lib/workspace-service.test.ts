import { expect } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import sinon, { type SinonStub } from 'sinon'

import type { TogglClient } from '../../src/lib/toggl-client.js'
import type { Workspace } from '../../src/lib/validation.js'

import { WorkspaceService } from '../../src/lib/workspace-service.js'

describe('WorkspaceService', () => {
  let mockClient: sinon.SinonStubbedInstance<TogglClient>
  let mockContext: { debug: SinonStub; warn: SinonStub }

  const mockWorkspaces: Workspace[] = [
    { id: 1, name: 'Personal Space' },
    { id: 2, name: 'Work Workspace' },
    { id: 3, name: 'Client Area' }
  ]

  beforeEach(() => {
    mockClient = {
      getWorkspaces: sinon.stub()
    } as unknown as sinon.SinonStubbedInstance<TogglClient>

    mockContext = {
      debug: sinon.stub(),
      warn: sinon.stub()
    }
  })

  describe('getWorkspaces', () => {
    it('should fetch workspaces successfully', async () => {
      mockClient.getWorkspaces.resolves(mockWorkspaces)

      const result = await WorkspaceService.getWorkspaces(mockClient, mockContext)

      expect(result).to.deep.equal(mockWorkspaces)
      expect(mockContext.debug).to.have.been.calledWith('Fetching user workspaces')
      expect(mockContext.debug).to.have.been.calledWith('Workspaces fetched successfully', { count: 3 })
    })

    it('should return empty array on error', async () => {
      const error = new Error('Network error')
      mockClient.getWorkspaces.rejects(error)

      const result = await WorkspaceService.getWorkspaces(mockClient, mockContext)

      expect(result).to.deep.equal([])
      expect(mockContext.debug).to.have.been.calledWith('Failed to fetch workspaces', { error: 'Network error' })
      expect(mockContext.warn).to.have.been.calledWith('Failed to fetch workspaces')
    })

    it('should work without context', async () => {
      mockClient.getWorkspaces.resolves(mockWorkspaces)

      const result = await WorkspaceService.getWorkspaces(mockClient)

      expect(result).to.deep.equal(mockWorkspaces)
    })
  })

  describe('findWorkspaceById', () => {
    it('should find workspace by ID', () => {
      const workspace = WorkspaceService.findWorkspaceById(mockWorkspaces, 2)

      expect(workspace).to.deep.equal({ id: 2, name: 'Work Workspace' })
    })

    it('should return null if workspace not found', () => {
      const workspace = WorkspaceService.findWorkspaceById(mockWorkspaces, 999)

      expect(workspace).to.be.null
    })

    it('should handle empty array', () => {
      const workspace = WorkspaceService.findWorkspaceById([], 1)

      expect(workspace).to.be.null
    })
  })

  describe('findWorkspaceByNameOrId', () => {
    it('should find workspace by exact ID', () => {
      const workspace = WorkspaceService.findWorkspaceByNameOrId(mockWorkspaces, '2')

      expect(workspace).to.deep.equal({ id: 2, name: 'Work Workspace' })
    })

    it('should find workspace by partial name match', () => {
      const workspace = WorkspaceService.findWorkspaceByNameOrId(mockWorkspaces, 'work')

      expect(workspace).to.deep.equal({ id: 2, name: 'Work Workspace' })
    })

    it('should find workspace by exact name match', () => {
      const workspace = WorkspaceService.findWorkspaceByNameOrId(mockWorkspaces, 'Work Workspace')

      expect(workspace).to.deep.equal({ id: 2, name: 'Work Workspace' })
    })

    it('should return null if no match found', () => {
      const workspace = WorkspaceService.findWorkspaceByNameOrId(mockWorkspaces, 'nonexistent')

      expect(workspace).to.be.null
    })

    it('should prefer exact name match over partial matches', () => {
      const workspaces: Workspace[] = [
        { id: 1, name: 'Client' },
        { id: 2, name: 'Client Workspace' },
        { id: 3, name: 'Another Client Workspace' }
      ]

      const workspace = WorkspaceService.findWorkspaceByNameOrId(workspaces, 'client')

      expect(workspace).to.deep.equal({ id: 1, name: 'Client' })
    })

    it('should throw error for ambiguous partial matches', () => {
      const workspaces: Workspace[] = [
        { id: 1, name: 'Test Workspace 1' },
        { id: 2, name: 'Test Workspace 2' }
      ]

      expect(() => WorkspaceService.findWorkspaceByNameOrId(workspaces, 'test')).to.throw(
        'Multiple workspaces match "test": Test Workspace 1, Test Workspace 2. Please be more specific.'
      )
    })

    it('should handle case insensitive matching', () => {
      const workspace = WorkspaceService.findWorkspaceByNameOrId(mockWorkspaces, 'WORK')

      expect(workspace).to.deep.equal({ id: 2, name: 'Work Workspace' })
    })

    it('should handle invalid ID strings', () => {
      const workspace = WorkspaceService.findWorkspaceByNameOrId(mockWorkspaces, 'abc')

      expect(workspace).to.be.null
    })
  })

  describe('validateWorkspace', () => {
    it('should validate existing workspace successfully', async () => {
      mockClient.getWorkspaces.resolves(mockWorkspaces)

      const result = await WorkspaceService.validateWorkspace(mockClient, 2, mockContext)

      expect(result).to.deep.equal({
        success: true,
        workspace: { id: 2, name: 'Work Workspace' }
      })
      expect(mockContext.debug).to.have.been.calledWith('Workspace validation successful', {
        workspaceId: 2,
        workspaceName: 'Work Workspace'
      })
    })

    it('should fail validation for invalid workspace ID', async () => {
      const result = await WorkspaceService.validateWorkspace(mockClient, 0, mockContext)

      expect(result).to.deep.equal({
        error: 'Invalid workspace ID provided',
        success: false
      })
    })

    it('should fail validation for negative workspace ID', async () => {
      const result = await WorkspaceService.validateWorkspace(mockClient, -1, mockContext)

      expect(result).to.deep.equal({
        error: 'Invalid workspace ID provided',
        success: false
      })
    })

    it('should fail validation for non-existent workspace', async () => {
      mockClient.getWorkspaces.resolves(mockWorkspaces)

      const result = await WorkspaceService.validateWorkspace(mockClient, 999, mockContext)

      expect(result).to.deep.equal({
        error: 'Workspace with ID 999 not found or not accessible',
        success: false
      })
    })

    it('should handle API errors', async () => {
      const error = new Error('API error')
      mockClient.getWorkspaces.rejects(error)

      const result = await WorkspaceService.validateWorkspace(mockClient, 1, mockContext)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Workspace with ID 1 not found or not accessible')
      expect(mockContext.debug).to.have.been.calledWith('Failed to fetch workspaces', { error: 'API error' })
      expect(mockContext.warn).to.have.been.calledWith('Failed to fetch workspaces')
    })

    it('should work without context', async () => {
      mockClient.getWorkspaces.resolves(mockWorkspaces)

      const result = await WorkspaceService.validateWorkspace(mockClient, 1)

      expect(result.success).to.be.true
      expect(result.workspace).to.deep.equal({ id: 1, name: 'Personal Space' })
    })
  })

  describe('getDefaultWorkspace', () => {
    it('should return first workspace when available', async () => {
      mockClient.getWorkspaces.resolves(mockWorkspaces)

      const result = await WorkspaceService.getDefaultWorkspace(mockClient, mockContext)

      expect(result).to.deep.equal({ id: 1, name: 'Personal Space' })
    })

    it('should return null when no workspaces available', async () => {
      mockClient.getWorkspaces.resolves([])

      const result = await WorkspaceService.getDefaultWorkspace(mockClient, mockContext)

      expect(result).to.be.null
    })

    it('should handle API errors gracefully', async () => {
      mockClient.getWorkspaces.rejects(new Error('API error'))

      const result = await WorkspaceService.getDefaultWorkspace(mockClient, mockContext)

      expect(result).to.be.null
    })
  })

  describe('validateWorkspaceAccess', () => {
    it('should return access info for valid workspace', async () => {
      mockClient.getWorkspaces.resolves(mockWorkspaces)

      const result = await WorkspaceService.validateWorkspaceAccess(mockClient, 2, mockContext)

      expect(result).to.deep.equal({
        hasAccess: true,
        workspace: { id: 2, name: 'Work Workspace' }
      })
    })

    it('should return no access for invalid workspace', async () => {
      mockClient.getWorkspaces.resolves(mockWorkspaces)

      const result = await WorkspaceService.validateWorkspaceAccess(mockClient, 999, mockContext)

      expect(result).to.deep.equal({
        hasAccess: false,
        workspace: undefined
      })
    })

    it('should handle API errors', async () => {
      mockClient.getWorkspaces.rejects(new Error('API error'))

      const result = await WorkspaceService.validateWorkspaceAccess(mockClient, 1, mockContext)

      expect(result).to.deep.equal({
        hasAccess: false,
        workspace: undefined
      })
    })
  })
});