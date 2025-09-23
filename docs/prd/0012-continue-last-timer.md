# PRD 0012: Continue Last Timer

## Overview
Enable users to quickly restart their most recent timer with the same description, project, and task settings, streamlining the workflow for resuming work after breaks or interruptions.

## Objectives
- Reduce friction when resuming previously tracked work
- Eliminate need to re-enter timer details after breaks
- Support common workflow of continuing same task across sessions
- Provide clear feedback about which timer is being continued

## Requirements

### Technical Requirements
- Create new `continue` command extending BaseCommand
- Fetch most recent time entry from Toggl API
- Create new timer with same metadata but new start time
- Handle edge cases like no previous timers or already running timer

### Functional Requirements
- Fetch the most recently stopped timer
- Display details of timer being continued
- Start new timer with identical description, project, and task
- Warn if current timer is already running
- Show helpful message if no previous timer exists
- Clear success confirmation with timer details

### Code Structure
- `src/commands/continue.ts` - New command implementation
- `src/lib/toggl-client.ts` - Add method to fetch most recent time entry
- Add tests for continue command functionality

### Data Models
```typescript
// Use existing TimeEntry model
// New entry copies: description, project_id, task_id, tags
// New entry gets: new start time, duration: -1
```

## Acceptance Criteria
- [ ] Command fetches most recent stopped time entry
- [ ] Shows details of timer being continued (description, project, task)
- [ ] Creates new running timer with same metadata
- [ ] Handles case when timer is already running with appropriate message
- [ ] Handles case when no previous timer exists
- [ ] Success message confirms timer started with details
- [ ] Help text includes usage examples

## Dependencies
- None - builds on existing timer and API functionality

## Notes
- Consider showing elapsed time since last timer stopped
- Could add interactive selection from recent timers in future
- Useful for pomodoro-style work patterns
- Future enhancement: could add flags to modify description or select specific timer

---

**Status:** Draft - Awaiting approval