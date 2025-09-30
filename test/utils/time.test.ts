/**
 * Tests for Time Utilities
 *
 * Comprehensive tests for date calculations, duration formatting,
 * and time entry aggregation logic.
 */

import { expect } from 'chai'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import {
  formatDuration,
  formatStartTime,
  calculateElapsedSeconds,
  getTodayDateRange,
  getCurrentWeekDateRange,
  getPreviousWeekDateRange,
  formatWeekRange,
  formatTimeEntry,
  aggregateTimeEntriesByProject,
  groupTimeEntriesByDay,
  aggregateWeeklyProjectSummary,
  fillMissingDays,
  type DateRange,
  type DailySummary,
} from '../../src/utils/time.js'
import { TogglTimeEntry, TogglProject } from '../../src/api/client.js'

dayjs.extend(utc)
dayjs.extend(timezone)

// Set default timezone to Adelaide for consistent test behavior
dayjs.tz.setDefault('Australia/Adelaide')

describe('Time Utilities', () => {
  describe('formatDuration', () => {
    it('formats seconds only (0-59s)', () => {
      expect(formatDuration(0)).to.equal('00:00:00')
      expect(formatDuration(30)).to.equal('00:00:30')
      expect(formatDuration(59)).to.equal('00:00:59')
    })

    it('formats minutes and seconds (1-59m)', () => {
      expect(formatDuration(60)).to.equal('00:01:00')
      expect(formatDuration(90)).to.equal('00:01:30')
      expect(formatDuration(3599)).to.equal('00:59:59')
    })

    it('formats hours, minutes, seconds (1h+)', () => {
      expect(formatDuration(3600)).to.equal('01:00:00')
      expect(formatDuration(3661)).to.equal('01:01:01')
      expect(formatDuration(7200)).to.equal('02:00:00')
    })

    it('handles large durations (>24 hours)', () => {
      expect(formatDuration(86400)).to.equal('24:00:00') // 1 day
      expect(formatDuration(90000)).to.equal('25:00:00') // 25 hours
      expect(formatDuration(359999)).to.equal('99:59:59')
    })

    it('pads single digits with zeros', () => {
      expect(formatDuration(3665)).to.equal('01:01:05')
      expect(formatDuration(125)).to.equal('00:02:05')
    })
  })

  describe('formatStartTime', () => {
    it('formats ISO string to HH:mm', () => {
      const isoString = dayjs().hour(14).minute(30).second(0).toISOString()
      const formatted = formatStartTime(isoString)
      expect(formatted).to.equal('14:30')
    })

    it('pads single digit hours and minutes', () => {
      const isoString = dayjs().hour(9).minute(5).second(0).toISOString()
      const formatted = formatStartTime(isoString)
      expect(formatted).to.equal('09:05')
    })

    it('handles different ISO formats', () => {
      const formats = [
        dayjs('2023-01-01T09:05:00Z').toISOString(),
        dayjs('2023-01-01T09:05:00.000Z').toISOString(),
      ]

      formats.forEach(format => {
        const result = formatStartTime(format)
        expect(result).to.match(/^\d{2}:\d{2}$/)
      })
    })
  })

  describe('calculateElapsedSeconds', () => {
    it('calculates elapsed time from recent timestamp', () => {
      const fiveMinutesAgo = dayjs().subtract(5, 'minute').toISOString()
      const elapsed = calculateElapsedSeconds(fiveMinutesAgo)
      expect(elapsed).to.be.approximately(300, 2)
    })

    it('handles timestamps from seconds ago', () => {
      const twoSecondsAgo = dayjs().subtract(2, 'second').toISOString()
      const elapsed = calculateElapsedSeconds(twoSecondsAgo)
      expect(elapsed).to.be.approximately(2, 1)
    })

    it('handles timestamps from hours ago', () => {
      const oneHourAgo = dayjs().subtract(1, 'hour').toISOString()
      const elapsed = calculateElapsedSeconds(oneHourAgo)
      expect(elapsed).to.be.approximately(3600, 2)
    })

    it('returns negative for future timestamps', () => {
      const futureTime = dayjs().add(1, 'minute').toISOString()
      const elapsed = calculateElapsedSeconds(futureTime)
      expect(elapsed).to.be.approximately(-60, 2)
      expect(elapsed).to.be.lessThan(0)
    })
  })

  describe('getTodayDateRange', () => {
    it('returns range from start to end of current day', () => {
      const range = getTodayDateRange()
      const startDate = dayjs(range.start_date)
      const endDate = dayjs(range.end_date)

      expect(startDate.hour()).to.equal(0)
      expect(startDate.minute()).to.equal(0)
      expect(startDate.second()).to.equal(0)

      expect(endDate.hour()).to.equal(23)
      expect(endDate.minute()).to.equal(59)
      expect(endDate.second()).to.equal(59)
    })

    it('returns dates for the current day', () => {
      const range = getTodayDateRange()
      const today = dayjs()
      const startDate = dayjs(range.start_date)

      expect(startDate.date()).to.equal(today.date())
      expect(startDate.month()).to.equal(today.month())
      expect(startDate.year()).to.equal(today.year())
    })
  })

  describe('getCurrentWeekDateRange', () => {
    it('returns range starting on Monday', () => {
      const range = getCurrentWeekDateRange()
      const startDate = dayjs(range.start_date)
      expect(startDate.day()).to.equal(1) // Monday
    })

    it('returns range ending on Sunday', () => {
      const range = getCurrentWeekDateRange()
      const endDate = dayjs(range.end_date)
      expect(endDate.day()).to.equal(0) // Sunday
    })

    it('spans exactly 7 days', () => {
      const range = getCurrentWeekDateRange()
      const startDate = dayjs(range.start_date).startOf('day')
      const endDate = dayjs(range.end_date).startOf('day')
      const daysDiff = endDate.diff(startDate, 'days')
      expect(daysDiff).to.equal(6) // Monday to Sunday is 6 days difference
    })

    it('includes current date within range', () => {
      const range = getCurrentWeekDateRange()
      const now = dayjs()
      const startDate = dayjs(range.start_date)
      const endDate = dayjs(range.end_date)

      const isAfterOrSameAsStart = now.isAfter(startDate) || now.isSame(startDate)
      const isBeforeOrSameAsEnd = now.isBefore(endDate) || now.isSame(endDate)

      expect(isAfterOrSameAsStart).to.be.true
      expect(isBeforeOrSameAsEnd).to.be.true
    })
  })

  describe('getPreviousWeekDateRange', () => {
    it('returns range starting on previous Monday', () => {
      const range = getPreviousWeekDateRange()
      const startDate = dayjs(range.start_date)
      expect(startDate.day()).to.equal(1) // Monday
    })

    it('returns range ending on previous Sunday', () => {
      const range = getPreviousWeekDateRange()
      const endDate = dayjs(range.end_date)
      expect(endDate.day()).to.equal(0) // Sunday
    })

    it('is before current week', () => {
      const currentWeek = getCurrentWeekDateRange()
      const previousWeek = getPreviousWeekDateRange()
      const currentStart = dayjs(currentWeek.start_date)
      const previousEnd = dayjs(previousWeek.end_date)

      expect(previousEnd.isBefore(currentStart)).to.be.true
    })

    it('spans exactly 7 days', () => {
      const range = getPreviousWeekDateRange()
      const startDate = dayjs(range.start_date).startOf('day')
      const endDate = dayjs(range.end_date).startOf('day')
      const daysDiff = endDate.diff(startDate, 'days')
      expect(daysDiff).to.equal(6)
    })
  })

  describe('formatWeekRange', () => {
    it('formats date range in readable format', () => {
      const range: DateRange = {
        start_date: dayjs('2023-12-04').toISOString(), // Monday
        end_date: dayjs('2023-12-10').toISOString(), // Sunday
      }
      const formatted = formatWeekRange(range)
      expect(formatted).to.equal('Dec 4 - Dec 10, 2023')
    })

    it('handles range spanning months', () => {
      const range: DateRange = {
        start_date: dayjs('2023-12-25').toISOString(),
        end_date: dayjs('2023-12-31').toISOString(),
      }
      const formatted = formatWeekRange(range)
      expect(formatted).to.equal('Dec 25 - Dec 31, 2023')
    })

    it('handles range spanning years', () => {
      const range: DateRange = {
        start_date: dayjs('2023-12-25').toISOString(),
        end_date: dayjs('2024-01-07').toISOString(),
      }
      const formatted = formatWeekRange(range)
      expect(formatted).to.equal('Dec 25 - Jan 7, 2024')
    })
  })

  describe('formatTimeEntry', () => {
    const mockProjects: TogglProject[] = [
      {
        id: 101,
        name: 'Test Project',
        color: '#ff0000',
        active: true,
        workspace_id: 12345,
        billable: false,
      },
    ]

    it('formats completed time entry with project', () => {
      const entry: TogglTimeEntry = {
        id: 1,
        description: 'Working on feature',
        start: '2023-12-25T10:00:00Z',
        stop: '2023-12-25T11:30:00Z',
        duration: 5400,
        project_id: 101,
        workspace_id: 12345,
        billable: false,
        created_with: 'tog',
      }

      const formatted = formatTimeEntry(entry, mockProjects)

      expect(formatted.description).to.equal('Working on feature')
      expect(formatted.projectName).to.equal('Test Project')
      expect(formatted.duration).to.equal('01:30:00')
      expect(formatted.date).to.equal('2023-12-25')
      expect(formatted.startTime).to.match(/^\d{2}:\d{2}$/)
      expect(formatted.endTime).to.match(/^\d{2}:\d{2}$/)
    })

    it('formats running time entry (no stop time)', () => {
      const fiveMinutesAgo = dayjs().subtract(5, 'minute').toISOString()
      const entry: TogglTimeEntry = {
        id: 2,
        description: 'Current task',
        start: fiveMinutesAgo,
        stop: null,
        duration: -1,
        workspace_id: 12345,
        billable: false,
        created_with: 'tog',
      }

      const formatted = formatTimeEntry(entry, mockProjects)

      expect(formatted.description).to.equal('Current task')
      expect(formatted.endTime).to.equal('Running')
      const durationSeconds = parseInt(formatted.duration.split(':')[1], 10) * 60
      expect(durationSeconds).to.be.approximately(300, 10)
    })

    it('formats entry without project', () => {
      const entry: TogglTimeEntry = {
        id: 3,
        description: 'Solo work',
        start: '2023-12-25T10:00:00Z',
        stop: '2023-12-25T10:30:00Z',
        duration: 1800,
        workspace_id: 12345,
        billable: false,
        created_with: 'tog',
      }

      const formatted = formatTimeEntry(entry, mockProjects)

      expect(formatted.description).to.equal('Solo work')
      expect(formatted.projectName).to.be.undefined
      expect(formatted.duration).to.equal('00:30:00')
    })

    it('handles empty description', () => {
      const entry: TogglTimeEntry = {
        id: 4,
        description: '',
        start: '2023-12-25T10:00:00Z',
        stop: '2023-12-25T10:10:00Z',
        duration: 600,
        workspace_id: 12345,
        billable: false,
        created_with: 'tog',
      }

      const formatted = formatTimeEntry(entry, mockProjects)

      expect(formatted.description).to.equal('Untitled')
    })
  })

  describe('aggregateTimeEntriesByProject', () => {
    const mockProjects: TogglProject[] = [
      {
        id: 101,
        name: 'Project A',
        color: '#ff0000',
        active: true,
        workspace_id: 12345,
        billable: false,
      },
      {
        id: 102,
        name: 'Project B',
        color: '#00ff00',
        active: true,
        workspace_id: 12345,
        billable: false,
      },
    ]

    it('aggregates entries by project', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task 1',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T11:00:00Z',
          duration: 3600,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 2,
          description: 'Task 2',
          start: '2023-12-25T11:00:00Z',
          stop: '2023-12-25T12:00:00Z',
          duration: 3600,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 3,
          description: 'Task 3',
          start: '2023-12-25T12:00:00Z',
          stop: '2023-12-25T13:00:00Z',
          duration: 3600,
          project_id: 102,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const summaries = aggregateTimeEntriesByProject(entries, mockProjects)

      expect(summaries).to.have.lengthOf(2)
      expect(summaries[0].projectName).to.equal('Project A')
      expect(summaries[0].totalSeconds).to.equal(7200)
      expect(summaries[0].percentage).to.equal(67)
      expect(summaries[1].projectName).to.equal('Project B')
      expect(summaries[1].totalSeconds).to.equal(3600)
      expect(summaries[1].percentage).to.equal(33)
    })

    it('handles entries without projects', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'No project task',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T11:00:00Z',
          duration: 3600,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const summaries = aggregateTimeEntriesByProject(entries, mockProjects)

      expect(summaries).to.have.lengthOf(1)
      expect(summaries[0].projectName).to.equal('No Project')
      expect(summaries[0].totalSeconds).to.equal(3600)
      expect(summaries[0].percentage).to.equal(100)
    })

    it('sorts by total time descending', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task 1',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T11:00:00Z',
          duration: 1800,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 2,
          description: 'Task 2',
          start: '2023-12-25T11:00:00Z',
          stop: '2023-12-25T13:00:00Z',
          duration: 7200,
          project_id: 102,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const summaries = aggregateTimeEntriesByProject(entries, mockProjects)

      expect(summaries[0].projectName).to.equal('Project B')
      expect(summaries[0].totalSeconds).to.equal(7200)
      expect(summaries[1].projectName).to.equal('Project A')
      expect(summaries[1].totalSeconds).to.equal(1800)
    })

    it('handles running entries', () => {
      const oneHourAgo = dayjs().subtract(1, 'hour').toISOString()
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Running task',
          start: oneHourAgo,
          stop: null,
          duration: -1,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const summaries = aggregateTimeEntriesByProject(entries, mockProjects)

      expect(summaries).to.have.lengthOf(1)
      expect(summaries[0].totalSeconds).to.be.approximately(3600, 5)
    })

    it('calculates percentages correctly', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task 1',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T11:00:00Z',
          duration: 3000,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 2,
          description: 'Task 2',
          start: '2023-12-25T11:00:00Z',
          stop: '2023-12-25T12:00:00Z',
          duration: 7000,
          project_id: 102,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const summaries = aggregateTimeEntriesByProject(entries, mockProjects)

      const totalPercentage = summaries.reduce((sum, s) => sum + s.percentage, 0)
      expect(totalPercentage).to.be.approximately(100, 1)
    })

    it('returns empty array for no entries', () => {
      const summaries = aggregateTimeEntriesByProject([], mockProjects)
      expect(summaries).to.be.an('array').that.is.empty
    })
  })

  describe('groupTimeEntriesByDay', () => {
    const mockProjects: TogglProject[] = [
      {
        id: 101,
        name: 'Project A',
        color: '#ff0000',
        active: true,
        workspace_id: 12345,
        billable: false,
      },
    ]

    it('groups entries by date', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task 1',
          start: '2023-06-15T10:00:00Z',
          stop: '2023-06-15T11:00:00Z',
          duration: 3600,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 2,
          description: 'Task 2',
          start: '2023-06-15T14:00:00Z',
          stop: '2023-06-15T15:00:00Z',
          duration: 3600,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 3,
          description: 'Task 3',
          start: '2023-06-16T10:00:00Z',
          stop: '2023-06-16T11:00:00Z',
          duration: 3600,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const grouped = groupTimeEntriesByDay(entries, mockProjects)

      const totalEntries = grouped.reduce((sum, day) => sum + day.entries.length, 0)
      const totalTime = grouped.reduce((sum, day) => sum + day.totalSeconds, 0)

      expect(totalEntries).to.equal(3)
      expect(totalTime).to.equal(10800)
      expect(grouped.length).to.be.greaterThan(0)
    })

    it('includes day name in summary', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T11:00:00Z',
          duration: 3600,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const grouped = groupTimeEntriesByDay(entries, mockProjects)

      expect(grouped[0].dayName).to.equal('Monday')
    })

    it('sorts days chronologically', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task 1',
          start: '2023-12-27T10:00:00Z',
          stop: '2023-12-27T11:00:00Z',
          duration: 3600,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 2,
          description: 'Task 2',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T11:00:00Z',
          duration: 3600,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 3,
          description: 'Task 3',
          start: '2023-12-26T10:00:00Z',
          stop: '2023-12-26T11:00:00Z',
          duration: 3600,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const grouped = groupTimeEntriesByDay(entries, mockProjects)

      expect(grouped.length).to.be.greaterThan(0)
      for (let i = 1; i < grouped.length; i++) {
        expect(grouped[i].date >= grouped[i - 1].date).to.be.true
      }
    })

    it('formats total duration correctly', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task 1',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T11:30:00Z',
          duration: 5400,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const grouped = groupTimeEntriesByDay(entries, mockProjects)

      expect(grouped[0].formattedDuration).to.equal('01:30:00')
    })

    it('returns empty array for no entries', () => {
      const grouped = groupTimeEntriesByDay([], mockProjects)
      expect(grouped).to.be.an('array').that.is.empty
    })
  })

  describe('aggregateWeeklyProjectSummary', () => {
    const mockProjects: TogglProject[] = [
      {
        id: 101,
        name: 'Project A',
        color: '#ff0000',
        active: true,
        workspace_id: 12345,
        billable: false,
      },
      {
        id: 102,
        name: 'Project B',
        color: '#00ff00',
        active: true,
        workspace_id: 12345,
        billable: false,
      },
    ]

    it('aggregates weekly summary with days worked', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task 1',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T11:00:00Z',
          duration: 3600,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 2,
          description: 'Task 2',
          start: '2023-12-26T10:00:00Z',
          stop: '2023-12-26T11:00:00Z',
          duration: 3600,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 3,
          description: 'Task 3',
          start: '2023-12-27T10:00:00Z',
          stop: '2023-12-27T11:00:00Z',
          duration: 3600,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const summaries = aggregateWeeklyProjectSummary(entries, mockProjects)

      expect(summaries).to.have.lengthOf(1)
      expect(summaries[0].projectName).to.equal('Project A')
      expect(summaries[0].totalSeconds).to.equal(10800)
      expect(summaries[0].daysWorked).to.equal(3)
      expect(summaries[0].dailyAverage).to.equal('01:00:00')
    })

    it('calculates daily average correctly', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task 1',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T15:00:00Z',
          duration: 18000,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 2,
          description: 'Task 2',
          start: '2023-12-26T10:00:00Z',
          stop: '2023-12-26T12:00:00Z',
          duration: 7200,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const summaries = aggregateWeeklyProjectSummary(entries, mockProjects)

      expect(summaries[0].daysWorked).to.equal(2)
      const expectedAverage = (18000 + 7200) / 2
      expect(summaries[0].totalSeconds / summaries[0].daysWorked).to.equal(expectedAverage)
    })

    it('handles multiple projects worked on same day', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task 1',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T11:00:00Z',
          duration: 3600,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 2,
          description: 'Task 2',
          start: '2023-12-25T11:00:00Z',
          stop: '2023-12-25T12:00:00Z',
          duration: 3600,
          project_id: 102,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const summaries = aggregateWeeklyProjectSummary(entries, mockProjects)

      expect(summaries).to.have.lengthOf(2)
      expect(summaries[0].daysWorked).to.equal(1)
      expect(summaries[1].daysWorked).to.equal(1)
    })

    it('sorts by total time descending', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task 1',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T11:00:00Z',
          duration: 1800,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 2,
          description: 'Task 2',
          start: '2023-12-25T11:00:00Z',
          stop: '2023-12-25T13:00:00Z',
          duration: 7200,
          project_id: 102,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const summaries = aggregateWeeklyProjectSummary(entries, mockProjects)

      expect(summaries[0].projectName).to.equal('Project B')
      expect(summaries[1].projectName).to.equal('Project A')
    })

    it('calculates percentages correctly', () => {
      const entries: TogglTimeEntry[] = [
        {
          id: 1,
          description: 'Task 1',
          start: '2023-12-25T10:00:00Z',
          stop: '2023-12-25T11:00:00Z',
          duration: 3000,
          project_id: 101,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
        {
          id: 2,
          description: 'Task 2',
          start: '2023-12-25T11:00:00Z',
          stop: '2023-12-25T12:00:00Z',
          duration: 7000,
          project_id: 102,
          workspace_id: 12345,
          billable: false,
          created_with: 'tog',
        },
      ]

      const summaries = aggregateWeeklyProjectSummary(entries, mockProjects)

      const totalPercentage = summaries.reduce((sum, s) => sum + s.percentage, 0)
      expect(totalPercentage).to.be.approximately(100, 1)
    })
  })

  describe('fillMissingDays', () => {
    const mockDateRange: DateRange = {
      start_date: '2023-12-25T00:00:00.000Z', // Monday
      end_date: '2023-12-31T23:59:59.999Z', // Sunday
    }

    it('fills all 7 days of the week', () => {
      const dailySummaries: DailySummary[] = []
      const filled = fillMissingDays(dailySummaries, mockDateRange)

      expect(filled).to.have.lengthOf(7)
      expect(filled[0].date).to.equal('2023-12-25')
      expect(filled[6].date).to.equal('2023-12-31')
    })

    it('preserves existing days with data', () => {
      const dailySummaries = [
        {
          date: '2023-12-25',
          dayName: 'Monday',
          entries: [],
          formattedDuration: '02:00:00',
          totalSeconds: 7200,
        },
      ]

      const filled = fillMissingDays(dailySummaries, mockDateRange)

      expect(filled[0].totalSeconds).to.equal(7200)
      expect(filled[0].formattedDuration).to.equal('02:00:00')
    })

    it('adds empty days for missing dates', () => {
      const dailySummaries: DailySummary[] = [
        {
          date: '2023-12-25',
          dayName: 'Monday',
          entries: [],
          formattedDuration: '02:00:00',
          totalSeconds: 7200,
        },
      ]

      const filled = fillMissingDays(dailySummaries, mockDateRange)

      expect(filled[1].date).to.equal('2023-12-26')
      expect(filled[1].totalSeconds).to.equal(0)
      expect(filled[1].formattedDuration).to.equal('00:00:00')
      expect(filled[1].entries).to.be.empty
    })

    it('sets correct day names for empty days', () => {
      const dailySummaries: DailySummary[] = []
      const filled = fillMissingDays(dailySummaries, mockDateRange)

      expect(filled[0].dayName).to.equal('Monday')
      expect(filled[1].dayName).to.equal('Tuesday')
      expect(filled[2].dayName).to.equal('Wednesday')
      expect(filled[3].dayName).to.equal('Thursday')
      expect(filled[4].dayName).to.equal('Friday')
      expect(filled[5].dayName).to.equal('Saturday')
      expect(filled[6].dayName).to.equal('Sunday')
    })

    it('maintains chronological order', () => {
      const dailySummaries = [
        {
          date: '2023-12-27',
          dayName: 'Wednesday',
          entries: [],
          formattedDuration: '01:00:00',
          totalSeconds: 3600,
        },
        {
          date: '2023-12-25',
          dayName: 'Monday',
          entries: [],
          formattedDuration: '02:00:00',
          totalSeconds: 7200,
        },
      ]

      const filled = fillMissingDays(dailySummaries, mockDateRange)

      expect(filled[0].date).to.equal('2023-12-25')
      expect(filled[2].date).to.equal('2023-12-27')
    })
  })
})
