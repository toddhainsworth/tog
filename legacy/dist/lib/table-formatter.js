import Table from 'cli-table3';
import { SECONDS_PER_HOUR, SECONDS_PER_MINUTE, TIME_FORMAT_PAD_CHAR, TIME_FORMAT_PADDING_LENGTH } from './constants.js';
export function createTimeEntriesTable(entries) {
    const table = new Table({
        colWidths: [8, 10, 10, 40, 20],
        head: ['Start', 'End', 'Duration', 'Description', 'Project'],
        style: {
            border: ['gray'],
            head: ['cyan'],
        },
    });
    for (const entry of entries) {
        table.push([
            entry.startTime,
            entry.endTime,
            entry.duration,
            entry.description,
            entry.projectName || '-',
        ]);
    }
    return table.toString();
}
export function createProjectSummaryTable(projects) {
    const table = new Table({
        colWidths: [30, 12, 12],
        head: ['Project', 'Duration', 'Percentage'],
        style: {
            border: ['gray'],
            head: ['cyan'],
        },
    });
    for (const project of projects) {
        table.push([
            project.projectName,
            project.formattedDuration,
            `${project.percentage}%`,
        ]);
    }
    return table.toString();
}
export function formatGrandTotal(totalSeconds) {
    const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
    const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const seconds = totalSeconds % SECONDS_PER_MINUTE;
    return `${hours.toString().padStart(TIME_FORMAT_PADDING_LENGTH, TIME_FORMAT_PAD_CHAR)}:${minutes.toString().padStart(TIME_FORMAT_PADDING_LENGTH, TIME_FORMAT_PAD_CHAR)}:${seconds.toString().padStart(TIME_FORMAT_PADDING_LENGTH, TIME_FORMAT_PAD_CHAR)}`;
}
export function createWeeklyTimeEntriesTable(dailySummaries) {
    const table = new Table({
        colWidths: [15, 12],
        head: ['Day', 'Duration'],
        style: {
            border: ['gray'],
            head: ['cyan'],
        },
    });
    for (const day of dailySummaries) {
        table.push([
            day.dayName,
            day.formattedDuration,
        ]);
    }
    return table.toString();
}
export function createWeeklyProjectSummaryTable(projects) {
    const table = new Table({
        colWidths: [25, 12, 8, 12, 12],
        head: ['Project', 'Duration', 'Days', 'Daily Avg', 'Percentage'],
        style: {
            border: ['gray'],
            head: ['cyan'],
        },
    });
    for (const project of projects) {
        table.push([
            project.projectName,
            project.formattedDuration,
            project.daysWorked.toString(),
            project.dailyAverage,
            `${project.percentage}%`,
        ]);
    }
    return table.toString();
}
export function createSearchResultsTable(entries) {
    const table = new Table({
        colWidths: [12, 25, 40, 12],
        head: ['Date', 'Project', 'Description', 'Duration'],
        style: {
            border: ['gray'],
            head: ['cyan'],
        },
    });
    for (const entry of entries) {
        table.push([
            entry.date,
            entry.projectName || '-',
            entry.description,
            entry.duration,
        ]);
    }
    return table.toString();
}
