# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Toggl CLI tool built with oclif framework. The project uses TypeScript with ES modules and follows oclif conventions for command structure and organization.

## Development Commands

- **Build**: `yarn build` - Compiles TypeScript to dist/ directory
- **Test**: `yarn test` - Runs Mocha tests with TypeScript support
- **Lint**: `yarn lint` - Runs ESLint with oclif configuration
- **Test single file**: `yarn test test/path/to/specific.test.ts`
- **Development workflow**: Tests automatically run linting via `posttest` script

## Architecture

### Command Structure
- Commands are organized under `src/commands/` following oclif conventions
- Each command extends `BaseCommand` from `src/lib/base-command.ts` which provides shared functionality
- Commands use static properties for `args`, `flags`, `description`, and `examples`
- Command structure follows the pattern: `src/commands/[command].ts`

### Configuration
- **TypeScript**: ES2022 target with Node16 modules, strict mode enabled
- **Testing**: Mocha with ts-node/register for TypeScript support
- **Linting**: ESLint with oclif config and Prettier integration
- **Package Manager**: Yarn (specified in packageManager field)

### Key Dependencies
- `@oclif/core` - Core oclif framework
- `@oclif/plugin-help` - Help system
- `@oclif/plugin-plugins` - Plugin management
- `@inquirer/prompts` - Interactive CLI prompts
- `arktype` - Runtime type validation library
- `axios` - HTTP client for API requests
- `ora` - Terminal spinners for loading states

### Build Output
- Compiled code goes to `dist/`
- Entry point: `dist/index.js`
- Binary: `./bin/run.js`

## Testing
- Test files in `test/` directory mirror `src/` structure
- Uses Mocha with TypeScript support via ts-node
- Tests have 60-second timeout configured
- Use `@oclif/test` for oclif-specific testing utilities
- **Command tests are NOT required**: Focus on unit testing core logic in lib/ files rather than command integration tests

## Configuration Management

### User Configuration
- Configuration is stored in `~/.togrc` file using `home-config` package
- Contains API token for Toggl API authentication
- Use `tog init` to set up configuration with validation
- Use `tog nuke` to delete configuration (with confirmation prompt)

### API Integration
- Uses `TogglClient` class from `src/lib/toggl-client.ts`
- Implements Basic Auth with API token format: `${token}:api_token`
- Client provides `ping()` method for token validation
- Base URL: `https://api.track.toggl.com/api/v9`

## Implementation Notes

### Command Generation
- Always use `npx oclif generate command <name>` to create new commands
- This ensures proper oclif structure and includes test files

### PRD Template

Use this template for all new Product Requirements Documents:

```markdown
# PRD: [Feature Name]

## Overview
Brief description of the feature and its purpose.

## Objectives
- Primary goal
- Secondary goals
- Success metrics

## User Stories
- As a [user type], I want [goal] so that [benefit]
- Additional user stories as needed

## Technical Requirements
### Functional Requirements
- Specific functionality that must be implemented
- Input/output specifications
- Integration requirements

### Non-Functional Requirements
- Performance requirements
- Security considerations
- Usability requirements

## Implementation Approach
### Architecture
- High-level design decisions
- Component structure
- Data flow

### Technical Considerations
- Dependencies and libraries
- API integrations
- Testing strategy

## Acceptance Criteria
- [ ] Specific, testable criteria for feature completion
- [ ] Edge cases and error handling
- [ ] Performance benchmarks

## Risk Assessment
### Technical Risks
- Potential technical challenges
- Mitigation strategies

### Timeline Considerations
- Implementation complexity
- Dependencies on other work

## Future Considerations
- Potential extensions or improvements
- Scalability considerations
```

### Type Validation
- Use arktype for runtime validation: `type("string>=32")` for API tokens
- Use arktype's `infer` for generating TypeScript types from schemas
- Pattern: `type ApiToken = typeof ApiTokenSchema.infer`

### Error Handling
- Commands extend `BaseCommand` which provides `handleError()` method for consistent error handling
- Use `this.error()` for command failures that should exit with error code
- Use `this.logInfo()`, `this.logSuccess()`, `this.logWarning()` for consistent messaging with emojis
- Error handling system includes typed errors in `src/lib/errors.ts`

### Interactive Prompts
- Use `@inquirer/prompts` for user input: `confirm`, `input`, `select`
- Prompt utilities available in `src/lib/prompts.ts`
- Use `withSpinner()` for async operations with loading indicators
- Use confirmation prompts for destructive operations (y/N pattern)

## Release Process

