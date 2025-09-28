/**
 * Output Formatting Utilities
 *
 * Simple helpers for consistent CLI output formatting
 */

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
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  const absSeconds = Math.abs(seconds)

  const hours = Math.floor(absSeconds / 3600)
  const minutes = Math.floor((absSeconds % 3600) / 60)
  const remainingSeconds = absSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
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