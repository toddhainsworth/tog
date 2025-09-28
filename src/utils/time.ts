/**
 * Time Utility Functions
 *
 * Centralized time handling, date calculations, and duration formatting
 * for reporting commands. Handles timezone consistency and week boundaries.
 */

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import { TogglTimeEntry, TogglProject } from '../api/client.js'

dayjs.extend(utc)

/**
 * Time formatting constants
 */
const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600
const MILLISECONDS_PER_SECOND = 1000

/**
 * Date range interface
 */
export interface DateRange {
  start_date: string
  end_date: string
}

/**
 * Time entry summary for display
 */
export interface TimeEntrySummary {
  date: string
  description: string
  duration: string
  endTime: string
  projectName?: string
  startTime: string
}

/**
 * Project summary with aggregated data
 */
export interface ProjectSummary {
  projectName: string
  formattedDuration: string
  totalSeconds: number
  percentage: number
}

/**
 * Daily summary for week view
 */
export interface DailySummary {
  date: string
  dayName: string
  entries: TimeEntrySummary[]
  formattedDuration: string
  totalSeconds: number
}

/**
 * Weekly project summary with additional metrics
 */
export interface WeeklyProjectSummary {
  projectName: string
  formattedDuration: string
  totalSeconds: number
  percentage: number
  daysWorked: number
  dailyAverage: string
}

/**
 * Format seconds as HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const secs = seconds % SECONDS_PER_MINUTE

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format start time as HH:MM
 */
export function formatStartTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Calculate elapsed seconds for running timer
 */
export function calculateElapsedSeconds(startTime: string): number {
  const start = new Date(startTime)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / MILLISECONDS_PER_SECOND)
}

/**
 * Get today's date range (start to end of day)
 */
export function getTodayDateRange(): DateRange {
  const today = dayjs()
  return {
    start_date: today.startOf('day').toISOString(),
    end_date: today.endOf('day').toISOString()
  }
}

/**
 * Get current week date range (Monday to Sunday)
 */
export function getCurrentWeekDateRange(): DateRange {
  const now = new Date()

  // Calculate Monday of current week
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Sunday is 0, Monday is 1

  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return {
    start_date: monday.toISOString(),
    end_date: sunday.toISOString()
  }
}

/**
 * Get previous week date range (Monday to Sunday)
 */
export function getPreviousWeekDateRange(): DateRange {
  const currentWeek = getCurrentWeekDateRange()

  const previousStart = new Date(currentWeek.start_date)
  previousStart.setDate(previousStart.getDate() - 7)

  const previousEnd = new Date(currentWeek.end_date)
  previousEnd.setDate(previousEnd.getDate() - 7)

  return {
    start_date: previousStart.toISOString(),
    end_date: previousEnd.toISOString()
  }
}

/**
 * Format week range for display
 */
export function formatWeekRange(dateRange: DateRange): string {
  const start = dayjs(dateRange.start_date).format('MMM D')
  const end = dayjs(dateRange.end_date).format('MMM D, YYYY')
  return `${start} - ${end}`
}

/**
 * Format time entry for display
 */
export function formatTimeEntry(
  entry: TogglTimeEntry,
  projects: TogglProject[] = []
): TimeEntrySummary {
  const project = entry.project_id
    ? projects.find(p => p.id === entry.project_id)
    : undefined

  const duration = entry.stop
    ? entry.duration
    : calculateElapsedSeconds(entry.start)

  const endTime = entry.stop
    ? formatStartTime(entry.stop)
    : 'Running'

  return {
    date: dayjs(entry.start).format('YYYY-MM-DD'),
    description: entry.description || 'Untitled',
    duration: formatDuration(duration),
    endTime,
    projectName: project?.name,
    startTime: formatStartTime(entry.start)
  }
}

/**
 * Aggregate time entries by project
 */
export function aggregateTimeEntriesByProject(
  entries: TogglTimeEntry[],
  projects: TogglProject[] = []
): ProjectSummary[] {
  const projectMap = new Map<string, { projectName: string; totalSeconds: number }>()
  let totalSeconds = 0

  for (const entry of entries) {
    const project = entry.project_id
      ? projects.find(p => p.id === entry.project_id)
      : undefined
    const projectName = project?.name || 'No Project'
    const entrySeconds = entry.stop
      ? entry.duration
      : calculateElapsedSeconds(entry.start)

    totalSeconds += entrySeconds

    const existing = projectMap.get(projectName)
    if (existing) {
      existing.totalSeconds += entrySeconds
    } else {
      projectMap.set(projectName, { projectName, totalSeconds: entrySeconds })
    }
  }

  // Convert to array and calculate percentages
  const summaries: ProjectSummary[] = []
  for (const projectData of projectMap.values()) {
    const percentage = totalSeconds > 0
      ? Math.round((projectData.totalSeconds / totalSeconds) * 100)
      : 0

    summaries.push({
      projectName: projectData.projectName,
      formattedDuration: formatDuration(projectData.totalSeconds),
      totalSeconds: projectData.totalSeconds,
      percentage
    })
  }

  // Sort by total time descending
  return summaries.sort((a, b) => b.totalSeconds - a.totalSeconds)
}

