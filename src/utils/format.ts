/**
 * Output Formatting Utilities
 *
 * Simple helpers for consistent CLI output formatting
 */

import dayjs from 'dayjs'

/**
 * Format success messages with green checkmark
 */
export function formatSuccess(message: string): string {
  return `✅ ${message}`
}

/**
 * Format error messages with red X
 */
export function formatError(message: string): string {
  return `❌ ${message}`
}

/**
 * Format warning messages with yellow warning sign
 */
export function formatWarning(message: string): string {
  return `⚠️  ${message}`
}

/**
 * Format info messages with blue info icon
 */
export function formatInfo(message: string): string {
  return `ℹ️  ${message}`
}

/**
 * Format duration in human-readable format
 *
 * @param seconds - Duration in seconds (negative for running timer)
 * @param precise - If true, returns HH:MM:SS format, otherwise human-readable
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number, precise = false): string {
  const absSeconds = Math.abs(seconds)

  const hours = Math.floor(absSeconds / 3600)
  const minutes = Math.floor((absSeconds % 3600) / 60)
  const remainingSeconds = Math.floor(absSeconds % 60)

  if (precise) {
    // Return HH:MM:SS format for precise display
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Return human-readable format
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

/**
 * Calculate elapsed seconds from a start time
 *
 * @param startTime - ISO string start time
 * @returns Elapsed seconds
 */
export function calculateElapsedSeconds(startTime: string): number {
  const start = dayjs(startTime)
  const now = dayjs()
  return now.diff(start, 'second')
}

/**
 * Format start time for display
 *
 * @param isoString - ISO string timestamp
 * @returns Formatted time string
 */
export function formatStartTime(isoString: string): string {
  return dayjs(isoString).format('HH:mm')
}

/**
 * Format time entry for display
 */
export function formatTimeEntry(entry: {
  description: string
  duration: number
  project?: { name: string }
  start: string
}): string {
  const duration = formatDuration(entry.duration)
  const project = entry.project ? ` [${entry.project.name}]` : ''
  const startTime = new Date(entry.start).toLocaleTimeString()

  return `${entry.description}${project} - ${duration} (started ${startTime})`
}