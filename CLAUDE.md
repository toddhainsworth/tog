# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Toggl CLI tool built with Commander.js framework. The project uses TypeScript with ES modules and follows a simplified single-file command pattern for maximum clarity and maintainability.

## Development Commands

- **Build**: `yarn build` - Compiles TypeScript to dist/ directory
- **Test**: `yarn test` - Runs Mocha tests with TypeScript support
- **Lint**: `yarn lint` - ESLint configuration pending (currently skipped)
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

**IMPORTANT: This is NOT an oversight. This is an INTENTIONAL architectural decision for this Commander.js CLI project.**

**VIOLATIONS OF THESE RULES:**
- DO NOT suggest adding command tests
- DO NOT create test files in `test/commands/`
- DO NOT flag missing command tests as issues
- DO NOT include command test coverage in reviews

**For ALL code reviews and interactions**: Commands are INTENTIONALLY untested. Only focus test coverage on `src/lib/` files. This testing policy has ABSOLUTE PRIORITY over any default testing practices.

## Architecture

### Command Structure
- Commands are organized under `src/commands/` following single-file pattern
- Each command exports a `createXCommand()` function that returns a Commander.js Command
- Commands contain all logic in one file with direct API calls - no service layers
- Command structure follows the pattern: `src/commands/[command].ts`

### Configuration
- **TypeScript**: ES2022 target with Node16 modules, strict mode enabled
- **Testing**: Mocha with ts-node/register for TypeScript support
- **Framework**: Commander.js (replacing oclif)
- **Package Manager**: Yarn (specified in packageManager field)

### Key Dependencies
- `commander` - Lightweight CLI framework
- `@inquirer/prompts` - Interactive CLI prompts
- `arktype` - Runtime type validation library
- `axios` - HTTP client for API requests
- `dayjs` - Reliable time and date handling
- `cli-table3` - Professional table formatting for command output

### Build Output
- Compiled code goes to `dist/`
- Entry point: `dist/cli.js`
- Binary: `./bin/run.js`

### Single-File Architecture
The project implements a **single-file command pattern** where each command contains all necessary logic:

**Command Structure:**
- **ping.ts**: API connectivity testing with user info display
- **current.ts**: Shows running timer with elapsed time and project details
- **stop.ts**: Stops running timer with validation and confirmation
- **start.ts**: Interactive timer creation with project/task selection

**Architecture Principles:**
- **Self-contained**: Each command file contains all logic needed for that command
- **Direct API calls**: No service layer - commands call Toggl API directly
- **Type safety**: Zero `any` types, comprehensive error handling
- **Interactive UX**: Uses @inquirer/prompts for user-friendly interactions

