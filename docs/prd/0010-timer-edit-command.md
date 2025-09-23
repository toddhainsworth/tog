# PRD 0010: Timer Edit/Update Command

## Overview
Allow users to modify the currently running timer's description, project, or task assignment without stopping and restarting it, preserving the original start time.

## Objectives
- Enable quick corrections to timer metadata while preserving timing accuracy
- Reduce friction when realizing a timer was started with wrong details
- Support both interactive and flag-based editing modes
- Maintain timer continuity without time tracking gaps

## Requirements

### Technical Requirements
- Create new `edit` command extending BaseCommand
- Use Toggl API's PUT endpoint for updating time entries
- Fetch current timer details before presenting edit options
- Validate that a timer is currently running before allowing edits

### Functional Requirements
- Edit description of running timer
- Change or remove project assignment
- Change or remove task assignment
- Display current values when prompting for changes
- Support both interactive prompts and command flags
- Preserve original start time and duration
- Show before/after summary of changes

### Code Structure
- `src/commands/edit.ts` - New command implementation
- `src/lib/toggl-client.ts` - Add updateTimeEntry method if not present
- Add tests for edit command functionality

### Data Models
```typescript
// Command flags
interface EditFlags {
  description?: string;
  project?: string;     // Name or ID, or "none" to clear
  task?: string;        // Name or ID, or "none" to clear
  clear?: boolean;      // Clear all project/task assignments
}

// Use existing TimeEntry model for updates
// Toggl API expects partial updates with only changed fields
```

## Acceptance Criteria
- [ ] Command checks for running timer and shows error if none exists
- [ ] Interactive mode shows current values as defaults
- [ ] Can update description via flag or prompt
- [ ] Can update project via flag or prompt
- [ ] Can update task via flag or prompt
- [ ] Can clear project/task assignments
- [ ] Changes are immediately reflected in Toggl
- [ ] Success message shows what was changed
- [ ] Original start time is preserved
- [ ] Help text includes usage examples

## Dependencies
- None - builds on existing timer and API functionality

## Notes
- Consider adding `--clear` flag to remove all assignments quickly
- Interactive mode should show "Press enter to keep current value"
- Could extend to support editing recent entries, not just current
- Validation should ensure task belongs to selected project if both are specified

---

**Status:** Draft - Awaiting approval