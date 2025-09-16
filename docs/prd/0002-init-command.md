# PRD 0002: Init and Nuke Commands for API Token Management

## Overview
Create initialization and cleanup commands that allow users to set up their Toggl API token with proper validation and remove configuration when needed.

## Objectives
- Provide a simple onboarding experience for new users
- Collect and validate Toggl API token with proper format checking
- Establish foundation for API authentication in the CLI tool
- Allow users to easily remove stored configuration when needed

## Requirements

### Technical Requirements
- Use arktype for runtime validation of API token format
- Implement interactive prompt for user input
- Validate API token is a string with minimum 32 characters
- Use home-config npm package for storing token in user's home directory
- Follow oclif command structure and conventions
- Use ES modules and TypeScript as per project standards

### Functional Requirements

#### Init Command
- Command should be accessible via `tog init`
- Prompt user for their Toggl API token
- Validate token format before accepting (minimum 32 characters)
- Optional `--validate` flag to test token against Toggl API
- Provide clear error messages for invalid tokens
- Store valid token in user's home directory (`.togrc` file)
- Confirm successful storage to user
- Simple, user-friendly interaction flow

#### Nuke Command
- Command should be accessible via `tog nuke`
- Delete the `.togrc` configuration file
- Prompt for confirmation before deletion
- Provide clear feedback on successful deletion
- Handle cases where config file doesn't exist gracefully

### Code Structure
- `src/commands/init.ts` - Main init command implementation
- `src/commands/nuke.ts` - Configuration cleanup command implementation
- Update `package.json` - Add arktype and home-config dependencies
- Configuration stored in `~/.togrc` file using home-config

### Data Models
```typescript
// Validation schema
const ApiTokenSchema = type("string>=32");
type ApiToken = typeof ApiTokenSchema.infer;

// Configuration structure
const ConfigSchema = type({
  apiToken: ApiTokenSchema
});
type TogglConfig = typeof ConfigSchema.infer;

// Command structures
export default class Init extends Command {
  static description = 'Initialize Toggl CLI with API token'
  static flags = {
    validate: Flags.boolean({char: 'v', description: 'Validate API token by testing connection to Toggl API'})
  }
  async run(): Promise<void>
}

export default class Nuke extends Command {
  static description = 'Delete Toggl CLI configuration'
  async run(): Promise<void>
}
```

## Acceptance Criteria

### Init Command
- [x] `tog init` command exists and is accessible
- [x] Command prompts user for API token input
- [x] Validates token is string with at least 32 characters using arktype
- [x] Provides clear error message for invalid tokens
- [x] `--validate` flag tests token against Toggl API
- [x] Provides clear error when API validation fails
- [x] Stores valid token in `~/.togrc` file using home-config
- [x] Confirms successful storage to user
- [x] Command follows oclif conventions and project structure
- [x] arktype and home-config dependencies are properly installed

### Nuke Command
- [ ] `tog nuke` command exists and is accessible
- [ ] Command prompts for confirmation before deletion
- [ ] Deletes the `~/.togrc` configuration file
- [ ] Provides clear feedback on successful deletion
- [ ] Handles gracefully when config file doesn't exist
- [ ] Command follows oclif conventions and project structure

## Dependencies
- PRD 0001: Basic Toggl Client (this PRD builds upon the existing client structure)

## Notes
- This PRD includes token setup, validation, storage, and cleanup functionality
- Uses home-config for cross-platform home directory configuration storage
- Manual testing approach as requested by user
- Keep implementation simple and focused
- Configuration file will be stored as `~/.togrc`
- Nuke command provides safe way to reset configuration

---

**Status:** Init command implemented and tested - Nuke command pending