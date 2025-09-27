import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)

import type {Project, TimeEntry} from './validation.js'

import {
  DEFAULT_TIME_FORMAT,
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  TIME_FORMAT_PAD_CHAR,
  TIME_FORMAT_PADDING_LENGTH,
  TOGGL_FOUNDED_DATE
} from './constants.js'

export interface TimeEntrySummary {
  date: string
  description: string
  duration: string
  endTime: string
  projectName?: string
  startTime: string
}

export interface ProjectSummary {
  formattedDuration: string
  percentage: number
  projectName: string
  totalSeconds: number
}

export interface DateRange {
  end_date: string
  start_date: string
}

export interface DailySummary {
  date: string
  dayName: string
  entries: TimeEntrySummary[]
  formattedDuration: string
  totalSeconds: number
}

export interface WeeklyProjectSummary {
  dailyAverage: string
  daysWorked: number
  formattedDuration: string
  percentage: number
  projectName: string
  totalSeconds: number
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const secs = seconds % SECONDS_PER_MINUTE

  return `${hours.toString().padStart(TIME_FORMAT_PADDING_LENGTH, TIME_FORMAT_PAD_CHAR)}:${minutes.toString().padStart(TIME_FORMAT_PADDING_LENGTH, TIME_FORMAT_PAD_CHAR)}:${secs.toString().padStart(TIME_FORMAT_PADDING_LENGTH, TIME_FORMAT_PAD_CHAR)}`
}

export function formatStartTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
}

export function calculateElapsedSeconds(startTime: string): number {
  const start = new Date(startTime)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / MILLISECONDS_PER_SECOND)
}

export function getTodayDateRange(): DateRange {
  const today = dayjs()

  return {
    end_date: today.endOf('day').toISOString(),
    start_date: today.startOf('day').toISOString(),
  }
}

export function getDateRange(date: dayjs.Dayjs): DateRange {
  return {
    end_date: date.endOf('day').toISOString(),
    start_date: date.startOf('day').toISOString(),
  }
}

export function getPastDaysDateRange(daysAgo: number): DateRange {
  const date = dayjs().subtract(daysAgo, 'day')
  return getDateRange(date)
}

export function getCurrentMonthDateRange(): DateRange {
  const currentMonth = dayjs()

  return {
    end_date: currentMonth.endOf('month').toISOString(),
    start_date: currentMonth.startOf('month').toISOString(),
  }
}

export function getCurrentYearDateRange(): DateRange {
  const currentYear = dayjs()

  return {
    end_date: currentYear.endOf('year').toISOString(),
    start_date: currentYear.startOf('year').toISOString(),
  }
}

/**
 * Get date range for searching all time entries.
 * Uses TOGGL_FOUNDED_DATE as start date since Toggl was founded in TOGGL_FOUNDED_YEAR,
 * ensuring we capture the earliest possible time entries.
 */
export function getAllTimeSearchRange(): DateRange {
  return {
    end_date: dayjs().endOf('day').toISOString(),
    start_date: dayjs(TOGGL_FOUNDED_DATE).startOf('day').toISOString(),
  }
}

export function getCurrentWeekDateRange(): DateRange {
  const now = new Date()

  // Get current week (Monday to Sunday) in local time
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Sunday is 0, Monday is 1

  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return {
    end_date: sunday.toISOString(),
    start_date: monday.toISOString(),
  }
}

export function getPreviousWeekDateRange(): DateRange {
  const currentWeek = getCurrentWeekDateRange()

  // Subtract 7 days from both start and end using local time
  const previousStart = new Date(currentWeek.start_date)
  previousStart.setDate(previousStart.getDate() - 7)

  const previousEnd = new Date(currentWeek.end_date)
  previousEnd.setDate(previousEnd.getDate() - 7)

  return {
    end_date: previousEnd.toISOString(),
    start_date: previousStart.toISOString(),
  }
}

export function formatWeekRange(dateRange: DateRange): string {
  const start = new Date(dateRange.start_date)
  const end = new Date(dateRange.end_date)

  const startStr = start.toLocaleDateString('en-US', {day: 'numeric', month: 'short', timeZone: 'UTC'})
  const endStr = end.toLocaleDateString('en-US', {day: 'numeric', month: 'short', timeZone: 'UTC', year: 'numeric'})

  return `${startStr} - ${endStr}`
}

