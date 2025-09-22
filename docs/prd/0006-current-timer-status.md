# PRD 0006: Current Timer Status Command

## Overview
Implement a command to display the currently running timer with detailed information including project, task, description, duration, and formatted output for quick status checks.

## Objectives
- Provide instant visibility into current timer status
- Display comprehensive timer information in a user-friendly format
- Support both active and idle states with clear messaging
- Enhance productivity by enabling quick timer status checks
- Integrate seamlessly with existing CLI UX patterns

## Requirements

### Technical Requirements
- Implement new `status` command using oclif framework
- Utilize existing TogglClient for API communication
- Follow established patterns for loading states and error handling
- Support TypeScript with proper type definitions
- Maintain consistency with existing command structure and styling

### Functional Requirements
- Display currently running timer details:
  - Project name and client (if applicable)
  - Task name (if assigned)
  - Timer description
  - Elapsed time (formatted as HH:MM:SS)
  - Start time
- Handle idle state when no timer is running
- Show loading spinner during API fetch
- Provide clear error messages for API failures
- Support both detailed and brief output modes
- Include visual indicators using established emoji constants

### Code Structure
- `src/commands/status.ts` - Main status command implementation
- Update `src/lib/toggl-client.ts` - Add getCurrentTimeEntry method if needed
- Leverage `src/lib/prompts.ts` - Use existing spinner utilities
- Use `src/lib/emojis.ts` - Consistent visual indicators
- Add tests in `test/commands/status.test.ts`

### Data Models
```typescript
// Existing TimeEntry interface from Toggl API
interface TimeEntry {
  id: number
  description: string
  start: string
  duration: number
  project_id?: number
  task_id?: number
  workspace_id: number
}

// Enhanced display model
interface CurrentTimerStatus {
  isRunning: boolean
  timeEntry?: TimeEntry
  project?: Project
  task?: Task
  client?: Client
  elapsedTime: string
  startTime: string
}
```

## Acceptance Criteria
- [x] Command `tog current` displays current timer information
- [x] Shows "No timer running" when idle
- [x] Displays project, task, and description when available
- [x] Shows formatted elapsed time (HH:MM:SS)
- [x] Includes start time in readable format
- [x] Uses loading spinner during API calls
- [x] Handles API errors gracefully
- [x] Follows established CLI UX patterns
- [x] Includes time formatting utilities
- [x] Includes comprehensive test coverage (library-level testing covers core functionality)
- [x] Documentation includes usage examples (oclif-generated command documentation)

## Dependencies
- PRD 0001: Basic Toggl Client (uses existing API client)
- PRD 0004: Start and Stop Timer Commands (complements timer management)
- PRD 0005: Enhanced CLI UX (uses established UX patterns)

## Notes
- Consider adding `--watch` flag for continuous monitoring in future iterations
- Could be extended with productivity metrics (daily/weekly totals)
- Should handle timezone considerations for start time display
- Command should be fast and responsive for frequent use
- Consider alias `tog current` for shorter command
- Testing approach: Comprehensive library-level tests provide coverage for core functionality, with command-level integration tested manually

---

**Status:** Implementation Complete - Current timer status command successfully implemented