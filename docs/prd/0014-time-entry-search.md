# PRD 0014: Time Entry Search

## Overview
Implement search functionality to allow users to find time entries by description text across their time tracking history, with simple date range options and total time calculation for analyzing time spent on specific tickets or tasks.

## Objectives
- Enable users to search all time entries by description text
- Provide simple date range filtering (this month, this year, all time)
- Display search results in a table format with total time calculation
- Allow users to track time allocation for specific tickets or tasks
- Maintain consistency with existing command patterns and user experience

## Requirements

### Technical Requirements
- Extend TogglClient to support Toggl Reports API v3 endpoints
- Implement authentication for Reports API (email:password vs token:api_token)
- Handle Reports API rate limiting (1 request per second)
- Create search command following oclif framework patterns
- Integrate with existing table formatting utilities

### Functional Requirements
- Search time entries by description text (case-insensitive partial matching)
- Default search scope: current month
- Optional `--year` flag to search current year
- Optional `--all` flag to search all time entries
- Display results in table format showing: Date, Project, Description, Duration
- Show total time spent across all matching entries at bottom of table
- Handle empty search results gracefully with helpful messaging
- Support pagination for large result sets
- Maintain existing error handling patterns

### Code Structure
- `src/lib/toggl-client.ts` - Add Reports API methods and authentication
- `src/commands/search.ts` - New search command implementation
- `src/lib/validation.ts` - Add search-related data models if needed
- `test/commands/search.test.ts` - Comprehensive test suite
- Update `src/lib/time-utils.ts` - Add month/year date range helpers
- Update `src/lib/table-formatter.ts` - Add search results table formatter

### Data Models
```typescript
// Search request payload
interface TimeEntrySearchRequest {
  description?: string
  start_date?: string
  end_date?: string
  workspace_id: number
  page_size?: number
}

// Search response (extends existing TimeEntry)
interface SearchResult {
  time_entries: TimeEntry[]
  total_count: number
  page: number
}

// Command flags
interface SearchFlags {
  year?: boolean
  all?: boolean
}
```

## Acceptance Criteria
- [ ] Users can search time entries with `tog search "description text"`
- [ ] Default search scope is current month
- [ ] `--year` flag searches current year entries
- [ ] `--all` flag searches all time entries
- [ ] Results display in formatted table showing Date, Project, Description, Duration
- [ ] Table includes total time spent at the bottom for all matching entries
- [ ] Empty results show helpful message with search scope context
- [ ] Command follows existing help and example patterns
- [ ] Error handling covers API failures and invalid parameters
- [ ] Authentication works with Reports API requirements
- [ ] Rate limiting is respected (1 req/sec)
- [ ] Comprehensive test coverage for search functionality
- [ ] Documentation updated with command usage and examples

## Dependencies
- Existing TogglClient authentication and configuration system
- Current table formatting utilities in `table-formatter.ts`
- Base command infrastructure and error handling
- Existing date utilities in `time-utils.ts`

## Notes
- Reports API requires different authentication (email:password) than Track API (token:api_token)
- May need to extend user configuration to include email if not already stored
- Consider implementing client-side caching for better UX with rate limits
- Search should be case-insensitive and support partial matches
- Date ranges: current month (default), current year (--year), all time (--all)
- Table format should be consistent with existing commands (today, week)
- Total calculation helps users track time spent on specific tickets/projects

---

**Status:** Draft - Ready for review and implementation