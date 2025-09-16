# PRD 0003: Ping Command for Token Validation

## Overview
Create a ping command that tests the stored API token by connecting to the Toggl API to verify authentication works correctly.

## Objectives
- Provide a simple way to test stored configuration
- Validate API connectivity without side effects
- Give users feedback on their authentication status

## Requirements

### Technical Requirements
- Use existing TogglClient from `src/lib/toggl-client.ts`
- Load stored configuration from `~/.togrc` using home-config
- Follow oclif command structure and conventions
- Use ES modules and TypeScript as per project standards

### Functional Requirements
- Command should be accessible via `tog ping`
- Load API token from stored configuration
- Test connection using TogglClient.ping() method
- Provide clear success/failure feedback
- Handle missing configuration gracefully

### Code Structure
- `src/commands/ping.ts` - Main ping command implementation
- Uses existing dependencies (home-config, TogglClient)
- No new dependencies required

### Data Models
```typescript
// Command structure
export default class Ping extends Command {
  static description = 'Test connection to Toggl API using stored token'
  async run(): Promise<void>
}
```

## Acceptance Criteria
- [x] `tog ping` command exists and is accessible
- [x] Command loads stored API token from ~/.togrc
- [x] Tests connection using TogglClient.ping() method
- [x] Shows success message when token works
- [x] Shows clear error when token fails validation
- [x] Handles missing configuration file gracefully
- [x] Command follows oclif conventions and project structure

## Dependencies
- PRD 0001: Basic Toggl Client (uses TogglClient)
- PRD 0002: Init and Nuke Commands (uses stored configuration)

## Notes
- Simple command to test existing functionality
- No new external dependencies needed
- Leverages existing TogglClient ping implementation
- Useful for debugging connection issues

---

**Status:** Implemented and tested - Complete