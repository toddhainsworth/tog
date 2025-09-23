import Table from 'cli-table3'

import type {ProjectSummary, TimeEntrySummary} from './time-utils.js'

export function createTimeEntriesTable(entries: TimeEntrySummary[]): string {
  const table = new Table({
    colWidths: [8, 10, 10, 40, 20],
    head: ['Start', 'End', 'Duration', 'Description', 'Project'],
    style: {
      border: ['gray'],
      head: ['cyan'],
    },
  })

  for (const entry of entries) {
    table.push([
      entry.startTime,
      entry.endTime,
      entry.duration,
      entry.description,
      entry.projectName || '-',
    ])
  }

  return table.toString()
}

export function createProjectSummaryTable(projects: ProjectSummary[]): string {
  const table = new Table({
    colWidths: [30, 12, 12],
    head: ['Project', 'Duration', 'Percentage'],
    style: {
      border: ['gray'],
      head: ['cyan'],
    },
  })

  for (const project of projects) {
    table.push([
      project.projectName,
      project.formattedDuration,
      `${project.percentage}%`,
    ])
  }

  return table.toString()
}

export function formatGrandTotal(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}