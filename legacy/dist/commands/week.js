import { Flags } from '@oclif/core';
import dayjs from 'dayjs';
import ora from 'ora';
import { BaseCommand } from '../lib/base-command.js';
import { ProjectService } from '../lib/project-service.js';
import { createWeeklyProjectSummaryTable, createWeeklyTimeEntriesTable, formatGrandTotal } from '../lib/table-formatter.js';
import { TimeEntryService } from '../lib/time-entry-service.js';
import { aggregateWeeklyProjectSummary, calculateElapsedSeconds, formatWeekRange, getCurrentWeekDateRange, getPreviousWeekDateRange, groupTimeEntriesByDay, } from '../lib/time-utils.js';
export default class Week extends BaseCommand {
    static description = 'Display comprehensive weekly time tracking summary';
    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --last',
    ];
    static flags = {
        last: Flags.boolean({ description: 'Show previous week instead of current week' }),
    };
    async run() {
        try {
            const { flags } = await this.parse(Week);
            this.loadConfigOrExit();
            const client = this.getClient();
            const timeEntryService = new TimeEntryService(client, this.getLoggingContext());
            // Get appropriate week date range
            const dateRange = flags.last ? getPreviousWeekDateRange() : getCurrentWeekDateRange();
            const weekLabel = flags.last ? 'Last Week' : 'This Week';
            const weekRangeStr = formatWeekRange(dateRange);
            const spinner = ora(`Fetching ${weekLabel.toLowerCase()} time entries...`).start();
            const [timeEntriesResult, currentResult, projects] = await Promise.all([
                timeEntryService.getTimeEntries(dateRange.start_date, dateRange.end_date),
                timeEntryService.getCurrentTimeEntry(),
                ProjectService.getProjects(client, this.getLoggingContext()),
            ]);
            if (timeEntriesResult.error) {
                spinner.fail('Failed to fetch time entries');
                this.handleError(new Error(timeEntriesResult.error), 'Error fetching time entries');
                return;
            }
            if (currentResult.error) {
                spinner.fail('Failed to fetch current timer status');
                this.handleError(new Error(currentResult.error), 'Error fetching current timer');
                return;
            }
            const allEntries = [...timeEntriesResult.timeEntries];
            // Include current entry only if it's in the current week and we're viewing current week
            if (currentResult.timeEntry && !flags.last) {
                const currentStart = new Date(currentResult.timeEntry.start);
                const rangeStart = new Date(dateRange.start_date);
                const rangeEnd = new Date(dateRange.end_date);
                if (currentStart >= rangeStart && currentStart <= rangeEnd) {
                    allEntries.push(currentResult.timeEntry);
                }
            }
            spinner.succeed(`Found ${allEntries.length} time ${allEntries.length === 1 ? 'entry' : 'entries'} for ${weekLabel.toLowerCase()}`);
            // Display week header
            this.log('');
            this.log(`📅 ${weekLabel} Summary (${weekRangeStr})`);
            this.log('');
            if (allEntries.length === 0) {
                this.logInfo(`No time entries found for ${weekLabel.toLowerCase()}. Start tracking with \`tog start\`!`);
                return;
            }
            // Group entries by day and aggregate by project
            const dailySummaries = groupTimeEntriesByDay(allEntries, projects);
            const projectSummaries = aggregateWeeklyProjectSummary(allEntries, projects);
            // Fill in missing days of the week
            const completeDailySummaries = this.fillMissingDays(dailySummaries, dateRange);
            // Calculate total time
            let totalSeconds = 0;
            for (const entry of allEntries) {
                totalSeconds += entry.stop ? entry.duration : calculateElapsedSeconds(entry.start);
            }
            // Display time entries table
            this.log('📋 Time Entries by Day');
            this.log(createWeeklyTimeEntriesTable(completeDailySummaries));
            // Display project summary if there are entries
            if (projectSummaries.length > 0) {
                this.log('');
                this.log('📊 Project Summary');
                this.log(createWeeklyProjectSummaryTable(projectSummaries));
            }
            // Display totals
            this.log('');
            this.logSuccess(`Total time tracked: ${formatGrandTotal(totalSeconds)}`);
            // Show running timer info if applicable
            if (currentResult.timeEntry && !flags.last) {
                const currentStart = new Date(currentResult.timeEntry.start);
                const rangeStart = new Date(dateRange.start_date);
                const rangeEnd = new Date(dateRange.end_date);
                if (currentStart >= rangeStart && currentStart <= rangeEnd) {
                    this.log('');
                    this.logInfo('⏰ Timer is currently running');
                }
            }
        }
        catch (error) {
            this.handleError(error, 'Failed to fetch weekly summary');
        }
    }
    fillMissingDays(dailySummaries, dateRange) {
        // Use a Map for O(1) lookup and guaranteed existence
        const existingDaysMap = new Map(dailySummaries.map(d => [d.date, d]));
        const completeDays = [];
        // Generate all 7 days of the week
        const startDate = new Date(dateRange.start_date);
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateKey = dayjs(currentDate).format('YYYY-MM-DD');
            const existingDay = existingDaysMap.get(dateKey);
            if (existingDay) {
                // Use existing day data
                completeDays.push(existingDay);
            }
            else {
                // Create empty day
                const dayName = currentDate.toLocaleDateString([], { weekday: 'long' });
                completeDays.push({
                    date: dateKey,
                    dayName,
                    entries: [],
                    formattedDuration: '00:00:00',
                    totalSeconds: 0,
                });
            }
        }
        return completeDays;
    }
}
