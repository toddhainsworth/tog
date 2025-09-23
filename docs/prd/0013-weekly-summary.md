# PRD 0013: Weekly Summary

## Overview
Display comprehensive weekly time tracking summaries with both detailed time entries and project aggregations, supporting current week and previous week views for timesheet and review purposes.

## Objectives
- Provide weekly overview for timesheet preparation and review
- Show time distribution across projects for the week
- Support viewing current and previous weeks
- Enable weekly productivity analysis
- Maintain consistency with daily summary format

## Requirements

### Technical Requirements
- Create new `week` command extending BaseCommand
- Calculate week boundaries (Monday-Sunday or configurable)
- Fetch time entries for full week using Toggl API
- Aggregate data by day and by project
- Use `cli-table3` for consistent table formatting
- Handle timezone correctly for week boundaries

### Functional Requirements
- Display two tables: time entries by day and project summary
- Time entry table groups by day with daily subtotals
- Project summary table shows weekly totals and percentages
- Support `--last` flag to view previous week
- Show week date range in header
- Include currently running timer if in current week
- Format all durations consistently (HH:MM:SS)
- Show helpful message for weeks with no entries

### Code Structure
- `src/commands/week.ts` - New command implementation
- `src/lib/toggl-client.ts` - Reuse getTimeEntries with week date range
- `src/lib/time-utils.ts` - Add week boundary calculation utilities
- `src/lib/table-formatter.ts` - Extend with weekly table formats
- Add tests for week command and date utilities

### Data Models
```typescript
// Command flags
interface WeekFlags {
  last?: boolean;     // Show last week instead of current
  start?: string;     // Custom week start date (ISO format)
}

// Daily aggregation for display
interface DailySummary {
  date: string;
  dayName: string;
  entries: TimeEntrySummary[];
  totalSeconds: number;
  formattedDuration: string;
}

// Weekly project aggregation
interface WeeklyProjectSummary {
  projectName: string;
  daysWorked: number;
  totalSeconds: number;
  formattedDuration: string;
  percentage: number;
  dailyAverage: string;
}
```

## Acceptance Criteria
- [x] Command shows current week by default (Monday-Sunday)
- [x] `--last` flag shows previous week
- [x] Time entries grouped by day with daily totals
- [x] Each day shows individual time entries
- [x] Project summary shows week totals with percentages
- [x] Week date range displayed in header
- [x] Grand total for week displayed prominently
- [x] Empty days shown with "No entries" message
- [x] Currently running timer included if applicable
- [x] Tables properly formatted and aligned

## Dependencies
- PRD 0011: Today's Summary Command (reuses aggregation patterns)

## Notes
- Week start day could be configurable in future (Sunday vs Monday)
- Consider adding month view in future iteration
- Export functionality would complement weekly summaries
- Daily average in project summary helps identify time patterns

---

**Status:** ✅ Implemented