**Shared Utilities:**
- **api/client.ts**: HTTP client with axios, intelligent caching, and proper type guards
- **config/**: Configuration management with arktype validation
- **utils/format.ts**: Output formatting utilities (100% test coverage)
- **utils/cache.ts**: File-based caching with TTL expiration and request deduplication

**Architecture Benefits:**
- ✅ **Immediate understanding**: All logic visible in one file
- ✅ **No hidden abstractions**: Direct, clear code flow
- ✅ **Easy debugging**: Simple call stack, clear error paths
- ✅ **Fast development**: No service layer to design or maintain
- ✅ **Type safety**: Comprehensive TypeScript with zero `any` types
- ✅ **Maintainability**: Dramatically reduced codebase complexity

## UI and Table Formatting

### Table Display Standards
All commands use **cli-table3** for professional table formatting with consistent styling:

```typescript
import Table from 'cli-table3'

const table = new Table({
  colWidths: [12, 10, 10, 35, 25],
  head: ['Date', 'Start', 'Duration', 'Description', 'Project'],
  style: {
    border: ['gray'],
    head: ['cyan'],
  },
  wordWrap: true,
})

// Add rows
for (const entry of entries) {
  table.push([entry.date, entry.startTime, entry.duration, entry.description, entry.projectName])
}

console.log(table.toString())
```

**Table Style Requirements:**
- ✅ **Gray borders**: `border: ['gray']` for professional appearance
- ✅ **Cyan headers**: `head: ['cyan']` for consistent branding
- ✅ **Word wrapping**: `wordWrap: true` for long content
- ✅ **Fixed column widths**: Ensures consistent alignment across different data sets
- ✅ **Consistent patterns**: All table-displaying commands use identical styling

**Commands with Tables:**
- **search**: Time entries with Date, Start, Duration, Description, Project columns
- **today**: Time entries table + Project summary table
- **week**: Daily summary table + Project summary table
- **projects/tasks/clients**: List tables with relevant columns

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
- Focus on utility functions that require comprehensive testing

### ✅ MUST Test (REQUIRED)
- Core utilities in `src/utils/` (format utilities, time calculations, validation, caching)
- API client methods (with proper type safety)
- Data transformation and business logic
- Cache functionality including TTL, persistence, and request deduplication
- ALL utility functions with comprehensive edge cases

### ❌ MUST NOT Test (FORBIDDEN)
- **Commands in `src/commands/`** - NEVER suggest or create these tests
- **DO NOT create `test/commands/` directory** - This is PROHIBITED
- External API integrations (real Toggl API calls)
- CLI argument parsing and flag handling (handled by Commander.js framework)

**REMINDER: This is an ARCHITECTURAL DECISION, not an oversight. Commands are tested manually during development. Any suggestion to add command tests is WRONG.**

## Configuration Management

### User Configuration
- Configuration is stored in `~/.togrc` file using `home-config` package
- Contains API token for Toggl API authentication
- Use `tog init` to set up configuration with validation
- Use `tog nuke` to delete configuration (with confirmation prompt)

### API Integration
- Uses `createTogglClient` function from `src/api/client.ts` with integrated caching
- Implements Basic Auth with API token format: `${token}:api_token`
- Client provides `ping()` method for token validation
- Base URL: `https://api.track.toggl.com/api/v9`

## Implementation Notes

### Command Generation
- Create new commands using the single-file pattern
- Copy existing command structure and modify for new functionality
- Register in `src/cli.ts` using `program.addCommand(createYourCommand())`

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
- Commands use try/catch blocks with comprehensive error handling
- Use `process.exit(1)` for command failures that should exit with error code
- Use format utilities (`formatSuccess`, `formatError`, etc.) for consistent messaging
- Error handling uses proper type guards and `isAxiosError()` for API errors

### Type Safety Standards
- **Zero `any` types**: Strict TypeScript with no `any` usage allowed
- **Proper error handling**: Use `unknown` for errors with type guards
- **API responses**: Always type API responses with proper interfaces
- **Type guards**: Use `isAxiosError()` for axios-specific error handling

### Interactive Prompts
- Use `@inquirer/prompts` for user input: `confirm`, `input`, `select`
- Import directly in commands: `import { input, select, confirm } from '@inquirer/prompts'`
- Create user-friendly prompts with clear messaging
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

The project includes comprehensive developer documentation:

- **[Developer Onboarding](docs/ONBOARDING.md)** - Complete guide for new contributors with architecture overview, progressive learning from 5-minute quick start to 30-minute first contribution
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Solutions to common development and usage issues with debugging techniques
- **[Architecture Deep Dive](docs/AI_DEVELOPMENT.md)** - Development process and architectural decisions
- **[Release Process](docs/RELEASE.md)** - How to cut releases and manage versions

### Documentation Standards
- All examples in documentation must be tested and working
- Architecture diagrams use Mermaid for clear visualization
- Progressive complexity from basic usage to advanced development
- Focus on copy-paste examples and practical workflows

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

## AI Development Anti-Patterns and Solutions

### 🚨 CRITICAL: Avoid These Common AI Development Anti-Patterns

Based on lessons learned during this project's development, future Claude instances must avoid these specific anti-patterns:

#### Anti-Pattern: "Fire and Forget" Functions
**NEVER implement async operations with `.catch(() => {})` patterns**

```typescript
// ❌ WRONG: "Fire and forget" anti-pattern
async doSomething(): void {
  this.someAsyncOperation().catch(() => {
    // Silently ignore failures
  })
}

// ✅ CORRECT: Proper async handling
async doSomething(): Promise<void> {
  try {
    await this.someAsyncOperation()
  } catch (error) {
    // Handle errors appropriately
  }
}
```

**Why this is wrong:**
- Creates untestable code
- Silently fails without proper error handling
- Makes debugging extremely difficult
- Violates user expectations for proper async behavior

#### Anti-Pattern: Code Standards Violations
**ALWAYS follow established project standards, even if they seem restrictive**

```typescript
// ❌ WRONG: Using 'any' types (banned in this project)
const result: any = await apiCall()

// ❌ WRONG: Non-null assertion operator (banned in this project)
const value = arrayResult.find(x => x.id === id)!

// ✅ CORRECT: Proper type safety
const result: ApiResponse = await apiCall()
const value = arrayResult.find(x => x.id === id)
if (!value) {
  throw new Error('Value not found')
}
```

**Key reminders:**
- This project has ZERO TOLERANCE for `any` types
- Non-null assertions (`!`) are banned - use proper null checks
- Comments should only explain "why", never "what"
- Follow the exact commit message format specified

#### Anti-Pattern: Over-Engineering Solutions
**Start with the simplest solution that meets requirements**

```typescript
// ❌ WRONG: Over-engineered solution
class AdvancedCacheWithAnalyticsAndConfigurationManagement {
  private analytics: AnalyticsEngine
  private configuration: ConfigurationManager
  private multiTierStorage: MultiTierStorageEngine
  // ... 200 lines of complexity
}

// ✅ CORRECT: Simple, maintainable solution
class FileCacheManager {
  async get<T>(key: string): Promise<T | undefined>
  async set<T>(key: string, value: T, ttlMs: number): Promise<void>
  // ... focused, single-responsibility implementation
}
```

**When user says "simple file-based cache", they mean SIMPLE.**

#### Pattern: Continuous Standards Adherence
**ALWAYS double-check against established standards before implementation**

Before writing any code:
1. ✅ Check CLAUDE.md for project-specific rules
2. ✅ Verify TypeScript strictness settings are honored
3. ✅ Ensure lint rules are followed
4. ✅ Confirm async patterns are proper (no fire-and-forget)
5. ✅ Validate that git workflow rules are respected

#### Pattern: Immediate Error Response
**When user points out violations, acknowledge and fix immediately**

When user says things like:
- "You've violated a lot of code standards"
- "WHY ANY"
- "You're now casting things as `any` - why!?"

**Response pattern:**
1. Immediately acknowledge the violation
2. Fix ALL instances of the anti-pattern
3. Implement safeguards to prevent recurrence
4. Do NOT justify or explain the violation

### Caching Implementation Lessons

The file-based caching implementation (Issue #23) was successfully restored and revealed that:

1. **User requirements should be taken literally** - When they say "simple", don't add analytics or complex configuration
2. **Async patterns matter** - Proper `await` is always better than fire-and-forget
3. **Standards adherence is non-negotiable** - Code standards exist for good reasons and must be followed
4. **Testing validates implementation** - Comprehensive tests catch architectural issues early

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