/**
 * Group time entries by day
 */
export function groupTimeEntriesByDay(
  entries: TogglTimeEntry[],
  projects: TogglProject[] = []
): DailySummary[] {
  const dayMap = new Map<string, TogglTimeEntry[]>()

  // Group entries by date
  for (const entry of entries) {
    const dateKey = dayjs(entry.start).format('YYYY-MM-DD')
    const existingDay = dayMap.get(dateKey)
    if (existingDay) {
      existingDay.push(entry)
    } else {
      dayMap.set(dateKey, [entry])
    }
  }

  // Convert to daily summaries
  const summaries: DailySummary[] = []
  for (const [dateKey, dayEntries] of dayMap.entries()) {
    let totalSeconds = 0
    const entrySummaries: TimeEntrySummary[] = []

    for (const entry of dayEntries) {
      const entrySeconds = entry.stop
        ? entry.duration
        : calculateElapsedSeconds(entry.start)
      totalSeconds += entrySeconds
      entrySummaries.push(formatTimeEntry(entry, projects))
    }

    const dayName = dayjs(dateKey).format('dddd')

    summaries.push({
      date: dateKey,
      dayName,
      entries: entrySummaries,
      formattedDuration: formatDuration(totalSeconds),
      totalSeconds
    })
  }

  // Sort by date
  return summaries.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Aggregate weekly project summary with additional metrics
 */
export function aggregateWeeklyProjectSummary(
  entries: TogglTimeEntry[],
  projects: TogglProject[] = []
): WeeklyProjectSummary[] {
  const projectMap = new Map<string, { days: Set<string>; totalSeconds: number }>()
  let totalSeconds = 0

  // Aggregate by project and track days worked
  for (const entry of entries) {
    const project = entry.project_id
      ? projects.find(p => p.id === entry.project_id)
      : undefined
    const projectName = project?.name || 'No Project'
    const entrySeconds = entry.stop
      ? entry.duration
      : calculateElapsedSeconds(entry.start)
    const entryDate = dayjs(entry.start).format('YYYY-MM-DD')

    totalSeconds += entrySeconds

    const existing = projectMap.get(projectName)
    if (existing) {
      existing.totalSeconds += entrySeconds
      existing.days.add(entryDate)
    } else {
      projectMap.set(projectName, {
        totalSeconds: entrySeconds,
        days: new Set([entryDate])
      })
    }
  }

  // Convert to weekly summaries
  const summaries: WeeklyProjectSummary[] = []
  for (const [projectName, data] of projectMap.entries()) {
    const percentage = totalSeconds > 0
      ? Math.round((data.totalSeconds / totalSeconds) * 100)
      : 0

    const dailyAverageSeconds = data.days.size > 0
      ? data.totalSeconds / data.days.size
      : 0

    summaries.push({
      projectName,
      formattedDuration: formatDuration(data.totalSeconds),
      totalSeconds: data.totalSeconds,
      percentage,
      daysWorked: data.days.size,
      dailyAverage: formatDuration(Math.round(dailyAverageSeconds))
    })
  }

  // Sort by total time descending
  return summaries.sort((a, b) => b.totalSeconds - a.totalSeconds)
}

/**
 * Fill missing days in a week with empty entries
 */
export function fillMissingDays(
  dailySummaries: DailySummary[],
  dateRange: DateRange
): DailySummary[] {
  const existingDaysMap = new Map(dailySummaries.map(d => [d.date, d]))
  const completeDays: DailySummary[] = []

  // Generate all 7 days of the week
  const startDate = new Date(dateRange.start_date)
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    const dateKey = dayjs(currentDate).format('YYYY-MM-DD')

    const existingDay = existingDaysMap.get(dateKey)
    if (existingDay) {
      completeDays.push(existingDay)
    } else {
      // Create empty day
      const dayName = currentDate.toLocaleDateString([], { weekday: 'long' })
      completeDays.push({
        date: dateKey,
        dayName,
        entries: [],
        formattedDuration: '00:00:00',
        totalSeconds: 0
      })
    }
  }

  return completeDays
}