import axios from 'axios'
import {expect} from 'chai'
import sinon from 'sinon'

import {TogglClient} from '../../src/lib/toggl-client.js'

describe('TogglClient', () => {
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('constructor', () => {
    it('should create an instance with an API token', () => {
      const client = new TogglClient('test-token')
      expect(client).to.be.instanceOf(TogglClient)
    })
  })

  describe('ping', () => {
    it('should return true for valid response', async () => {
      const mockResponse = {data: {id: 123, email: 'test@example.com'}}
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().resolves(mockResponse),
      } as any)

      const client = new TogglClient('valid-token')
      const result = await client.ping()
      expect(result).to.be.true
    })

    it('should return false for invalid API token', async () => {
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().rejects(new Error('401 Unauthorized')),
      } as any)

      const client = new TogglClient('invalid-token')
      const result = await client.ping()
      expect(result).to.be.false
    })

    it('should return false for network error', async () => {
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().rejects(new Error('Network error')),
      } as any)

      const client = new TogglClient('test-token')
      const result = await client.ping()
      expect(result).to.be.false
    })
  })

  describe('getCurrentTimeEntry', () => {
    it('should return current time entry when running', async () => {
      const mockEntry = {
        id: 1,
        description: 'Working',
        start: new Date().toISOString(),
        duration: -1,
        workspace_id: 123,
        at: new Date().toISOString(),
      }
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().resolves({data: mockEntry}),
      } as any)

      const client = new TogglClient('test-token')
      const result = await client.getCurrentTimeEntry()
      expect(result).to.deep.equal(mockEntry)
    })

    it('should return null when no timer is running', async () => {
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().resolves({data: null}),
      } as any)

      const client = new TogglClient('test-token')
      const result = await client.getCurrentTimeEntry()
      expect(result).to.be.null
    })
  })

  describe('stopTimeEntry', () => {
    it('should return true when successfully stopped', async () => {
      sandbox.stub(axios, 'create').returns({
        patch: sandbox.stub().resolves({data: {}}),
      } as any)

      const client = new TogglClient('test-token')
      const result = await client.stopTimeEntry(123, 456)
      expect(result).to.be.true
    })

    it('should return false when stop fails', async () => {
      sandbox.stub(axios, 'create').returns({
        patch: sandbox.stub().rejects(new Error('Failed')),
      } as any)

      const client = new TogglClient('test-token')
      const result = await client.stopTimeEntry(123, 456)
      expect(result).to.be.false
    })
  })

  describe('getTasks', () => {
    it('should return tasks array', async () => {
      const mockTasks = [
        {id: 1, name: 'Task 1', active: true, project_id: 100},
        {id: 2, name: 'Task 2', active: true, project_id: 100},
      ]
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().resolves({data: mockTasks}),
      } as any)

      const client = new TogglClient('test-token')
      const result = await client.getTasks()
      expect(result).to.deep.equal(mockTasks)
    })

    it('should return empty array when no tasks', async () => {
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().resolves({data: []}),
      } as any)

      const client = new TogglClient('test-token')
      const result = await client.getTasks()
      expect(result).to.deep.equal([])
    })
  })

  describe('getProjects', () => {
    it('should return projects array', async () => {
      const mockProjects = [
        {id: 100, name: 'Project 1', active: true, workspace_id: 123},
        {id: 101, name: 'Project 2', active: false, workspace_id: 123},
      ]
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().resolves({data: mockProjects}),
      } as any)

      const client = new TogglClient('test-token')
      const result = await client.getProjects()
      expect(result).to.deep.equal(mockProjects)
    })

    it('should handle null response as empty array', async () => {
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().resolves({data: null}),
      } as any)

      const client = new TogglClient('test-token')
      const result = await client.getProjects()
      expect(result).to.deep.equal([])
    })
  })

  describe('getWorkspaces', () => {
    it('should return workspaces array', async () => {
      const mockWorkspaces = [
        {id: 123, name: 'Personal'},
        {id: 456, name: 'Work'},
      ]
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().resolves({data: mockWorkspaces}),
      } as any)

      const client = new TogglClient('test-token')
      const result = await client.getWorkspaces()
      expect(result).to.deep.equal(mockWorkspaces)
    })
  })

  describe('createTimeEntry', () => {
    it('should create and return new time entry', async () => {
      const mockEntry = {
        id: 789,
        description: 'New task',
        start: new Date().toISOString(),
        duration: -1,
        workspace_id: 123,
        at: new Date().toISOString(),
      }
      sandbox.stub(axios, 'create').returns({
        post: sandbox.stub().resolves({data: mockEntry}),
      } as any)

      const client = new TogglClient('test-token')
      const result = await client.createTimeEntry(123, {
        created_with: 'test',
        description: 'New task',
        start: new Date().toISOString(),
      })
      expect(result).to.deep.equal(mockEntry)
    })
  })

  describe('API authentication', () => {
    it('should properly encode API token in Basic auth header', () => {
      const token = 'test-token-123'
      const expectedAuth = `Basic ${Buffer.from(`${token}:api_token`).toString('base64')}`

      let capturedConfig: any
      sandbox.stub(axios, 'create').callsFake((config) => {
        capturedConfig = config
        return {get: sandbox.stub().resolves({data: {id: 1}})} as any
      })

      new TogglClient(token)
      expect(capturedConfig.headers.Authorization).to.equal(expectedAuth)
    })

    it('should use correct API base URL', () => {
      let capturedConfig: any
      sandbox.stub(axios, 'create').callsFake((config) => {
        capturedConfig = config
        return {get: sandbox.stub().resolves({data: {id: 1}})} as any
      })

      new TogglClient('test-token')
      expect(capturedConfig.baseURL).to.equal('https://api.track.toggl.com/api/v9')
    })
  })
})