# PRD 0011: Today's Summary Command

## Overview
Display a comprehensive summary of today's time tracking activities, showing both individual time entries and aggregated project totals using formatted tables for clear visualization.

## Objectives
- Provide quick daily overview of tracked time
- Show detailed time entry list with running totals
- Display project-based time aggregation
- Support different timezone considerations
- Enable easy daily review and timesheet preparation

## Requirements

### Technical Requirements
- Create new `today` command extending BaseCommand
- Fetch time entries for current date using Toggl API
- Use existing `cli-table3` package for table formatting
- Calculate totals locally (API returns individual entries)
- Handle timezone correctly for date boundaries

### Functional Requirements
- Display two tables: time entries and project summary
- Time entry table shows: start time, end time, duration, description, project
- Project summary table shows: project name, total time, percentage of day
- Show grand total of hours, minutes, and seconds
- Include currently running timer if present
- Format times in readable format (HH:MM:SS)
- Support empty state with helpful message

### Code Structure
- `src/commands/today.ts` - New command implementation
- `src/lib/toggl-client.ts` - Add getTimeEntries method with date range
- `src/lib/time-utils.ts` - Add aggregation and formatting utilities
- `src/lib/table-formatter.ts` - New utility for consistent table formatting
- Add tests for today command and utilities

### Data Models
```typescript
// Time entry summary for display
interface TimeEntrySummary {
  startTime: string;
  endTime: string;
  duration: string;
  description: string;
  projectName?: string;
}

// Project aggregation
interface ProjectSummary {
  projectName: string;
  totalSeconds: number;
  formattedDuration: string;
  percentage: number;
}

// API expects date range format
interface DateRange {
  start_date: string; // ISO format
  end_date: string;   // ISO format
}
```

## Acceptance Criteria
- [ ] Command fetches all time entries for today (midnight to current time)
- [ ] Time entries table displays all today's entries chronologically
- [ ] Currently running timer is included and marked as "Running"
- [ ] Project summary table aggregates time by project
- [ ] Both tables show formatted totals (HH:MM:SS format)
- [ ] Grand total is displayed prominently
- [ ] Empty state shows helpful message when no entries exist
- [ ] Tables are properly aligned and readable
- [ ] Timezone handling respects user's local time

## Dependencies
- None - builds on existing API client and uses installed cli-table3

## Notes
- Consider caching today's data for performance if called multiple times
- Future enhancement: add flags for different date formats or ranges
- Could add export functionality in future iterations
- Project percentages help identify time allocation patterns

---

**Status:** Draft - Awaiting approval