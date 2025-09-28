import type { DailySummary, ProjectSummary, TimeEntrySummary, WeeklyProjectSummary } from './time-utils.js';
export declare function createTimeEntriesTable(entries: TimeEntrySummary[]): string;
export declare function createProjectSummaryTable(projects: ProjectSummary[]): string;
export declare function formatGrandTotal(totalSeconds: number): string;
export declare function createWeeklyTimeEntriesTable(dailySummaries: DailySummary[]): string;
export declare function createWeeklyProjectSummaryTable(projects: WeeklyProjectSummary[]): string;
export declare function createSearchResultsTable(entries: TimeEntrySummary[]): string;
