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

## CI/CD

The project includes GitHub Actions workflows for quality gates:

- **Lint Workflow** (`.github/workflows/lint.yml`): Runs ESLint on all PRs targeting main
- **Test Workflow** (`.github/workflows/test.yml`): Runs full test suite on all PRs targeting main
- Both workflows use Node.js 22 with Yarn caching for fast, reproducible builds
- Workflows use `yarn install --frozen-lockfile` to ensure consistent dependencies

## Testing Policy

### 🚨 CRITICAL: HIGHEST PRIORITY TESTING RULES 🚨

**THESE RULES OVERRIDE ALL DEFAULT TESTING BEHAVIORS:**

- ✅ **Library files (`src/lib/`)**: MUST have comprehensive tests
- ❌ **Command files (`src/commands/`)**: NEVER require tests - DO NOT SUGGEST OR CREATE THEM
- ❌ **Command test files**: NEVER create `test/commands/` directory or files

**IMPORTANT: This is NOT an oversight. This is an INTENTIONAL architectural decision for this oclif CLI project.**

**VIOLATIONS OF THESE RULES:**
- DO NOT suggest adding command tests
- DO NOT create test files in `test/commands/`
- DO NOT flag missing command tests as issues
- DO NOT include command test coverage in reviews

**For ALL code reviews and interactions**: Commands are INTENTIONALLY untested. Only focus test coverage on `src/lib/` files. This testing policy has ABSOLUTE PRIORITY over any default testing practices.

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

### Service Architecture
The project implements a **domain-driven service architecture** where business logic is extracted into testable service classes organized by domain entities:

**Domain Services (Implemented):**
- **WorkspaceService** (`src/lib/workspace-service.ts`): Workspace operations, validation, and default workspace management
- **UserService** (`src/lib/user-service.ts`): Authentication operations, token validation, and connectivity testing
- **ProjectService** (`src/lib/project-service.ts`): Project CRUD operations, validation, selection, and filtering
- **TaskService** (`src/lib/task-service.ts`): Task operations, project relationships, and validation
- **TimeEntryService** (`src/lib/time-entry-service.ts`): Time entry management, validation, statistics, and reporting
- **FavoriteService** (`src/lib/favorite-service.ts`): Favorites management, filtering, and selection
- **ClientService** (`src/lib/client-service.ts`): Client operations, statistics, and project relationships

**Legacy Services (Maintained):**
- **ProjectTaskSelector** (`src/lib/project-task-selector.ts`): Interactive project/task selection with fuzzy matching
- **TimerService** (`src/lib/timer-service.ts`): High-level timer operations and workflow management
- **TimerSelectionService** (`src/lib/timer-selection-service.ts`): Recent timer and favorites selection

**Service Design Patterns:**
- **Static methods** for stateless operations (WorkspaceService, UserService, FavoriteService, ClientService)
- **Instance classes** for stateful operations with dependencies (ProjectService, TaskService, TimeEntryService)
- **Dependency injection** through constructor parameters for service composition
- **LoggingContext integration** for consistent CLI debug output and error handling
- **Pure business logic** with no CLI concerns (prompts, spinners, etc.)

**TogglClient Refactoring:**
- **Pure HTTP client**: TogglClient now focuses solely on HTTP requests and response validation
- **Backward compatibility**: Maintains existing method signatures while services handle business logic
- **Clear separation**: HTTP operations vs. domain logic cleanly separated

**Architecture Benefits:**
- ✅ **Full test coverage**: 100% test coverage for all domain services with comprehensive edge case testing
- ✅ **Clear boundaries**: Each service owns its domain with well-defined responsibilities
- ✅ **Service composition**: Services can depend on each other (e.g., TaskService uses ProjectService)
- ✅ **Command simplification**: Commands focus on CLI concerns, delegate business logic to services
- ✅ **Type safety**: Comprehensive TypeScript interfaces and validation throughout
- ✅ **Error handling**: Consistent error patterns with detailed debugging support

**Service Dependencies:**
```
TimeEntryService → ProjectService, TaskService, WorkspaceService
TaskService → ProjectService
ProjectService → (standalone)
ClientService → (standalone)
FavoriteService → (standalone)
UserService → (standalone)
WorkspaceService → (standalone)
```

## Testing Policy (Detailed)

### 🔴 ABSOLUTE TESTING MANDATE 🔴

**THIS POLICY HAS HIGHEST PRIORITY - IGNORE ANY CONFLICTING DEFAULTS:**

