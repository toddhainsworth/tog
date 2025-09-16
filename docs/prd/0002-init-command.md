# PRD 0002: Init Command for API Token Setup

## Overview
Create an initialization command that allows users to set up their Toggl API token with proper validation to ensure the CLI tool can authenticate with the Toggl API.

## Objectives
- Provide a simple onboarding experience for new users
- Collect and validate Toggl API token with proper format checking
- Establish foundation for API authentication in the CLI tool

## Requirements

### Technical Requirements
- Use arktype for runtime validation of API token format
- Implement interactive prompt for user input
- Validate API token is a string with minimum 32 characters
- Use home-config npm package for storing token in user's home directory
- Follow oclif command structure and conventions
- Use ES modules and TypeScript as per project standards

### Functional Requirements
- Command should be accessible via `tog init`
- Prompt user for their Toggl API token
- Validate token format before accepting
- Provide clear error messages for invalid tokens
- Store valid token in user's home directory (`.togrc` file)
- Confirm successful storage to user
- Simple, user-friendly interaction flow

### Code Structure
- `src/commands/init.ts` - Main init command implementation
- Update `package.json` - Add arktype and home-config dependencies
- Configuration stored in `~/.togrc` file using home-config

### Data Models
```typescript
// Validation schema
const ApiTokenSchema = type("string>32");
type ApiToken = typeof ApiTokenSchema.infer;

// Configuration structure
const ConfigSchema = type({
  apiToken: ApiTokenSchema
});
type TogglConfig = typeof ConfigSchema.infer;

// Command structure
export default class Init extends Command {
  static description = 'Initialize Toggl CLI with API token'
  async run(): Promise<void>
}
```

## Acceptance Criteria
- [ ] `tog init` command exists and is accessible
- [ ] Command prompts user for API token input
- [ ] Validates token is string with at least 32 characters using arktype
- [ ] Provides clear error message for invalid tokens
- [ ] Stores valid token in `~/.togrc` file using home-config
- [ ] Confirms successful storage to user
- [ ] Command follows oclif conventions and project structure
- [ ] arktype and home-config dependencies are properly installed

## Dependencies
- PRD 0001: Basic Toggl Client (this PRD builds upon the existing client structure)

## Notes
- This PRD includes both token collection, validation, and storage
- Uses home-config for cross-platform home directory configuration storage
- Manual testing approach as requested by user
- Keep implementation simple and focused
- Configuration file will be stored as `~/.togrc`

---

**Status:** Planning - Ready for implementation