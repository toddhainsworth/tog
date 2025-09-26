import {expect} from 'chai'
import dayjs from 'dayjs'
import * as sinon from 'sinon'

import type {Favorite, Project, Task, TimeEntry} from '../../src/lib/validation.js'

import {TimerSelectionService} from '../../src/lib/timer-selection-service.js'
import {TogglClient} from '../../src/lib/toggl-client.js'

describe('TimerSelectionService', () => {
  let mockClient: sinon.SinonStubbedInstance<TogglClient>
  let service: TimerSelectionService
  const projects: Project[] = [
    {active: true, id: 1, name: 'Project A', workspace_id: 1},
    {active: true, id: 2, name: 'Project B', workspace_id: 1},
  ]
  const tasks: Task[] = [
    {active: true, id: 10, name: 'Task 1', project_id: 1},
    {active: true, id: 20, name: 'Task 2', project_id: 2},
  ]

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockClient = sinon.createStubInstance(TogglClient) as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new TimerSelectionService(mockClient as any, projects, tasks)
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('getTimerOptions', () => {
    it('should return favorites when available', async () => {
      const favorites: Favorite[] = [
        {
          description: 'Daily standup',
          favorite_id: 1,
          project_id: 1,
          rank: 1,
          task_id: 10,
        },
        {
          description: 'Code review',
          favorite_id: 2,
          project_id: 2,
          rank: 2,
        },
      ]

      mockClient.getFavorites.resolves(favorites)
      mockClient.getTimeEntries.resolves([])

      const options = await service.getTimerOptions()

      expect(options).to.have.lengthOf(2)
      expect(options[0]?.description).to.equal('Daily standup')
      expect(options[0]?.isFavorite).to.be.true
      expect(options[0]?.display).to.include('⭐')
      expect(options[0]?.display).to.include('Project A')
      expect(options[0]?.display).to.include('Task 1')
    })

    it('should return recent timers when no favorites exist', async () => {
      const timeEntries: TimeEntry[] = [
        {
          at: dayjs().toISOString(),
          description: 'Working on feature',
          duration: 3600,
          id: 100,
          project_id: 1,
          start: dayjs().subtract(2, 'hour').toISOString(),
          stop: dayjs().subtract(1, 'hour').toISOString(),
          workspace_id: 1,
        },
      ]

      mockClient.getFavorites.rejects(new Error('No favorites'))
      mockClient.getTimeEntries.resolves(timeEntries)

      const options = await service.getTimerOptions()

      expect(options).to.have.lengthOf(1)
      expect(options[0]?.description).to.equal('Working on feature')
      expect(options[0]?.isFavorite).to.be.false
      expect(options[0]?.display).to.include('📋')
      expect(options[0]?.display).to.include('Project A')
      expect(options[0]?.lastUsed).to.exist
    })

    it('should deduplicate entries that match favorites', async () => {
      const favorites: Favorite[] = [
        {
          description: 'Daily standup',
          favorite_id: 1,
          project_id: 1,
          rank: 1,
        },
      ]

      const timeEntries: TimeEntry[] = [
        {
          at: dayjs().toISOString(),
          description: 'Daily standup',
          duration: 3600,
          id: 100,
          project_id: 1,
          start: dayjs().subtract(2, 'hour').toISOString(),
          stop: dayjs().subtract(1, 'hour').toISOString(),
          workspace_id: 1,
        },
        {
          at: dayjs().toISOString(),
          description: 'Different task',
          duration: 3600,
          id: 101,
          project_id: 2,
          start: dayjs().subtract(3, 'hour').toISOString(),
          stop: dayjs().subtract(2, 'hour').toISOString(),
          workspace_id: 1,
        },
      ]

      mockClient.getFavorites.resolves(favorites)
      mockClient.getTimeEntries.resolves(timeEntries)

      const options = await service.getTimerOptions()

      // Should have 1 favorite + 1 unique recent entry
      expect(options).to.have.lengthOf(2)
      expect(options[0]?.description).to.equal('Daily standup')
      expect(options[0]?.isFavorite).to.be.true
      expect(options[1]?.description).to.equal('Different task')
      expect(options[1]?.isFavorite).to.be.false
    })

    it('should look back multiple days to find recent timers', async () => {
      // Mock no entries for today
      mockClient.getTimeEntries.onFirstCall().resolves([])

      // Mock entries for yesterday
      const yesterdayEntries: TimeEntry[] = [
        {
          at: dayjs().toISOString(),
          description: 'Yesterday task',
          duration: 3600,
          id: 100,
          start: dayjs().subtract(1, 'day').toISOString(),
          stop: dayjs().subtract(1, 'day').add(1, 'hour').toISOString(),
          workspace_id: 1,
        },
      ]
      mockClient.getTimeEntries.onSecondCall().resolves(yesterdayEntries)
      mockClient.getFavorites.rejects(new Error('No favorites'))

      const options = await service.getTimerOptions()

      expect(options).to.have.lengthOf(1)
      expect(options[0]?.description).to.equal('Yesterday task')
    })

    it('should respect lookbackDays parameter', async () => {
      mockClient.getFavorites.rejects(new Error('No favorites'))

      // Mock no entries for multiple days
      for (let i = 0; i < 8; i++) {
        mockClient.getTimeEntries.onCall(i).resolves([])
      }

      const options = await service.getTimerOptions({ lookbackDays: 3 })

      // Should stop after 3 days (today + 3 days back = 4 calls)
      expect(mockClient.getTimeEntries.callCount).to.equal(4)
      expect(options).to.have.lengthOf(0)
    })

    it('should sort favorites by rank', async () => {
      const favorites: Favorite[] = [
        {
          description: 'Second favorite',
          favorite_id: 2,
          rank: 2,
        },
        {
          description: 'First favorite',
          favorite_id: 1,
          rank: 1,
        },
        {
          description: 'Third favorite',
          favorite_id: 3,
          rank: 3,
        },
      ]

      mockClient.getFavorites.resolves(favorites)
      mockClient.getTimeEntries.resolves([])

      const options = await service.getTimerOptions()

      expect(options).to.have.lengthOf(3)
      expect(options[0]?.description).to.equal('First favorite')
      expect(options[1]?.description).to.equal('Second favorite')
      expect(options[2]?.description).to.equal('Third favorite')
    })

    it('should handle favorites without rank properly', async () => {
      const favorites: Favorite[] = [
        {
          description: 'No rank favorite',
          favorite_id: 1,
        },
        {
          description: 'Ranked favorite',
          favorite_id: 2,
          rank: 1,
        },
      ]

      mockClient.getFavorites.resolves(favorites)
      mockClient.getTimeEntries.resolves([])

      const options = await service.getTimerOptions()

      expect(options).to.have.lengthOf(2)
      expect(options[0]?.description).to.equal('Ranked favorite')
      expect(options[1]?.description).to.equal('No rank favorite')
    })
  })

  describe('hasMultipleOptions', () => {
    it('should return true for multiple options', () => {
      const options = [
        {description: 'Option 1', display: 'Option 1', isFavorite: false, source: 'recent' as const},
        {description: 'Option 2', display: 'Option 2', isFavorite: false, source: 'recent' as const},
      ]
      expect(service.hasMultipleOptions(options)).to.be.true
    })

    it('should return false for single option', () => {
      const options = [
        {description: 'Option 1', display: 'Option 1', isFavorite: false, source: 'recent' as const},
      ]
      expect(service.hasMultipleOptions(options)).to.be.false
    })
  })

  describe('hasSingleOption', () => {
    it('should return true for single option', () => {
      const options = [
        {description: 'Option 1', display: 'Option 1', isFavorite: false, source: 'recent' as const},
      ]
      expect(service.hasSingleOption(options)).to.be.true
    })

    it('should return false for multiple options', () => {
      const options = [
        {description: 'Option 1', display: 'Option 1', isFavorite: false, source: 'recent' as const},
        {description: 'Option 2', display: 'Option 2', isFavorite: false, source: 'recent' as const},
      ]
      expect(service.hasSingleOption(options)).to.be.false
    })
  })

  describe('hasNoOptions', () => {
    it('should return true for empty options', () => {
      expect(service.hasNoOptions([])).to.be.true
    })

    it('should return false for non-empty options', () => {
      const options = [
        {description: 'Option 1', display: 'Option 1', isFavorite: false, source: 'recent' as const},
      ]
      expect(service.hasNoOptions(options)).to.be.false
    })
  })
})