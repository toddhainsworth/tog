# PRD 0009: Quick Start Timer with Description Flag

## Overview
Enable users to start timers quickly from the command line without interactive prompts by providing description and optional project/task selection via command-line flags.

## Objectives
- Reduce friction for starting timers with known descriptions
- Support non-interactive timer creation for scripts and automation
- Maintain backward compatibility with existing interactive mode
- Provide clear syntax for project/task selection via flags

## Requirements

### Technical Requirements
- Extend existing `start` command with optional flags
- Parse and validate flag inputs before timer creation
- Support both flag-based and interactive modes in same command
- Maintain existing error handling and validation logic

### Functional Requirements
- Accept description via `-d` or `--description` flag
- Accept project selection via `-p` or `--project` flag (name or ID)
- Accept task selection via `-t` or `--task` flag (name or ID)
- Skip interactive prompts when flags are provided
- Fall back to interactive mode when flags are incomplete
- Display clear confirmation of timer start

### Code Structure
- `src/commands/start.ts` - Add flag definitions and non-interactive logic
- `src/lib/toggl-client.ts` - May need helper methods for project/task lookup by name
- Update command tests for new flag functionality

### Data Models
```typescript
// Command flags
interface StartFlags {
  description?: string;
  project?: string; // Can be name or ID
  task?: string;    // Can be name or ID
}

// No new data models needed - reuse existing Project, Task, TimeEntry
```

## Acceptance Criteria
- [x] Command accepts `-d`/`--description` flag for timer description
- [x] Command accepts `-p`/`--project` flag for project selection
- [x] Command accepts `-t`/`--task` flag for task selection
- [x] Flags bypass interactive prompts when provided
- [x] Project/task can be specified by name (partial match) or ID
- [x] Clear error messages for invalid project/task names
- [x] Backward compatibility - interactive mode still works without flags
- [x] Help text updated to show new flag options
- [x] Examples in help text demonstrate flag usage

## Dependencies
- None - builds on existing timer start functionality

## Notes
- Consider case-insensitive matching for project/task names
- Partial name matching should be deterministic (e.g., shortest match or error on ambiguity)
- Flag syntax should follow Unix conventions
- Consider adding a `--no-interaction` flag for fully non-interactive mode

---

**Status:** Completed