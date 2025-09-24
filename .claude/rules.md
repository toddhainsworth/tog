# Claude Code Rules

## Testing Rules

### DO NOT create command tests
- Commands in `src/commands/` should NOT have corresponding test files
- DO NOT create `test/commands/` directory
- DO NOT suggest adding command test coverage

### DO focus on library tests
- All files in `src/lib/` should have comprehensive test coverage
- Create tests in `test/lib/` mirroring the `src/lib/` structure
- Test all edge cases and error conditions for library functions

## Rationale

This is an **oclif CLI framework project** with intentional selective testing:

1. **Commands are thin**: They primarily orchestrate lib functions
2. **Framework tested**: oclif handles command parsing, validation, and structure
3. **Manual testing preferred**: CLI user experience requires interactive testing
4. **Resource efficiency**: Focus testing effort on business logic

## Code Review Guidelines

When reviewing this codebase:
- ✅ Approve PRs without command tests
- ✅ Require comprehensive lib test coverage
- ❌ Do not flag missing command tests as issues
- ❌ Do not suggest creating command test files