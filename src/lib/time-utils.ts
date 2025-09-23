import type {Project, TimeEntry} from './validation.js'

export interface TimeEntrySummary {
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

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatStartTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
}

export function calculateElapsedSeconds(startTime: string): number {
  const start = new Date(startTime)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / 1000)
}

export function getTodayDateRange(): DateRange {
  const now = new Date()

  // Get start and end of day in UTC
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const date = now.getUTCDate()

  const startOfDay = new Date(Date.UTC(year, month, date, 0, 0, 0, 0))
  const endOfDay = new Date(Date.UTC(year, month, date, 23, 59, 59, 999))

  return {
    end_date: endOfDay.toISOString(),
    start_date: startOfDay.toISOString(),
  }
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

    if (projectMap.has(projectName)) {
      projectMap.get(projectName)!.totalSeconds += entrySeconds
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