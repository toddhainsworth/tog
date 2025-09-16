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
- Each command extends `Command` from `@oclif/core`
- Commands use static properties for `args`, `flags`, `description`, and `examples`
- Command structure follows the pattern: `src/commands/[topic]/[command].ts`

### Configuration
- **TypeScript**: ES2022 target with Node16 modules, strict mode enabled
- **Testing**: Mocha with ts-node/register for TypeScript support
- **Linting**: ESLint with oclif config and Prettier integration
- **Package Manager**: Yarn (specified in packageManager field)

### Key Dependencies
- `@oclif/core` - Core oclif framework
- `@oclif/plugin-help` - Help system
- `@oclif/plugin-plugins` - Plugin management

### Build Output
- Compiled code goes to `dist/`
- Entry point: `dist/index.js`
- Binary: `./bin/run.js`

## Testing
- Test files in `test/` directory mirror `src/` structure
- Uses Mocha with TypeScript support via ts-node
- Tests have 60-second timeout configured
- Use `@oclif/test` for oclif-specific testing utilities

## Documentation
- PRDs (Product Requirements Documents) are stored in `docs/prd/`