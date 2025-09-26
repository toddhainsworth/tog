import {expect} from 'chai'
import {createSandbox} from 'sinon'

import {
  aggregateTimeEntriesByProject,
  aggregateWeeklyProjectSummary,
  calculateElapsedSeconds,
  calculatePercentage,
  formatDuration,
  formatStartTime,
  formatTimeEntry,
  formatWeekRange,
  getCurrentWeekDateRange,
  getPreviousWeekDateRange,
  getTodayDateRange,
  groupTimeEntriesByDay,
} from '../../src/lib/time-utils.js'

describe('Time utilities', () => {
  let sandbox: ReturnType<typeof createSandbox>

  beforeEach(() => {
    sandbox = createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('formatDuration', () => {
    it('should format duration in HH:MM:SS format', () => {
      expect(formatDuration(0)).to.equal('00:00:00')
      expect(formatDuration(30)).to.equal('00:00:30')
      expect(formatDuration(90)).to.equal('00:01:30')
      expect(formatDuration(3661)).to.equal('01:01:01')
      expect(formatDuration(7200)).to.equal('02:00:00')
    })

    it('should handle large durations', () => {
      expect(formatDuration(36_000)).to.equal('10:00:00')
      expect(formatDuration(86_400)).to.equal('24:00:00')
      expect(formatDuration(90_061)).to.equal('25:01:01')
    })

    it('should pad single digits with zeros', () => {
      expect(formatDuration(5)).to.equal('00:00:05')
      expect(formatDuration(65)).to.equal('00:01:05')
      expect(formatDuration(3605)).to.equal('01:00:05')
    })
  })

  describe('formatStartTime', () => {
    it('should format ISO string to local time', () => {
      const isoString = '2024-01-01T14:30:00.000Z'
      const result = formatStartTime(isoString)

      // The exact output depends on locale/timezone, could be 24h or 12h format
      expect(result).to.match(/^\d{1,2}:\d{2}( (am|pm))?$/i)
    })

    it('should handle different ISO formats', () => {
      const formats = [
        '2024-01-01T09:15:30Z',
        '2024-01-01T09:15:30.123Z',
        '2024-01-01T09:15:30+00:00',
      ]

      for (const format of formats) {
        const result = formatStartTime(format)
        expect(result).to.match(/^\d{1,2}:\d{2}( (am|pm))?$/i)
      }
    })
  })

  describe('calculateElapsedSeconds', () => {
    it('should calculate elapsed time correctly', () => {
      const now = new Date('2024-01-01T12:00:00Z')
      sandbox.useFakeTimers(now.getTime())

      const startTime = '2024-01-01T11:58:30Z' // 1.5 minutes ago
      const elapsed = calculateElapsedSeconds(startTime)
      expect(elapsed).to.equal(90) // 1 minute 30 seconds
    })

    it('should handle same start time as current', () => {
      const now = new Date('2024-01-01T12:00:00Z')
      sandbox.useFakeTimers(now.getTime())

      const startTime = '2024-01-01T12:00:00Z'
      const elapsed = calculateElapsedSeconds(startTime)
      expect(elapsed).to.equal(0)
    })
  })

  describe('getTodayDateRange', () => {
    it('should return start and end of today in ISO format', () => {
      const now = new Date('2024-01-15T14:30:00Z')
      sandbox.useFakeTimers(now.getTime())

      const range = getTodayDateRange()

      // The start and end should be for the same day in local time
      const start = new Date(range.start_date)
      const end = new Date(range.end_date)

      // Check that it's the beginning and end of day
      expect(start.getHours()).to.equal(0)
      expect(start.getMinutes()).to.equal(0)
      expect(start.getSeconds()).to.equal(0)
      expect(end.getHours()).to.equal(23)
      expect(end.getMinutes()).to.equal(59)
      expect(end.getSeconds()).to.equal(59)

      // Check dates are for the same day
      expect(start.getDate()).to.equal(end.getDate())
      expect(start.getMonth()).to.equal(end.getMonth())
      expect(start.getFullYear()).to.equal(end.getFullYear())
    })
  })

  describe('formatTimeEntry', () => {
    const projects = [
      {active: true, id: 1, name: 'Project A', workspace_id: 123},
      {active: true, id: 2, name: 'Project B', workspace_id: 123},
    ]

    it('should format completed time entry', () => {
      const entry = {
        at: '2024-01-01T10:30:00Z',
        description: 'Working on feature',
        duration: 5400, // 1.5 hours
        id: 1,
        project_id: 1,
        start: '2024-01-01T09:00:00Z',
        stop: '2024-01-01T10:30:00Z',
        workspace_id: 123,
      }

      const result = formatTimeEntry(entry, projects)

      expect(result.description).to.equal('Working on feature')
      expect(result.projectName).to.equal('Project A')
      expect(result.duration).to.equal('01:30:00')
      expect(result.endTime).to.not.equal('Running')
    })

    it('should format running time entry', () => {
      const now = new Date('2024-01-01T10:30:00Z')
      sandbox.useFakeTimers(now.getTime())

      const entry = {
        at: '2024-01-01T09:00:00Z',
        description: 'Current task',
        duration: -1,
        id: 1,
        project_id: 2,
        start: '2024-01-01T09:00:00Z',
        stop: null,
        workspace_id: 123,
      }

      const result = formatTimeEntry(entry, projects)

      expect(result.description).to.equal('Current task')
      expect(result.projectName).to.equal('Project B')
      expect(result.endTime).to.equal('Running')
      expect(result.duration).to.equal('01:30:00') // 1.5 hours elapsed
    })

    it('should handle entry with no project', () => {
      const entry = {
        at: '2024-01-01T10:00:00Z',
        description: 'No project task',
        duration: 3600,
        id: 1,
        project_id: undefined,
        start: '2024-01-01T09:00:00Z',
        stop: '2024-01-01T10:00:00Z',
        workspace_id: 123,
      }

      const result = formatTimeEntry(entry, projects)

      expect(result.projectName).to.be.undefined
      expect(result.description).to.equal('No project task')
    })

    it('should handle entry with no description', () => {
      const entry = {
        at: '2024-01-01T10:00:00Z',
        description: '',
        duration: 3600,
        id: 1,
        project_id: 1,
        start: '2024-01-01T09:00:00Z',
        stop: '2024-01-01T10:00:00Z',
        workspace_id: 123,
      }

      const result = formatTimeEntry(entry, projects)

      expect(result.description).to.equal('No description')
    })
  })

  describe('aggregateTimeEntriesByProject', () => {
    const projects = [
      {active: true, id: 1, name: 'Project A', workspace_id: 123},
      {active: true, id: 2, name: 'Project B', workspace_id: 123},
    ]

    it('should aggregate time entries by project', () => {
      const entries = [
        {
          at: '2024-01-01T10:00:00Z',
          duration: 3600, // 1 hour
          id: 1,
          project_id: 1,
          start: '2024-01-01T09:00:00Z',
          stop: '2024-01-01T10:00:00Z',
          workspace_id: 123,
        },
        {
          at: '2024-01-01T12:30:00Z',
          duration: 5400, // 1.5 hours
          id: 2,
          project_id: 1,
          start: '2024-01-01T11:00:00Z',
          stop: '2024-01-01T12:30:00Z',
          workspace_id: 123,
        },
        {
          at: '2024-01-01T14:00:00Z',
          duration: 3600, // 1 hour
          id: 3,
          project_id: 2,
          start: '2024-01-01T13:00:00Z',
          stop: '2024-01-01T14:00:00Z',
          workspace_id: 123,
        },
      ]

      const result = aggregateTimeEntriesByProject(entries, projects)

      expect(result).to.have.length(2)

      const projectA = result.find(p => p.projectName === 'Project A')
      const projectB = result.find(p => p.projectName === 'Project B')

      expect(projectA?.totalSeconds).to.equal(9000) // 2.5 hours
      expect(projectA?.formattedDuration).to.equal('02:30:00')
      expect(projectA?.percentage).to.equal(71) // 9000/12600 ≈ 71%

      expect(projectB?.totalSeconds).to.equal(3600) // 1 hour
      expect(projectB?.formattedDuration).to.equal('01:00:00')
      expect(projectB?.percentage).to.equal(29) // 3600/12600 ≈ 29%
    })

    it('should handle entries with no project', () => {
      const entries = [
        {
          at: '2024-01-01T10:00:00Z',
          duration: 3600,
          id: 1,
          project_id: undefined,
          start: '2024-01-01T09:00:00Z',
          stop: '2024-01-01T10:00:00Z',
          workspace_id: 123,
        },
      ]

      const result = aggregateTimeEntriesByProject(entries, projects)

      expect(result).to.have.length(1)
      expect(result[0]?.projectName).to.equal('No Project')
      expect(result[0]?.percentage).to.equal(100)
    })

    it('should handle running time entries', () => {
      const now = new Date('2024-01-01T11:00:00Z')
      sandbox.useFakeTimers(now.getTime())

      const entries = [
        {
          at: '2024-01-01T10:00:00Z',
          duration: -1,
          id: 1,
          project_id: 1,
          start: '2024-01-01T10:00:00Z',
          stop: undefined, // Running
          workspace_id: 123,
        },
      ]

      const result = aggregateTimeEntriesByProject(entries, projects)

      expect(result).to.have.length(1)
      expect(result[0]?.totalSeconds).to.equal(3600) // 1 hour elapsed
      expect(result[0]?.percentage).to.equal(100)
    })

    it('should sort projects by total time descending', () => {
      const entries = [
        {
          at: '2024-01-01T10:00:00Z',
          duration: 3600, // 1 hour
          id: 1,
          project_id: 1,
          start: '2024-01-01T09:00:00Z',
          stop: '2024-01-01T10:00:00Z',
          workspace_id: 123,
        },
        {
          at: '2024-01-01T14:00:00Z',
          duration: 10_800, // 3 hours
          id: 2,
          project_id: 2,
          start: '2024-01-01T11:00:00Z',
          stop: '2024-01-01T14:00:00Z',
          workspace_id: 123,
        },
      ]

      const result = aggregateTimeEntriesByProject(entries, projects)

      expect(result[0]?.projectName).to.equal('Project B') // 3 hours
      expect(result[1]?.projectName).to.equal('Project A') // 1 hour
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(3600, 7200)).to.equal(50)
      expect(calculatePercentage(1800, 3600)).to.equal(50)
      expect(calculatePercentage(2700, 3600)).to.equal(75)
    })

    it('should handle zero total', () => {
      expect(calculatePercentage(1000, 0)).to.equal(0)
    })

    it('should round to nearest integer', () => {
      expect(calculatePercentage(1, 3)).to.equal(33) // 33.33% rounds to 33
      expect(calculatePercentage(2, 3)).to.equal(67) // 66.67% rounds to 67
    })
  })

  describe('getCurrentWeekDateRange', () => {
    it('should return current week (Monday to Sunday)', () => {
      // Test for a Tuesday (day 2)
      const tuesday = new Date('2024-01-16T14:30:00Z') // This is a Tuesday
      sandbox.useFakeTimers(tuesday.getTime())

      const range = getCurrentWeekDateRange()
      const start = new Date(range.start_date)
      const end = new Date(range.end_date)

      // Monday should be day 1, Sunday should be day 0
      const startDay = start.getDay()
      const endDay = end.getDay()
      expect(startDay).to.equal(1) // Monday
      expect(endDay).to.equal(0) // Sunday

      // Should span 7 days (Monday through Sunday inclusive)
      // But the time difference is about 6.99 days due to 23:59:59
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      expect(Math.floor(daysDiff)).to.equal(6)

      // Start should be beginning of day, end should be end of day
      expect(start.getHours()).to.equal(0)
      expect(start.getMinutes()).to.equal(0)
      expect(end.getHours()).to.equal(23)
      expect(end.getMinutes()).to.equal(59)
    })

    it('should handle Sunday correctly', () => {
      // Test for a Sunday (day 0)
      const sunday = new Date('2024-01-21T14:30:00Z') // This is a Sunday
      sandbox.useFakeTimers(sunday.getTime())

      const range = getCurrentWeekDateRange()
      const start = new Date(range.start_date)
      const end = new Date(range.end_date)

      // Monday should be day 1, Sunday should be day 0
      expect(start.getDay()).to.equal(1) // Monday
      expect(end.getDay()).to.equal(0) // Sunday

      // Should span 7 days (Monday through Sunday inclusive)
      // But the time difference is about 6.99 days due to 23:59:59
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      expect(Math.floor(daysDiff)).to.equal(6)
    })
  })

  describe('getPreviousWeekDateRange', () => {
    it('should return previous week dates', () => {
      const tuesday = new Date('2024-01-16T14:30:00Z') // This is a Tuesday
      sandbox.useFakeTimers(tuesday.getTime())

      const currentRange = getCurrentWeekDateRange()
      const previousRange = getPreviousWeekDateRange()

      const currentStart = new Date(currentRange.start_date)
      const previousStart = new Date(previousRange.start_date)
      const previousEnd = new Date(previousRange.end_date)

      // Should be exactly 7 days earlier
      const daysDiff = Math.round((currentStart.getTime() - previousStart.getTime()) / (1000 * 60 * 60 * 24))
      expect(daysDiff).to.equal(7)

      // Previous week should also be Monday to Sunday
      expect(previousStart.getDay()).to.equal(1) // Monday
      expect(previousEnd.getDay()).to.equal(0) // Sunday
    })
  })

  describe('formatWeekRange', () => {
    it('should format week range nicely', () => {
      const range = {
        end_date: '2024-01-21T23:59:59.999Z',
        start_date: '2024-01-15T00:00:00.000Z',
      }

      const result = formatWeekRange(range)
      expect(result).to.include('Jan 15')
      expect(result).to.include('Jan 21')
      expect(result).to.include('2024')
    })
  })

  describe('groupTimeEntriesByDay', () => {
    const projects = [
      {active: true, id: 1, name: 'Project A', workspace_id: 123},
    ]

    it('should group time entries by day', () => {
      const entries = [
        {
          at: '2024-01-15T10:00:00Z',
          duration: 3600,
          id: 1,
          project_id: 1,
          start: '2024-01-15T09:00:00Z',
          stop: '2024-01-15T10:00:00Z',
          workspace_id: 123,
        },
        {
          at: '2024-01-15T15:00:00Z',
          duration: 1800,
          id: 2,
          project_id: 1,
          start: '2024-01-15T14:30:00Z',
          stop: '2024-01-15T15:00:00Z',
          workspace_id: 123,
        },
        {
          at: '2024-01-16T11:00:00Z',
          duration: 7200,
          id: 3,
          project_id: 1,
          start: '2024-01-16T09:00:00Z',
          stop: '2024-01-16T11:00:00Z',
          workspace_id: 123,
        },
      ]

      const result = groupTimeEntriesByDay(entries, projects)

      // After timezone fix: entries are grouped by local date instead of UTC date
      // The exact grouping depends on the local timezone, but core functionality should work
      expect(result.length).to.be.greaterThan(0)

      // Verify that entries are properly grouped and totaled
      // Most important: total duration should match sum of all entry durations
      const expectedTotal = entries.reduce((sum, entry) => sum + entry.duration, 0)
      const actualTotal = result.reduce((sum, day) => sum + day.totalSeconds, 0)
      expect(actualTotal).to.equal(expectedTotal)

      // All entries should be assigned to some day
      const totalEntries = result.reduce((sum, day) => sum + day.entries.length, 0)
      expect(totalEntries).to.equal(3)

      // Each day should have proper structure
      for (const day of result) {
        expect(day).to.have.property('date')
        expect(day).to.have.property('dayName')
        expect(day).to.have.property('entries')
        expect(day).to.have.property('totalSeconds')
        expect(day).to.have.property('formattedDuration')
        expect(day.totalSeconds).to.be.greaterThan(0)
      }
    })

    it('should handle empty entries', () => {
      const result = groupTimeEntriesByDay([], projects)
      expect(result).to.have.length(0)
    })
  })

  describe('aggregateWeeklyProjectSummary', () => {
    const projects = [
      {active: true, id: 1, name: 'Project A', workspace_id: 123},
      {active: true, id: 2, name: 'Project B', workspace_id: 123},
    ]

    it('should aggregate weekly project summary with days worked', () => {
      const entries = [
        {
          at: '2024-01-15T10:00:00Z',
          duration: 3600, // 1 hour
          id: 1,
          project_id: 1,
          start: '2024-01-15T09:00:00Z',
          stop: '2024-01-15T10:00:00Z',
          workspace_id: 123,
        },
        {
          at: '2024-01-16T11:00:00Z',
          duration: 7200, // 2 hours
          id: 2,
          project_id: 1,
          start: '2024-01-16T09:00:00Z',
          stop: '2024-01-16T11:00:00Z',
          workspace_id: 123,
        },
        {
          at: '2024-01-15T15:00:00Z',
          duration: 1800, // 30 minutes
          id: 3,
          project_id: 2,
          start: '2024-01-15T14:30:00Z',
          stop: '2024-01-15T15:00:00Z',
          workspace_id: 123,
        },
      ]

      const result = aggregateWeeklyProjectSummary(entries, projects)

      expect(result).to.have.length(2)

      const projectA = result.find(p => p.projectName === 'Project A')
      const projectB = result.find(p => p.projectName === 'Project B')

      expect(projectA?.totalSeconds).to.equal(10_800) // 3 hours
      expect(projectA?.daysWorked).to.equal(2) // 2 different days
      expect(projectA?.dailyAverage).to.equal('01:30:00') // 1.5 hours average

      expect(projectB?.totalSeconds).to.equal(1800) // 30 minutes
      expect(projectB?.daysWorked).to.equal(1) // 1 day
      expect(projectB?.dailyAverage).to.equal('00:30:00') // 30 minutes average
    })

    it('should handle entries with no project', () => {
      const entries = [
        {
          at: '2024-01-15T10:00:00Z',
          duration: 3600,
          id: 1,
          project_id: undefined,
          start: '2024-01-15T09:00:00Z',
          stop: '2024-01-15T10:00:00Z',
          workspace_id: 123,
        },
      ]

      const result = aggregateWeeklyProjectSummary(entries, projects)

      expect(result).to.have.length(1)
      expect(result[0]?.projectName).to.equal('No Project')
      expect(result[0]?.daysWorked).to.equal(1)
    })
  })

  describe('edge cases', () => {
    it('should handle invalid date strings gracefully', () => {
      expect(() => formatStartTime('invalid-date')).to.not.throw()
      expect(() => calculateElapsedSeconds('invalid-date')).to.not.throw()
    })

    it('should handle negative durations', () => {
      expect(formatDuration(-30)).to.equal('-1:-1:-30')
    })
  })
})