### Version Bumping Strategy
- **Patch (0.1.x)**: Bug fixes, small improvements, dependency updates
- **Minor (0.x.0)**: New features, significant refactoring, breaking changes in development
- **Major (x.0.0)**: Major breaking changes, complete API overhauls

### Release Steps
1. **Ensure clean state**: All changes committed, tests passing, linting clean
   ```bash
   yarn test
   yarn lint
   yarn build
   ```

2. **Update version** in `package.json` according to semver
   ```bash
   # For minor version bump example
   # Change "version": "0.1.1" to "version": "0.2.0"
   ```

3. **Commit version bump**
   ```bash
   git add package.json
   git commit -m "chore: bump version to X.Y.Z

   Brief summary of major changes in this release"
   ```

4. **Push to origin**
   ```bash
   git push origin main
   ```

5. **Create GitHub release**
   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z - Release Title" --notes "Release notes"
   ```

### Release Notes Template
```markdown
## 🚀 Release Title

### ✨ New Features
- Feature descriptions

### 🔧 Technical Improvements
- Technical improvements

### 🛠️ Internal Changes
- Internal changes

### 📦 Dependencies
- Dependency updates

### 🐛 Bug Fixes
- Bug fixes
```

### Automation
- Tests run automatically on commit via `posttest` script
- Version script updates README via oclif when available
- Use `yarn version` command for automated version bumping if preferred

## Documentation
- PRDs (Product Requirements Documents) follow the new workflow in `DEVELOPMENT.md`
- Local PRDs are kept in `docs/prd/` for development reference (not committed)
- GitHub issues serve as the source of truth for approved PRDs

## Development Best Practices

### TypeScript Safety
- **Never use `any`** in TypeScript projects
- **Avoid non-null assertions (`!`)** - use type-safe patterns instead:
  ```typescript
  // WRONG: Unsafe assumption
  completeDays.push(dailySummaries.find(d => d.date === dateKey)!)

  // RIGHT: Type-safe approach with Map
  const existingDay = existingDaysMap.get(dateKey)
  if (existingDay) {
    completeDays.push(existingDay)
  }
  ```
- **Prefer Maps for O(1) lookups** when type safety and performance matter
- **Always run `yarn build`** after major changes - test success doesn't guarantee TypeScript compilation success

### Test Environment Isolation
- **Never contaminate production data** - tests were initially deleting user's real `.togrc` file
- **Use dependency injection for testability**:
  ```typescript
  // Allow configurable paths for testing
  export function setConfigPath(path: string | undefined): void {
    configPath = path
  }

  // Use unique temporary files per test
  beforeEach(() => {
    testConfigPath = join(os.tmpdir(), `test-togrc-${Date.now()}-${Math.random().toString(36).slice(7)}`)
    setConfigPath(testConfigPath)
  })
  ```
- **Clean up test resources** properly in `afterEach`

### Date and Time Handling
- **Use UTC methods for date boundary calculations** to ensure consistent behavior across timezones:
  - Use `getUTCDay()`, `setUTCDate()`, `setUTCHours()` instead of local time methods
  - Critical for features like week calculations that must work consistently globally
  - Use `timeZone: 'UTC'` in `toLocaleDateString()` options when needed

### User Experience Design
- **Start with essential information first** - initial weekly table had too many columns
- **Iterate based on feedback** - simplified from 6 columns to 2 (Day + Duration) based on user input
- **Prioritize readability over completeness** in table displays

### Code Review Process

Claude Code performs comprehensive self-review before human review, focusing on:

1. **Security** (highest priority)
   - No exposed secrets, API keys, or sensitive data
   - Secure API usage patterns and input validation
   - Proper authentication and authorization handling

2. **Performance**
   - Efficient algorithms and data structures
   - Proper resource management and cleanup
   - Minimal API calls and optimal caching

3. **Code Quality**
   - TypeScript safety (no `any`, avoid non-null assertions)
   - Clean architecture following established patterns
   - Maintainable and readable code structure

4. **Testing Coverage**
   - Comprehensive test coverage including edge cases
   - Test environment isolation (no production data contamination)
   - Proper test cleanup and resource management

**Process:**
- Claude documents self-review findings and improvements
- Self-review is thorough but human retains final sign-off authority
- Human performs final strategic review in GitHub PR

### Development Workflow

This project follows the AI-assisted development workflow documented in `DEVELOPMENT.md`, which includes:
- PRD-driven feature development with GitHub issue integration
- Feature branching with proper naming conventions
- Comprehensive code review process
- Quality gates and branch protection