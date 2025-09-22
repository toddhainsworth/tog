import {expect} from 'chai'

import {
  ApiTokenSchema,
  ConfigSchema,
  ProjectSchema,
  ProjectsArraySchema,
  TaskSchema,
  TasksArraySchema,
  TimeEntrySchema,
  TimerDescriptionSchema,
  UserSchema,
  WorkspaceIdSchema,
  WorkspaceSchema,
  WorkspaceSelectionSchema,
  WorkspacesArraySchema,
} from '../../src/lib/validation.js'

describe('Validation schemas', () => {
  describe('ApiTokenSchema', () => {
    it('should accept valid API tokens (32+ characters)', () => {
      const validToken = 'a'.repeat(32)
      expect(() => ApiTokenSchema.assert(validToken)).to.not.throw()
    })

    it('should reject short API tokens', () => {
      const shortToken = 'a'.repeat(31)
      expect(() => ApiTokenSchema.assert(shortToken)).to.throw()
    })

    it('should accept longer API tokens', () => {
      const longToken = 'a'.repeat(64)
      expect(() => ApiTokenSchema.assert(longToken)).to.not.throw()
    })
  })

  describe('WorkspaceIdSchema', () => {
    it('should accept positive workspace IDs', () => {
      expect(() => WorkspaceIdSchema.assert(1)).to.not.throw()
      expect(() => WorkspaceIdSchema.assert(12345)).to.not.throw()
    })

    it('should reject zero', () => {
      expect(() => WorkspaceIdSchema.assert(0)).to.throw()
    })

    it('should reject negative numbers', () => {
      expect(() => WorkspaceIdSchema.assert(-1)).to.throw()
    })
  })

  describe('ConfigSchema', () => {
    it('should accept valid config', () => {
      const validConfig = {
        apiToken: 'a'.repeat(32),
        workspaceId: 12345,
      }
      expect(() => ConfigSchema.assert(validConfig)).to.not.throw()
    })

    it('should reject invalid config', () => {
      const invalidConfig = {
        apiToken: 'short',
        workspaceId: 0,
      }
      expect(() => ConfigSchema.assert(invalidConfig)).to.throw()
    })

    it('should reject missing fields', () => {
      expect(() => ConfigSchema.assert({apiToken: 'a'.repeat(32)})).to.throw()
      expect(() => ConfigSchema.assert({workspaceId: 123})).to.throw()
    })
  })

  describe('TimeEntrySchema', () => {
    it('should accept valid time entry', () => {
      const validEntry = {
        id: 1,
        at: '2024-01-01T00:00:00Z',
        duration: 3600,
        start: '2024-01-01T00:00:00Z',
        workspace_id: 123,
        description: 'Working on tests',
      }
      expect(() => TimeEntrySchema.assert(validEntry)).to.not.throw()
    })

    it('should accept time entry with optional fields', () => {
      const entryWithOptionals = {
        id: 1,
        at: '2024-01-01T00:00:00Z',
        duration: -1, // Running timer
        start: '2024-01-01T00:00:00Z',
        workspace_id: 123,
        description: 'Working',
        project_id: 456,
        task_id: 789,
        billable: true,
      }
      expect(() => TimeEntrySchema.assert(entryWithOptionals)).to.not.throw()
    })

    it('should reject missing required fields', () => {
      const missingFields = {
        id: 1,
        duration: 3600,
        // Missing: at, start, workspace_id
      }
      expect(() => TimeEntrySchema.assert(missingFields)).to.throw()
    })
  })

  describe('WorkspaceSchema', () => {
    it('should accept valid workspace', () => {
      const validWorkspace = {
        id: 123,
        name: 'My Workspace',
      }
      expect(() => WorkspaceSchema.assert(validWorkspace)).to.not.throw()
    })

    it('should accept workspace with organization_id', () => {
      const workspaceWithOrg = {
        id: 123,
        name: 'My Workspace',
        organization_id: 456,
      }
      expect(() => WorkspaceSchema.assert(workspaceWithOrg)).to.not.throw()
    })
  })

  describe('ProjectSchema', () => {
    it('should accept valid project', () => {
      const validProject = {
        id: 123,
        name: 'My Project',
        active: true,
        workspace_id: 456,
      }
      expect(() => ProjectSchema.assert(validProject)).to.not.throw()
    })

    it('should accept project with optional fields', () => {
      const projectWithOptionals = {
        id: 123,
        name: 'My Project',
        active: false,
        workspace_id: 456,
        color: '#FF0000',
        client_name: 'ACME Corp',
      }
      expect(() => ProjectSchema.assert(projectWithOptionals)).to.not.throw()
    })
  })

  describe('TaskSchema', () => {
    it('should accept valid task', () => {
      const validTask = {
        id: 123,
        name: 'My Task',
        active: true,
        project_id: 456,
      }
      expect(() => TaskSchema.assert(validTask)).to.not.throw()
    })
  })

  describe('UserSchema', () => {
    it('should accept valid user', () => {
      const validUser = {
        id: 123,
      }
      expect(() => UserSchema.assert(validUser)).to.not.throw()
    })

    it('should accept user with optional fields', () => {
      const userWithOptionals = {
        id: 123,
        email: 'user@example.com',
        fullname: 'John Doe',
      }
      expect(() => UserSchema.assert(userWithOptionals)).to.not.throw()
    })
  })

  describe('Array schemas', () => {
    it('should accept empty arrays', () => {
      expect(() => WorkspacesArraySchema.assert([])).to.not.throw()
      expect(() => ProjectsArraySchema.assert([])).to.not.throw()
      expect(() => TasksArraySchema.assert([])).to.not.throw()
    })

    it('should accept arrays with valid items', () => {
      const workspaces = [{id: 1, name: 'WS1'}, {id: 2, name: 'WS2'}]
      expect(() => WorkspacesArraySchema.assert(workspaces)).to.not.throw()

      const projects = [{id: 1, name: 'P1', active: true, workspace_id: 1}]
      expect(() => ProjectsArraySchema.assert(projects)).to.not.throw()

      const tasks = [{id: 1, name: 'T1', active: true, project_id: 1}]
      expect(() => TasksArraySchema.assert(tasks)).to.not.throw()
    })

    it('should reject arrays with invalid items', () => {
      const invalidWorkspaces = [{id: 1}] // Missing name
      expect(() => WorkspacesArraySchema.assert(invalidWorkspaces)).to.throw()
    })
  })

  describe('User input schemas', () => {
    it('should accept valid workspace selection', () => {
      expect(() => WorkspaceSelectionSchema.assert('1')).to.not.throw()
      expect(() => WorkspaceSelectionSchema.assert('12345')).to.not.throw()
    })

    it('should reject invalid workspace selection', () => {
      expect(() => WorkspaceSelectionSchema.assert('0')).to.throw()
      expect(() => WorkspaceSelectionSchema.assert('-1')).to.throw()
      expect(() => WorkspaceSelectionSchema.assert('abc')).to.throw()
      expect(() => WorkspaceSelectionSchema.assert('')).to.throw()
    })

    it('should accept valid timer descriptions', () => {
      expect(() => TimerDescriptionSchema.assert('Working on feature')).to.not.throw()
      expect(() => TimerDescriptionSchema.assert('A')).to.not.throw()
    })

    it('should reject empty timer descriptions', () => {
      expect(() => TimerDescriptionSchema.assert('')).to.throw()
    })
  })
})