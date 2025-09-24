# Testing Configuration

This oclif CLI project follows a selective testing approach:

## Test Coverage Policy

- **Commands (`src/commands/`)**: NOT tested
  - Commands are thin wrappers around lib functions
  - oclif framework handles command parsing and validation
  - Focus on manual testing of CLI functionality

- **Library (`src/lib/`)**: Fully tested
  - Core business logic requires comprehensive test coverage
  - API clients, utilities, and data transformations
  - All edge cases and error conditions

## Rationale

1. **oclif Best Practices**: Commands are typically thin and framework-handled
2. **Test Efficiency**: Focus testing effort on business logic
3. **Manual Testing**: CLI commands are better tested through user interaction
4. **Maintenance**: Reduces test maintenance overhead for UI changes

## Test Commands

```bash
# Run all tests
yarn test

# Run specific lib tests
yarn test test/lib/specific-file.test.ts
```