export function formatTimeEntry(entry: TimeEntry, projects: Project[] = []): TimeEntrySummary {
  const project = entry.project_id ? projects.find(p => p.id === entry.project_id) : undefined
  const startTime = formatStartTime(entry.start)

  let endTime: string
  let duration: string

  if (entry.stop) {
    endTime = formatStartTime(entry.stop)
    duration = formatDuration(entry.duration)
  } else {
    endTime = 'Running'
    const elapsedSeconds = calculateElapsedSeconds(entry.start)
    duration = formatDuration(elapsedSeconds)
  }

  return {
    date: dayjs(entry.start).format('MMM DD'),
    description: entry.description || 'No description',
    duration,
    endTime,
    projectName: project?.name,
    startTime,
  }
}

export function aggregateTimeEntriesByProject(entries: TimeEntry[], projects: Project[] = []): ProjectSummary[] {
  const projectMap = new Map<string, {projectName: string; totalSeconds: number;}>()
  let totalSeconds = 0

  for (const entry of entries) {
    const project = entry.project_id ? projects.find(p => p.id === entry.project_id) : undefined
    const projectName = project?.name || 'No Project'
    const entrySeconds = entry.stop ? entry.duration : calculateElapsedSeconds(entry.start)

    totalSeconds += entrySeconds

    const existingProject = projectMap.get(projectName)
    if (existingProject) {
      existingProject.totalSeconds += entrySeconds
    } else {
      projectMap.set(projectName, {
        projectName,
        totalSeconds: entrySeconds,
      })
    }
  }

  return [...projectMap.values()]
    .map(({projectName, totalSeconds: projectSeconds}) => ({
      formattedDuration: formatDuration(projectSeconds),
      percentage: calculatePercentage(projectSeconds, totalSeconds),
      projectName,
      totalSeconds: projectSeconds,
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
}

export function calculatePercentage(projectSeconds: number, totalSeconds: number): number {
  if (totalSeconds === 0) return 0
  return Math.round((projectSeconds / totalSeconds) * 100)
}

export function groupTimeEntriesByDay(entries: TimeEntry[], projects: Project[] = []): DailySummary[] {
  const dayMap = new Map<string, TimeEntry[]>()

  // Group entries by date (use local timezone to match week boundary calculation)
  for (const entry of entries) {
    const dateKey = dayjs(entry.start).format('YYYY-MM-DD')

    const existingDay = dayMap.get(dateKey)
    if (existingDay) {
      existingDay.push(entry)
    } else {
      dayMap.set(dateKey, [entry])
    }
  }

  // Convert to DailySummary array
  return [...dayMap.entries()]
    .map(([dateKey, dayEntries]) => {
      const date = new Date(dateKey)
      const dayName = date.toLocaleDateString([], {weekday: 'long'})

      const entrySummaries = dayEntries.map(entry => formatTimeEntry(entry, projects))

      let totalSeconds = 0
      for (const entry of dayEntries) {
        totalSeconds += entry.stop ? entry.duration : calculateElapsedSeconds(entry.start)
      }

      return {
        date: dateKey,
        dayName,
        entries: entrySummaries,
        formattedDuration: formatDuration(totalSeconds),
        totalSeconds,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date)) // Sort by date
}

export function aggregateWeeklyProjectSummary(entries: TimeEntry[], projects: Project[] = []): WeeklyProjectSummary[] {
  const projectMap = new Map<string, {days: Set<string>; totalSeconds: number}>()
  let totalSeconds = 0

  // Aggregate by project and track days worked
  for (const entry of entries) {
    const project = entry.project_id ? projects.find(p => p.id === entry.project_id) : undefined
    const projectName = project?.name || 'No Project'
    const entrySeconds = entry.stop ? entry.duration : calculateElapsedSeconds(entry.start)
    const entryDate = dayjs(entry.start).format('YYYY-MM-DD')

    totalSeconds += entrySeconds

    const existingProjectData = projectMap.get(projectName)
    if (existingProjectData) {
      existingProjectData.totalSeconds += entrySeconds
      existingProjectData.days.add(entryDate)
    } else {
      projectMap.set(projectName, {
        days: new Set([entryDate]),
        totalSeconds: entrySeconds,
      })
    }
  }

  // Convert to WeeklyProjectSummary array
  return [...projectMap.entries()]
    .map(([projectName, {days, totalSeconds: projectSeconds}]) => {
      const daysWorked = days.size
      const dailyAverage = daysWorked > 0 ? formatDuration(Math.round(projectSeconds / daysWorked)) : DEFAULT_TIME_FORMAT

      return {
        dailyAverage,
        daysWorked,
        formattedDuration: formatDuration(projectSeconds),
        percentage: calculatePercentage(projectSeconds, totalSeconds),
        projectName,
        totalSeconds: projectSeconds,
      }
    })
    .sort((a, b) => b.totalSeconds - a.totalSeconds) // Sort by total time descending
}