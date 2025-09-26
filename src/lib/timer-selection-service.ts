import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'

dayjs.extend(relativeTime)

import type {TogglClient} from './toggl-client.js'
import type {Favorite, Project, Task, TimeEntry} from './validation.js'

import {getTodayDateRange} from './time-utils.js'

const DEFAULT_LOOKBACK_DAYS = 7

export interface TimerOption {
  description: string
  display: string
  favorite_id?: number
  isFavorite: boolean
  lastUsed?: string
  project_id?: null | number
  source: 'favorite' | 'recent'
  task_id?: null | number
}

export interface TimerSelectionOptions {
  includeFavorites?: boolean
  includeRecent?: boolean
  lookbackDays?: number
}

export class TimerSelectionService {
  constructor(
    private readonly client: TogglClient,
    private readonly projects: Project[],
    private readonly tasks: Task[]
  ) {}

  /**
   * Retrieves recent time entries using intelligent lookback strategy.
   *
   * **Lookback Strategy:**
   * 1. First checks today for entries (most common case)
   * 2. If no entries found today, incrementally looks back day by day
   * 3. Stops at first day with entries or after lookbackDays limit
   * 4. This minimizes API calls while ensuring we find recent work
   *
   * @param lookbackDays - Maximum number of days to look back
   * @returns Promise resolving to time entries from the first day with data
   */
  async getRecentTimers(lookbackDays: number): Promise<TimeEntry[]> {
    // First try today
    let entries = await this.getTodayTimers()

    // If no entries today, look back up to lookbackDays
    if (entries.length === 0) {
      for (let daysAgo = 1; daysAgo <= lookbackDays; daysAgo++) {
        const date = dayjs().subtract(daysAgo, 'day')
        const start = date.startOf('day').toISOString()
        const end = date.endOf('day').toISOString()

        // eslint-disable-next-line no-await-in-loop
        entries = await this.client.getTimeEntries(start, end)
        if (entries.length > 0) {
          break
        }
      }
    }

    return entries
  }

  /**
   * Retrieves available timer options combining favorites and recent timers.
   *
   * **Behavior:**
   * - Fetches favorites first (if enabled)
   * - Fetches recent timers with intelligent lookback strategy
   * - Deduplicates entries between favorites and recent timers
   * - Returns combined list for user selection
   *
   * @param options - Configuration options for timer retrieval
   * @param options.includeFavorites - Include user's favorite timers (default: true)
   * @param options.includeRecent - Include recent time entries (default: true)
   * @param options.lookbackDays - Days to look back for recent entries (default: 7)
   * @returns Promise resolving to array of formatted timer options
   */
  async getTimerOptions(options: TimerSelectionOptions = {}): Promise<TimerOption[]> {
    const {
      includeFavorites = true,
      includeRecent = true,
      lookbackDays = DEFAULT_LOOKBACK_DAYS
    } = options

    const timerOptions: TimerOption[] = []

    // Fetch favorites if requested
    if (includeFavorites) {
      try {
        const favorites = await this.client.getFavorites()
        timerOptions.push(...this.formatFavorites(favorites))
      } catch {
        // Silently fail if favorites API is unavailable
      }
    }

    // Fetch recent timers if requested
    if (includeRecent) {
      const recentTimers = await this.getRecentTimers(lookbackDays)
      timerOptions.push(...this.formatRecentTimers(recentTimers, timerOptions))
    }

    return timerOptions
  }

  async getTodayTimers(): Promise<TimeEntry[]> {
    const {end_date, start_date} = getTodayDateRange()
    return this.client.getTimeEntries(start_date, end_date)
  }

  hasMultipleOptions(options: TimerOption[]): boolean {
    return options.length > 1
  }

  hasNoOptions(options: TimerOption[]): boolean {
    return options.length === 0
  }

  hasSingleOption(options: TimerOption[]): boolean {
    return options.length === 1
  }

  private formatFavorites(favorites: Favorite[]): TimerOption[] {
    return favorites
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
      .map(fav => {
        const project = this.projects.find(p => p.id === fav.project_id)
        const task = this.tasks.find(t => t.id === fav.task_id)

        let display = `⭐ ${fav.description || 'Untitled'}`
        if (project) {
          display += ` - ${project.name}`
        }

        if (task) {
          display += ` (${task.name})`
        }

        return {
          description: fav.description || '',
          display,
          favorite_id: fav.favorite_id,
          isFavorite: true,
          project_id: fav.project_id,
          source: 'favorite' as const,
          task_id: fav.task_id,
        }
      })
  }

  /**
   * Formats recent time entries into timer options with intelligent deduplication.
   *
   * **Deduplication Algorithm:**
   * 1. Filters out entries that match existing options (favorites) by comparing:
   *    - description, project_id, and task_id
   * 2. Groups remaining entries by unique combination key to prevent duplicates
   * 3. For each unique combination, keeps only the most recent entry
   *
   * **Performance:** O(n + m) where n = entries.length, m = existingOptions.length
   * Uses Map for O(1) lookups during grouping phase.
   *
   * @param entries - Raw time entries from API
   * @param existingOptions - Existing timer options (typically favorites) to deduplicate against
   * @returns Formatted timer options sorted by most recent first
   */
  private formatRecentTimers(entries: TimeEntry[], existingOptions: TimerOption[]): TimerOption[] {
    // Filter out duplicates that match favorites
    const uniqueEntries = entries.filter(entry => !existingOptions.some(opt =>
        opt.description === entry.description &&
        opt.project_id === entry.project_id &&
        opt.task_id === entry.task_id
      ))

    // Group by unique combination of description + project + task
    const groupedMap = new Map<string, TimeEntry>()
    for (const entry of uniqueEntries) {
      const key = `${entry.description || ''}|${entry.project_id || ''}|${entry.task_id || ''}`
      const existing = groupedMap.get(key)

      // Keep the most recent entry for each unique combination
      if (!existing || new Date(entry.start) > new Date(existing.start)) {
        groupedMap.set(key, entry)
      }
    }

    return [...groupedMap.values()]
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
      .map(entry => {
        const project = this.projects.find(p => p.id === entry.project_id)
        const task = this.tasks.find(t => t.id === entry.task_id)
        const lastUsed = dayjs(entry.start).fromNow()

        let display = `📋 ${entry.description || 'Untitled'}`
        if (project) {
          display += ` - ${project.name}`
        }

        if (task) {
          display += ` (${task.name})`
        }

        display += ` • ${lastUsed}`

        return {
          description: entry.description || '',
          display,
          isFavorite: false,
          lastUsed,
          project_id: entry.project_id,
          source: 'recent' as const,
          task_id: entry.task_id,
        }
      })
  }
}