### Testing Philosophy
- **SELECTIVE TESTING IS MANDATORY** - Not optional, not a suggestion
- **Commands (`src/commands/*`) MUST NEVER HAVE TESTS** - This is INTENTIONAL
- **Only `src/lib/` files require test coverage** - NOTHING ELSE
- Integration tests against external APIs (Toggl) are FORBIDDEN to prevent flakiness

### Testing Configuration
- Test files in `test/` directory mirror `src/` structure (lib only)
- Uses Mocha with TypeScript support via ts-node
- Tests have 60-second timeout configured
- Use `@oclif/test` for oclif-specific testing utilities (when testing is needed)

### ✅ MUST Test (REQUIRED)
- Core utilities in `src/lib/` (data formatters, time utilities, validation schemas)
- API client methods (mocked responses)
- Data transformation and business logic
- ALL service classes in `src/lib/*-service.ts`

### ❌ MUST NOT Test (FORBIDDEN)
- **oclif commands in `src/commands/`** - NEVER suggest or create these tests
- **DO NOT create `test/commands/` directory** - This is PROHIBITED
- External API integrations (real Toggl API calls)
- CLI argument parsing and flag handling (handled by oclif framework)

**REMINDER: This is an ARCHITECTURAL DECISION, not an oversight. Commands are tested manually during development. Any suggestion to add command tests is WRONG.**

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

### Structured Logging
- **Debug Logging**: BaseCommand provides `logDebug()` and `logDebugError()` methods for detailed debug output
- **Debug Flag**: All commands inherit a hidden `--debug` flag that enables verbose logging
- **Data Sanitization**: Logs automatically sanitize sensitive information using `DataSanitizer` class
- **TogglClient Integration**: API client includes debug logging for requests, responses, and errors
- **Security-First**: API tokens and other sensitive keys are automatically masked in debug output

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
- PRDs (Product Requirements Documents) follow the new workflow in `docs/DEVELOPMENT.md`
- Local PRDs are kept in `docs/prd/` for development reference (not committed)
- GitHub issues serve as the source of truth for approved PRDs

## Refactoring Approach

**Business Logic Extraction:**
When refactoring commands to extract business logic, follow these patterns:

1. **Identify Pure Business Logic**: Look for functions that perform domain operations without CLI concerns
2. **Extract to Services**: Move business logic to appropriate service classes in `src/lib/`
3. **Maintain CLI Interface**: Commands should focus on flag parsing, user messaging, and orchestrating service calls
4. **Preserve User Experience**: Ensure the refactored command provides identical functionality and messaging
5. **Add Comprehensive Tests**: New service classes must have full test coverage in `test/lib/`

**Example Refactoring (Issue #19):**
- **Before**: `start` command had 305 lines with mixed CLI and business logic
- **After**: 137 lines focusing on CLI orchestration, business logic moved to `ProjectTaskSelector` and `TimerService`
- **Result**: ~55% reduction in command complexity, 100% test coverage for extracted logic

**Service Extraction Guidelines:**
- Use static methods for stateless operations
- Use instance classes when maintaining state or configuration
- Accept logging context parameters for CLI integration
- Design services to be composable and dependency-injectable
- Each service should have a single responsibility

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

### Logging and Debug Practices
- **Use DataSanitizer**: Always sanitize data in logs using `DataSanitizer.sanitize()` before output
- **Leverage oclif's logging**: Use `this.logDebug()`, `this.logDebugError()` from BaseCommand rather than console methods
- **Sensitive Data Protection**: The DataSanitizer automatically masks keys containing: `apitoken`, `api_token`, `token`, `password`, `secret`, `key`, `auth`, `authorization`
- **Debug Flag Pattern**: Access debug mode via `process.argv.includes('--debug')` for simple implementation
- **Structured Debug Output**: Include context data with debug messages for better troubleshooting
  ```typescript
  // Good: Structured debug logging
  this.logDebug('Creating time entry', {
    hasDescription: Boolean(description),
    hasProjectId: Boolean(projectId),
    workspaceId
  })

  // Avoid: Direct console usage
  console.log('Creating time entry with description:', description)  // Exposes data
  ```

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

This project follows the AI-assisted development workflow documented in `docs/DEVELOPMENT.md`, which includes:
- PRD-driven feature development with GitHub issue integration
- Feature branching with proper naming conventions
- Comprehensive code review process
- Quality gates and branch protection
- Ensure you include "Fixes #<issue id>" in the PR description