import dayjs from 'dayjs';
import type { Project, TimeEntry } from './validation.js';
export interface TimeEntrySummary {
    date: string;
    description: string;
    duration: string;
    endTime: string;
    projectName?: string;
    startTime: string;
}
export interface ProjectSummary {
    formattedDuration: string;
    percentage: number;
    projectName: string;
    totalSeconds: number;
}
export interface DateRange {
    end_date: string;
    start_date: string;
}
export interface DailySummary {
    date: string;
    dayName: string;
    entries: TimeEntrySummary[];
    formattedDuration: string;
    totalSeconds: number;
}
export interface WeeklyProjectSummary {
    dailyAverage: string;
    daysWorked: number;
    formattedDuration: string;
    percentage: number;
    projectName: string;
    totalSeconds: number;
}
export declare function formatDuration(seconds: number): string;
export declare function formatStartTime(isoString: string): string;
export declare function calculateElapsedSeconds(startTime: string): number;
export declare function getTodayDateRange(): DateRange;
export declare function getDateRange(date: dayjs.Dayjs): DateRange;
export declare function getPastDaysDateRange(daysAgo: number): DateRange;
export declare function getCurrentMonthDateRange(): DateRange;
export declare function getCurrentYearDateRange(): DateRange;
/**
 * Get date range for searching all time entries.
 * Uses TOGGL_FOUNDED_DATE as start date since Toggl was founded in TOGGL_FOUNDED_YEAR,
 * ensuring we capture the earliest possible time entries.
 */
export declare function getAllTimeSearchRange(): DateRange;
export declare function getCurrentWeekDateRange(): DateRange;
export declare function getPreviousWeekDateRange(): DateRange;
export declare function formatWeekRange(dateRange: DateRange): string;
export declare function formatTimeEntry(entry: TimeEntry, projects?: Project[]): TimeEntrySummary;
export declare function aggregateTimeEntriesByProject(entries: TimeEntry[], projects?: Project[]): ProjectSummary[];
export declare function calculatePercentage(projectSeconds: number, totalSeconds: number): number;
export declare function groupTimeEntriesByDay(entries: TimeEntry[], projects?: Project[]): DailySummary[];
export declare function aggregateWeeklyProjectSummary(entries: TimeEntry[], projects?: Project[]): WeeklyProjectSummary[];
