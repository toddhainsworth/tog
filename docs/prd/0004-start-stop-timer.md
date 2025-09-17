# PRD 0004: Start and Stop Timer Commands

## Overview
Create start and stop commands that allow users to control Toggl time tracking directly from the CLI. The start command will provide an interactive interface for creating new time entries, while the stop command will end the currently running timer.

## Objectives
- Provide simple CLI interface for basic time tracking operations
- Enable users to start time tracking with interactive prompts
- Allow users to stop currently running timers quickly
- Integrate with existing Toggl API and configuration system

## Requirements

### Technical Requirements
- Use existing TogglClient for API communication
- Load stored configuration from shared config lib
- Follow oclif command structure and conventions
- Use shared emoji constants for consistent UI
- Handle API errors gracefully with clear error messages
- Use ES modules and TypeScript as per project standards

### Functional Requirements

#### Phase 1: Command Bootstrapping
**Start Command**
- Command should be accessible via `tog start`
- Basic command structure and help system
- Load configuration and validate API connectivity
- Placeholder implementation for timer start functionality

**Stop Command**
- Command should be accessible via `tog stop`
- Basic command structure and help system
- Load configuration and validate API connectivity
- Implement timer stop functionality using Toggl API

#### Phase 2: Interactive Start Command (Future)
- Interactive prompts for timer description and task selection
- Task selection will automatically infer client and project
- Create new time entry using selected task details
- Handle cases where timer is already running
- Validate required fields before API submission

#### Phase 3: Workspace ID Storage (Future)
- Extend configuration to store default workspace ID alongside API token
- Update init command to prompt for and store workspace ID
- Modify stop command to use stored workspace ID for API calls
- Update config schema and validation to include workspace ID

### Code Structure
- `src/commands/start.ts` - Interactive timer start command
- `src/commands/stop.ts` - Simple timer stop command
- Uses existing dependencies (TogglClient, config, emojis)
- No new external dependencies required

### Data Models
```typescript
// Command structures (details TBD based on interactive requirements)
export default class Start extends Command {
  static description = 'Start a new time tracking timer'
  async run(): Promise<void>
}

export default class Stop extends Command {
  static description = 'Stop the currently running timer'
  async run(): Promise<void>
}
```

## Acceptance Criteria

### Phase 1: Command Bootstrapping
- [x] `tog start` command exists and is accessible
- [x] Start command shows help and loads configuration
- [x] Start command has placeholder functionality
- [x] `tog stop` command exists and is accessible
- [x] Stop command stops currently running timer via API
- [x] Both commands handle missing configuration gracefully
- [x] Both commands provide clear success/error feedback
- [x] Both commands follow oclif conventions and project structure

### Phase 2: Interactive Start Command
- [x] Start command prompts for timer description
- [x] Start command allows task selection with client/project inference
- [x] Start command creates new time entry with selected details
- [x] Start command handles already running timer scenarios
- [x] Start command falls back to projects when no tasks available

### Phase 3: Workspace ID Storage
- [x] Extend config schema to include workspace ID field
- [x] Update init command to prompt for workspace ID
- [x] Update init command to store workspace ID in configuration
- [x] Modify stop command to use stored workspace ID instead of inferring

### Phase 4: HTTP Client Improvements (Completed)
- [x] Replace problematic OpenAPI client with custom axios-based client
- [x] Implement clean promise chaining with `.then()` syntax
- [x] Fix API payload structure issues
- [x] Update response validation schemas to match actual API

## Dependencies
- PRD 0001: Basic Toggl Client (uses TogglClient for API communication)
- PRD 0002: Init and Nuke Commands (uses stored configuration)

## Notes
- Three-phase approach: bootstrapping, interactivity, then workspace storage
- Phase 1 focuses on command structure and basic API integration
- Phase 2 will implement timer description and task selection prompts
- Phase 3 will add workspace ID storage to avoid API inference requirements
- Task selection will automatically infer client and project relationships
- Leverage existing infrastructure (config, emojis, error handling)
- Manual testing approach as with previous commands

---

**Status:** All phases complete - Full timer functionality with axios client implemented