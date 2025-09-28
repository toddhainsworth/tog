import type { TogglClient } from './toggl-client.js';
import type { Project, Task, TimeEntry } from './validation.js';
export interface TimerOption {
    description: string;
    display: string;
    favorite_id?: number;
    isFavorite: boolean;
    lastUsed?: string;
    project_id?: null | number;
    source: 'favorite' | 'recent';
    task_id?: null | number;
}
export interface TimerSelectionOptions {
    includeFavorites?: boolean;
    includeRecent?: boolean;
    lookbackDays?: number;
}
export declare class TimerSelectionService {
    private readonly client;
    private readonly projects;
    private readonly tasks;
    constructor(client: TogglClient, projects: Project[], tasks: Task[]);
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
    getRecentTimers(lookbackDays: number): Promise<TimeEntry[]>;
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
    getTimerOptions(options?: TimerSelectionOptions): Promise<TimerOption[]>;
    getTodayTimers(): Promise<TimeEntry[]>;
    hasMultipleOptions(options: TimerOption[]): boolean;
    hasNoOptions(options: TimerOption[]): boolean;
    hasSingleOption(options: TimerOption[]): boolean;
    private formatFavorites;
    /**
     * Formats recent time entries into timer options with intelligent deduplication.
     *
     * **Deduplication Algorithm:**
     * 1. Filters out running timers (entries without stop time)
     * 2. Filters out entries that match existing options (favorites) by comparing:
     *    - description, project_id, and task_id
     * 3. Groups remaining entries by unique combination key to prevent duplicates
     * 4. For each unique combination, keeps only the most recent entry
     *
     * **Performance:** O(n + m) where n = entries.length, m = existingOptions.length
     * Uses Map for O(1) lookups during grouping phase.
     *
     * @param entries - Raw time entries from API
     * @param existingOptions - Existing timer options (typically favorites) to deduplicate against
     * @returns Formatted timer options sorted by most recent first
     */
    private formatRecentTimers;
}
