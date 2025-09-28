import axios, {type AxiosInstance} from 'axios'
import {expect} from 'chai'
import {createSandbox} from 'sinon'

import {TogglClient} from '../../src/lib/toggl-client.js'

describe('Today command integration', () => {
  let sandbox: ReturnType<typeof createSandbox>

  beforeEach(() => {
    sandbox = createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('TogglClient.getTimeEntries', () => {
    it('should fetch time entries for date range', async () => {
      const mockEntries = [
        {
          at: '2024-01-01T10:30:00Z',
          description: 'Working on feature',
          duration: 5400, // 1.5 hours
          id: 1,
          project_id: 1,
          start: '2024-01-01T09:00:00Z',
          stop: '2024-01-01T10:30:00Z',
          workspace_id: 123,
        },
      ]

      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().resolves({data: mockEntries}),
      } as unknown as AxiosInstance)

      const client = new TogglClient('test-token')
      const result = await client.getTimeEntries('2024-01-01T00:00:00Z', '2024-01-01T23:59:59Z')

      expect(result).to.deep.equal(mockEntries)
    })

    it('should return empty array when no entries exist', async () => {
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().resolves({data: []}),
      } as unknown as AxiosInstance)

      const client = new TogglClient('test-token')
      const result = await client.getTimeEntries('2024-01-01T00:00:00Z', '2024-01-01T23:59:59Z')

      expect(result).to.deep.equal([])
    })

    it('should handle null response as empty array', async () => {
      sandbox.stub(axios, 'create').returns({
        get: sandbox.stub().resolves({data: null}),
      } as unknown as AxiosInstance)

      const client = new TogglClient('test-token')
      const result = await client.getTimeEntries('2024-01-01T00:00:00Z', '2024-01-01T23:59:59Z')

      expect(result).to.deep.equal([])
    })

    it('should pass correct query parameters', async () => {
      const getSpy = sandbox.stub().resolves({data: []})
      sandbox.stub(axios, 'create').returns({
        get: getSpy,
      } as unknown as AxiosInstance)

      const client = new TogglClient('test-token')
      await client.getTimeEntries('2024-01-01T00:00:00Z', '2024-01-01T23:59:59Z')

      expect(getSpy.calledWith('/me/time_entries', {
        params: {
          end_date: '2024-01-01T23:59:59Z',
          start_date: '2024-01-01T00:00:00Z',
        },
      })).to.be.true
    })
  })
})