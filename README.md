tog
=================

A modern CLI for Toggl time tracking with enhanced user experience


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

## Features

- 🚀 **Modern CLI UX** - Enhanced prompts with arrow-key navigation and spinners
- ⏱️ **Timer Management** - Start, stop, and check status of Toggl timers
- 📊 **Project Integration** - Select from your Toggl projects and tasks
- 🔧 **Easy Setup** - Simple configuration with API token validation
- 💫 **Loading Indicators** - Visual feedback for all API operations

## Quick Start

1. **Install** (when published to npm):
   ```bash
   npm install -g tog
   ```

2. **Configure** with your Toggl API token:
   ```bash
   tog init
   ```

3. **Start tracking time**:
   ```bash
   tog start
   ```

4. **Check current timer**:
   ```bash
   tog current
   ```

5. **Stop timer**:
   ```bash
   tog stop
   ```

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g tog
$ tog COMMAND
running command...
$ tog (--version)
tog/0.0.0 darwin-arm64 node-v22.14.0
$ tog --help [COMMAND]
USAGE
  $ tog COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tog current`](#tog-current)
* [`tog help [COMMAND]`](#tog-help-command)
* [`tog init`](#tog-init)
* [`tog nuke`](#tog-nuke)
* [`tog ping`](#tog-ping)
* [`tog start`](#tog-start)
* [`tog stop`](#tog-stop)

## `tog current`

Show currently running timer

```
USAGE
  $ tog current

DESCRIPTION
  Show currently running timer

EXAMPLES
  $ tog current
```

_See code: [src/commands/current.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/current.ts)_

## `tog help [COMMAND]`

Display help for tog.

```
USAGE
  $ tog help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for tog.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.33/src/commands/help.ts)_

## `tog init`

Initialize Toggl CLI with API token

```
USAGE
  $ tog init [-v]

FLAGS
  -v, --validate  Validate API token by testing connection to Toggl API

DESCRIPTION
  Initialize Toggl CLI with API token

EXAMPLES
  $ tog init

  $ tog init --validate
```

_See code: [src/commands/init.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/init.ts)_

## `tog nuke`

Delete Toggl CLI configuration

```
USAGE
  $ tog nuke

DESCRIPTION
  Delete Toggl CLI configuration

EXAMPLES
  $ tog nuke
```

_See code: [src/commands/nuke.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/nuke.ts)_

## `tog ping`

Test connection to Toggl API using stored token

```
USAGE
  $ tog ping [--json]

FLAGS
  --json  Format output as json

DESCRIPTION
  Test connection to Toggl API using stored token

EXAMPLES
  $ tog ping
```

_See code: [src/commands/ping.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/ping.ts)_

## `tog start`

Start a new time tracking timer

```
USAGE
  $ tog start

DESCRIPTION
  Start a new time tracking timer

EXAMPLES
  $ tog start
```

_See code: [src/commands/start.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/start.ts)_

## `tog stop`

Stop the currently running timer

```
USAGE
  $ tog stop

DESCRIPTION
  Stop the currently running timer

EXAMPLES
  $ tog stop
```

_See code: [src/commands/stop.ts](https://github.com/toddhainsworth/tog/blob/v0.0.0/src/commands/stop.ts)_
<!-- commandsstop -->

## 🤖 AI-Powered Development Experiment

This project serves as a comprehensive case study in AI-assisted software development, exploring how far we could push modern AI capabilities using [Claude Code](https://claude.ai/code). The entire codebase was created through a structured collaboration between human strategic guidance and AI implementation.

### Development Workflow

Our AI-assisted development process followed a structured, professional approach:

1. **PRD-Driven Development**: Each feature began with a Product Requirements Document (PRD) that outlined objectives, technical requirements, and acceptance criteria
2. **Collaborative Refinement**: Human and AI worked together to refine requirements, discuss implementation approaches, and clarify technical details
3. **AI Implementation**: Claude Code handled all coding tasks including implementation, testing, and tooling configuration
4. **Human Code Review**: The human developer provided feedback, caught issues, and guided architectural decisions
5. **Iterative Improvement**: Based on feedback, Claude Code refined the implementation until acceptance criteria were met

### What This Demonstrates

Claude Code successfully handled complex software development tasks including:

- **Architecture from scratch** - Complete CLI application structure following industry best practices
- **Full-stack implementation** - TypeScript code, comprehensive tests, build configurations, and dependency management
- **Production-ready patterns** - Error handling, interactive UX, API integration, and user feedback systems
- **Code quality maintenance** - Zero linting errors, strong TypeScript typing, and clean codebase organization
- **Development lifecycle** - Git history, semantic versioning, release management, and documentation

### Human vs AI Contributions

**Human contributions:**
- Initial project requirements and vision
- PRD creation and requirements refinement
- Code review and quality feedback
- Strategic architectural guidance
- Release management oversight

**Claude contributions:**
- All code implementation (100% of TypeScript, tests, configs)
- PRD technical details and acceptance criteria
- Package selection and dependency management
- Error handling patterns and user experience design
- Git commit history and documentation
- Problem-solving and debugging implementation issues

### Challenges and Limitations

While Claude Code handled most development tasks effectively, some challenges emerged:

**Context Retention:**
- Occasionally overlooked established project conventions documented in CLAUDE.md
- Required reminders about coding standards (e.g., avoiding `any` types, commit message formats)
- Sometimes needed re-direction when deviating from agreed architectural patterns

**Long-term Memory:**
- In longer development sessions, earlier decisions or constraints could be forgotten
- Required periodic reinforcement of project-specific rules and preferences
- Benefited from clear, immediate feedback when straying from established patterns

**Complex Decision Making:**
- Needed human guidance for strategic architectural decisions
- Required clarification when multiple valid implementation approaches existed
- Best performance came with clear, specific requirements rather than open-ended tasks

**Mitigation Strategies:**
- **CLAUDE.md documentation** provided persistent project context and standards
- **PRD-driven approach** broke complex features into manageable, well-defined tasks
- **Regular human code review** caught deviations and maintained quality standards
- **Iterative feedback loops** allowed for quick course corrections

This experiment demonstrates that AI can now handle the full software development lifecycle for real-world applications while maintaining high code quality through structured human oversight and clear documentation of project standards.
